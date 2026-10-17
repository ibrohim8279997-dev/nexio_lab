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

    public function test_administrator_login_requires_a_second_factor_before_authentication(): void
    {
        config()->set('auth.admin_2fa_bypass', false);
        $owner = User::factory()->create([
            'role' => 'owner',
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_confirmed_at' => now(),
        ]);

        $this->postJson('/api/v1/admin/auth/login', ['email' => $owner->email, 'password' => 'password'])
            ->assertStatus(202)
            ->assertJsonPath('data.two_factor_required', true);

        $this->assertGuest();
        $this->postJson('/api/v1/admin/auth/2fa/verify', ['code' => '000000'])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'INVALID_TWO_FACTOR_CODE');
        $this->assertGuest();
    }

    public function test_local_bypass_can_authenticate_an_administrator_without_a_second_factor(): void
    {
        config()->set('auth.admin_2fa_bypass', true);
        $owner = User::factory()->create(['role' => 'owner']);

        $this->postJson('/api/v1/admin/auth/login', ['email' => $owner->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.role', 'owner');

        $this->assertAuthenticatedAs($owner);
    }
}
