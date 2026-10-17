<?php

namespace Database\Factories;

use App\Models\ClientAccess;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClientAccess>
 */
class ClientAccessFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'token_hash' => hash('sha256', fake()->unique()->uuid()),
            'expires_at' => now()->addDay(),
        ];
    }
}
