<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AdminAuthenticationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_staff_login_creates_an_authenticated_session(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->postJson('/api/v1/admin/auth/login', ['email' => $staff->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.role', 'staff');

        $this->assertAuthenticatedAs($staff);
    }

    public function test_administrator_login_authenticates_without_a_second_factor(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $this->postJson('/api/v1/admin/auth/login', ['email' => $owner->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.role', 'owner');

        $this->assertAuthenticatedAs($owner);
    }
}
