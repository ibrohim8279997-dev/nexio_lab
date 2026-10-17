<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Service;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_only_published_services_without_internal_ids(): void
    {
        Service::factory()->published()->create(['slug' => 'public-service']);
        Service::factory()->create(['slug' => 'private-service']);

        $this->getJson('/api/v1/services')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'public-service')
            ->assertJsonMissing(['slug' => 'private-service'])
            ->assertJsonMissingPath('data.0.id');
    }

    public function test_project_media_paths_are_returned_as_public_urls(): void
    {
        Project::query()->create([
            'slug' => 'portfolio-project',
            'title' => 'Portfolio project',
            'description' => 'A real project.',
            'category' => 'Web',
            'images' => ['media/2026/10/project.webp'],
            'links' => [],
            'is_published' => true,
        ]);

        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonPath('data.0.images.0', asset('storage/media/2026/10/project.webp'));
    }
}
