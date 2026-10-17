<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServicePlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServicePlan>
 */
class ServicePlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'slug' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(),
            'price_amount' => fake()->numberBetween(300, 900),
            'price_format' => fake()->randomElement(['fixed', 'from']),
            'currency' => 'USD',
            'duration' => fake()->randomElement(['1 месяц', '2–3 месяца', '3–4 месяца']),
            'included_revisions' => 3,
            'extra_revision_price' => 10,
            'features' => [fake()->sentence(), fake()->sentence()],
            'extras' => [],
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}
