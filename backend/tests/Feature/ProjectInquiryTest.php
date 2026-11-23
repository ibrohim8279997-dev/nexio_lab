<?php

use App\Jobs\SendInquiryToCrm;
use App\Models\ProjectInquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

function inquiryPayload(array $o = []): array
{
    return array_merge([
        'submission_id' => (string) Str::uuid(), 'client_name' => 'Test Client', 'phone' => '+998901234567',
        'email' => 'client@example.com', 'telegram' => '@testclient', 'contact_method' => 'telegram',
        'project_type' => 'website', 'project_title' => 'Corporate site', 'project_description' => 'We need a corporate website with a catalogue.',
        'required_functionality' => 'Catalogue, forms', 'estimated_budget' => '500_1000', 'currency' => 'USD', 'timeframe' => '1 month',
        'source_url' => 'https://nexiolab.uz/contacts', 'utm_source' => 'google', 'utm_medium' => 'cpc', 'utm_campaign' => 'spring',
    ], $o);
}

class ProjectInquiryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.nexio_crm.url' => 'https://crm.example.test/api/inbound/leads', 'services.nexio_crm.secret' => 'top-secret']);
    }

    public function test_delivers_inquiry_to_CRM_with_mapped_fields_auth_and_source(): void
    {
    Http::fake(['crm.example.test/*' => Http::response(['id' => 'lead-42'], 201)]);

    $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertCreated()->assertJsonPath('data.status', 'delivered');

    Http::assertSent(function ($r) {
        return $r->hasHeader('Authorization', 'Bearer top-secret')
            && $r['source'] === 'Website / NexioLab.uz' && $r['contact_name'] === 'Test Client' && $r['title'] === 'Corporate site'
            && str_contains($r['notes'], 'Project type: website') && str_contains($r['notes'], 'utm_campaign=spring')
            && str_contains($r['notes'], 'Budget: 500_1000 USD') && Str::isUuid($r['external_order_id'])
            && $r->hasHeader('Idempotency-Key', $r['external_order_id']);
    });
    $i = ProjectInquiry::first();
        $this->assertSame('delivered', $i->status);
        $this->assertSame('lead-42', $i->crm_lead_id);
    }

    public function test_duplicate_submission_id_never_creates_a_second_lead(): void
    {
    Http::fake(['*' => Http::response(['id' => 1], 201)]);
    $p = inquiryPayload();
    $this->postJson('/api/v1/project-inquiries', $p)->assertCreated();
    $this->postJson('/api/v1/project-inquiries', $p)->assertCreated();
    $this->assertSame(1, ProjectInquiry::count());
    Http::assertSentCount(1);
    }

    public function test_temporary_CRM_failure_is_queued_and_never_reported_as_delivered(): void
    {
    Queue::fake();
    Http::fake(['*' => Http::response('down', 503)]);
    $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertAccepted()->assertJsonPath('data.status', 'queued');
    $this->assertSame('pending', ProjectInquiry::first()->status);
    Queue::assertPushed(SendInquiryToCrm::class);
    }

    public function test_queued_retry_delivers_once_CRM_recovers(): void
    {
    Queue::fake();
    Http::fake(['*' => Http::sequence()->push('down', 503)->push(['id' => 7], 200)]);
    $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertAccepted();
    (new SendInquiryToCrm(ProjectInquiry::first()->id))->handle(app(App\Services\CrmClient::class));
    $i = ProjectInquiry::first();
        $this->assertSame('delivered', $i->status);
        $this->assertSame(2, (int) $i->attempts);
    }

    public function test_missing_CRM_configuration_keeps_inquiry_pending_not_delivered(): void
    {
    Queue::fake();
    config(['services.nexio_crm.url' => null]);
    $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertAccepted()->assertJsonPath('data.status', 'queued');
    }

    public function test_requires_at_least_one_contact_method_and_the_preferred_one(): void
    {
    $this->postJson('/api/v1/project-inquiries', inquiryPayload(['phone' => null, 'email' => null, 'telegram' => null]))->assertUnprocessable();
    $this->postJson('/api/v1/project-inquiries', inquiryPayload(['contact_method' => 'email', 'email' => null]))->assertUnprocessable();
    }

    public function test_honeypot_submissions_are_dropped_silently(): void
    {
    Http::fake();
    $this->postJson('/api/v1/project-inquiries', inquiryPayload(['company_website' => 'spam.io']))->assertAccepted();
    $this->assertSame(0, ProjectInquiry::count());
    Http::assertNothingSent();
    }

    public function test_personal_data_is_encrypted_at_rest_and_secret_is_never_in_the_response(): void
    {
    Http::fake(['*' => Http::response(['id' => 1], 201)]);
    $res = $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertCreated();
    $this->assertStringNotContainsString('top-secret', $res->getContent());
        $this->assertStringNotContainsString('client@example.com', $res->getContent());
    $this->assertStringNotContainsString('client@example.com', DB::table('project_inquiries')->value('email'));
    }

    public function test_rate_limit_applies(): void
    {
    Http::fake(['*' => Http::response(['id' => 1], 201)]);
    for ($i = 0; $i < 3; $i++) { $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertCreated(); }
    $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertStatus(429);
    }

    public function test_html_200_from_wrong_url_is_not_treated_as_delivered(): void
    {
        Http::fake(['*' => Http::response('<!doctype html><html></html>', 200, ['Content-Type' => 'text/html'])]);
        $this->postJson('/api/v1/project-inquiries', inquiryPayload())->assertAccepted()->assertJsonPath('data.status', 'failed');
        $this->assertSame('failed', ProjectInquiry::first()->status);
    }
}
