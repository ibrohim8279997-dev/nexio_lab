<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_when_anonymous_user_reads_crm_orders(): void
    {
        $this->get('/api/v1/admin/orders')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'UNAUTHENTICATED');
    }

    public function test_returns_404_when_staff_reads_unassigned_order(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Employee::factory()->create(['user_id' => $staff->id]);
        $order = Order::factory()->create();

        $this->actingAs($staff)->getJson('/api/v1/admin/orders/'.$order->id)->assertNotFound();
    }

    public function test_returns_assigned_order_to_staff(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $employee = Employee::factory()->create(['user_id' => $staff->id]);
        $order = Order::factory()->create();
        $order->employees()->attach($employee);

        $this->actingAs($staff)->getJson('/api/v1/admin/orders/'.$order->id)
            ->assertOk()
            ->assertJsonPath('data.public_id', $order->public_id);
    }

    public function test_returns_403_when_staff_creates_order(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->postJson('/api/v1/admin/orders', [])->assertForbidden();
    }
}
