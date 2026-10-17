<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_name' => fake()->name(),
            'client_email' => fake()->safeEmail(),
            'description' => fake()->paragraph(),
            'status' => 'new',
            'currency' => 'UZS',
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (): array => ['status' => 'completed', 'completed_at' => now()]);
    }
}
