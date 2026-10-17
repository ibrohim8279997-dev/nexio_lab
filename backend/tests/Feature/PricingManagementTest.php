<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\ServicePlan;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class PricingManagementTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_database_seeder_creates_three_directions_and_six_pricing_plans(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('services', ['slug' => 'web', 'is_published' => true]);
        $this->assertDatabaseHas('services', ['slug' => 'systems', 'is_published' => true]);
        $this->assertDatabaseHas('services', ['slug' => 'applications', 'is_published' => true]);
        $this->assertDatabaseCount('service_plans', 6);
    }

    public function test_public_service_returns_only_active_pricing_plans(): void
    {
        $service = Service::factory()->published()->create(['slug' => 'pricing-test']);
        ServicePlan::factory()->for($service)->create(['slug' => 'active-plan', 'name' => 'Active plan', 'price_amount' => 350, 'is_active' => true]);
        ServicePlan::factory()->for($service)->create(['slug' => 'hidden-plan', 'is_active' => false]);

        $this->getJson('/api/v1/services/pricing-test')
            ->assertOk()
            ->assertJsonPath('data.plans.0.slug', 'active-plan')
            ->assertJsonPath('data.plans.0.price_amount', 350)
            ->assertJsonMissing(['slug' => 'hidden-plan']);
    }

    public function test_owner_can_update_a_service_plan(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $plan = ServicePlan::factory()->create(['price_amount' => 300]);

        $this->actingAs($owner)->putJson('/api/v1/admin/service-plans/'.$plan->id, [
            'price_amount' => 525,
            'price_format' => 'from',
            'duration' => '3–4 месяца',
            'features' => ['CRM', 'Аналитика'],
            'extras' => [['name' => 'Банковский шлюз', 'price_label' => 'от +$70', 'price_amount' => 70]],
            'is_active' => true,
        ])->assertOk()
            ->assertJsonPath('data.price_amount', '525.00')
            ->assertJsonPath('data.features.1', 'Аналитика');

        $this->assertDatabaseHas('service_plans', ['id' => $plan->id, 'price_amount' => 525]);
    }

    public function test_staff_cannot_update_service_pricing(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $plan = ServicePlan::factory()->create();

        $this->actingAs($staff)
            ->putJson('/api/v1/admin/service-plans/'.$plan->id, ['price_amount' => 1])
            ->assertForbidden();
    }

    public function test_rejects_an_unknown_price_format(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $plan = ServicePlan::factory()->create();

        $this->actingAs($owner)
            ->putJson('/api/v1/admin/service-plans/'.$plan->id, ['price_format' => 'negotiable'])
            ->assertUnprocessable()
            ->assertJsonPath('error.fields.price_format.0', 'The selected price format is invalid.');
    }

    public function test_public_site_returns_project_inquiry_contact_with_telegram_fallback(): void
    {
        SiteSetting::query()->firstOrCreate([])->update([
            'telegram' => '@nexio_owner',
            'project_inquiry_name' => 'Nexio Owner',
            'project_inquiry_position' => 'Project Manager',
            'project_inquiry_telegram' => null,
            'project_inquiry_active' => true,
        ]);

        $this->getJson('/api/v1/site')
            ->assertOk()
            ->assertJsonPath('data.project_inquiry.name', 'Nexio Owner')
            ->assertJsonPath('data.project_inquiry.telegram', '@nexio_owner')
            ->assertJsonPath('data.project_inquiry.active', true);
    }
}
