<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach ([
            ['slug' => 'web', 'name' => 'Веб-сайты', 'short_description' => 'Шаблонные и индивидуальные сайты для бизнеса.'],
            ['slug' => 'systems', 'name' => 'Системы', 'short_description' => 'CRM, складской учёт и системы управления бизнесом.'],
            ['slug' => 'applications', 'name' => 'Приложения', 'short_description' => 'Android APK и Windows-приложения под ключ.'],
        ] as $sortOrder => $service) {
            Service::query()->updateOrCreate(['slug' => $service['slug']], [...$service, 'description' => $service['short_description'], 'sort_order' => $sortOrder, 'is_published' => true]);
        }

        SiteSetting::query()->firstOrCreate([], ['slogan' => 'Future Starts Here', 'intro_text' => 'Nexio Lab demo content. Replace before launch.', 'about_text' => 'We create websites and applications. Replace this demo content before launch.', 'availability_text' => 'Working online', 'address_confirmed' => false]);
        $this->call(ServicePlanSeeder::class);

        if (env('ADMIN_EMAIL') && env('ADMIN_PASSWORD')) {
            User::query()->updateOrCreate(['email' => env('ADMIN_EMAIL')], ['name' => env('ADMIN_NAME', 'Nexio Lab Owner'), 'password' => env('ADMIN_PASSWORD'), 'role' => 'owner']);
        }
    }
}
