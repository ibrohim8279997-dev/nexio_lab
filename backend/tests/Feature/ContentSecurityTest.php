<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ContentSecurityTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_previous_employee_slug_redirects_to_the_current_slug(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $employee = Employee::factory()->create(['slug' => 'old-profile']);

        $this->actingAs($owner)->putJson('/api/v1/admin/employees/'.$employee->id, ['slug' => 'new-profile'])
            ->assertOk();

        $this->get('/api/v1/employees/old-profile')
            ->assertRedirect('/api/v1/employees/new-profile');
    }

    public function test_media_upload_rejects_a_file_with_a_forged_image_mime_type(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $fakeImage = UploadedFile::fake()->createWithContent('payload.jpg', '<?php echo "unsafe";');

        $this->actingAs($owner)->postJson('/api/v1/admin/media', ['image' => $fakeImage])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED');
    }

    public function test_owner_can_create_an_employee_in_a_design_department(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $this->actingAs($owner)->postJson('/api/v1/admin/employees', [
            'slug' => 'lead-designer',
            'name' => 'Lead Designer',
            'position' => 'Lead Product Designer',
            'department' => 'design',
            'is_public' => true,
        ])->assertCreated()
            ->assertJsonPath('data.department', 'design');

        $this->assertDatabaseHas('employees', [
            'slug' => 'lead-designer',
            'department' => 'design',
        ]);
    }
}
