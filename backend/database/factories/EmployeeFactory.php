<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'slug' => fake()->unique()->slug(),
            'name' => fake()->name(),
            'position' => fake()->jobTitle(),
            'department' => fake()->randomElement(['management', 'it', 'product', 'design', 'marketing', 'sales', 'hr', 'finance', 'operations', 'support']),
            'short_bio' => fake()->sentence(),
            'is_public' => true,
            'sort_order' => 0,
        ];
    }
}
