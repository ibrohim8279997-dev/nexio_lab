<?php

namespace Tests\Feature;

use App\Models\ClientAccess;
use App\Models\Order;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ClientAccessTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_exchanges_invite_once_and_returns_410_on_reuse(): void
    {
        $token = str_repeat('a', 64);
        ClientAccess::factory()->create(['token_hash' => hash('sha256', $token)]);

        $this->postJson('/api/v1/client/access/exchange', ['token' => $token])
            ->assertOk()
            ->assertCookie('nexio_client_session');

        $this->postJson('/api/v1/client/access/exchange', ['token' => $token])
            ->assertGone()
            ->assertJsonPath('error.code', 'CLIENT_INVITE_GONE');
    }

    public function test_returns_410_when_invite_is_expired(): void
    {
        $token = str_repeat('b', 64);
        ClientAccess::factory()->create(['token_hash' => hash('sha256', $token), 'expires_at' => now()->subMinute()]);

        $this->postJson('/api/v1/client/access/exchange', ['token' => $token])->assertGone();
    }

    public function test_returns_only_order_bound_to_client_cookie(): void
    {
        $ownedOrder = Order::factory()->create();
        $otherOrder = Order::factory()->create();
        $this->exchangeInviteFor($ownedOrder, str_repeat('c', 64));

        $this->getJson('/api/v1/client/order')
            ->assertOk()
            ->assertJsonPath('data.public_id', $ownedOrder->public_id)
            ->assertJsonMissing(['public_id' => $otherOrder->public_id]);
    }

    public function test_returns_409_when_review_is_submitted_before_completion(): void
    {
        $order = Order::factory()->create(['status' => 'in_progress']);
        $this->exchangeInviteFor($order, str_repeat('d', 64));

        $this->postJson('/api/v1/client/order/review', ['rating' => 5, 'text' => 'Great work'])
            ->assertConflict()
            ->assertJsonPath('error.code', 'ORDER_NOT_COMPLETED');
    }

    public function test_completed_order_accepts_one_pending_review(): void
    {
        $order = Order::factory()->completed()->create();
        $this->exchangeInviteFor($order, str_repeat('e', 64));

        $this->postJson('/api/v1/client/order/review', ['rating' => 5, 'text' => '<b>Great</b> work'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');
        $this->assertDatabaseHas('reviews', ['order_id' => $order->id, 'text' => 'Great work', 'status' => 'pending']);
    }

    private function exchangeInviteFor(Order $order, string $token): void
    {
        ClientAccess::factory()->for($order)->create(['token_hash' => hash('sha256', $token)]);
        $response = $this->postJson('/api/v1/client/access/exchange', ['token' => $token]);
        $cookie = $response->getCookie('nexio_client_session', false);
        $this->assertDatabaseHas('client_accesses', ['order_id' => $order->id, 'session_hash' => hash('sha256', $cookie->getValue())]);
        $this->withCredentials()
            ->withUnencryptedCookie('nexio_client_session', $cookie->getValue());
    }
}
