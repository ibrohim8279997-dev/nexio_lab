<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSlug;
use App\Models\Project;
use App\Models\Service;
use App\Models\SiteSetting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ContentController extends Controller
{
    public function index(Request $request, string $resource): JsonResponse
    {
        $modelClass = $this->modelClass($resource);
        $query = $modelClass::query();

        if ($resource === 'services') {
            $query->with('plans');
        }

        if ($request->filled('search')) {
            $column = $resource === 'projects' ? 'title' : 'name';
            $query->where($column, 'like', '%'.addcslashes($request->string('search')->toString(), '%_').'%');
        }

        if ($request->has('published')) {
            $column = $resource === 'employees' ? 'is_public' : 'is_published';
            $query->where($column, $request->boolean('published'));
        }

        $paginator = $query->orderBy('sort_order')->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return response()->json(['data' => $paginator->items(), 'meta' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()], 'links' => ['prev' => $paginator->previousPageUrl(), 'next' => $paginator->nextPageUrl()]]);
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        $modelClass = $this->modelClass($resource);
        $record = $modelClass::query()->create($this->clean($request->validate($this->rules($resource))));

        return response()->json(['data' => $record], 201);
    }

    public function show(string $resource, int $record): JsonResponse
    {
        $query = $this->modelClass($resource)::query();

        if ($resource === 'services') {
            $query->with('plans');
        }

        return response()->json(['data' => $query->findOrFail($record)]);
    }

    public function update(Request $request, string $resource, int $record): JsonResponse
    {
        $model = $this->modelClass($resource)::query()->findOrFail($record);
        $validated = $this->clean($request->validate($this->rules($resource, $model)));

        DB::transaction(function () use ($model, $validated): void {
            if ($model instanceof Employee && isset($validated['slug']) && $validated['slug'] !== $model->slug) {
                EmployeeSlug::query()->firstOrCreate(['employee_id' => $model->id, 'slug' => $model->slug]);
            }

            $model->update($validated);
        });

        return response()->json(['data' => $model->fresh()]);
    }

    public function destroy(string $resource, int $record): JsonResponse
    {
        $model = $this->modelClass($resource)::query()->findOrFail($record);
        $model->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function site(): JsonResponse
    {
        return response()->json(['data' => SiteSetting::query()->firstOrCreate([])]);
    }

    public function updateSite(Request $request): JsonResponse
    {
        $validated = $request->validate(['logo_path' => ['nullable', 'string', 'max:2048'], 'slogan' => ['required', 'string', 'max:120'], 'intro_text' => ['nullable', 'string', 'max:5000'], 'about_text' => ['nullable', 'string', 'max:20000'], 'phone' => ['nullable', 'string', 'max:50'], 'telegram' => ['nullable', 'string', 'max:255'], 'whatsapp' => ['nullable', 'string', 'max:255'], 'email' => ['nullable', 'email', 'max:255'], 'availability_text' => ['required', 'string', 'max:120'], 'address' => ['nullable', 'string', 'max:500'], 'address_confirmed' => ['required', 'boolean'], 'project_inquiry_employee_id' => ['nullable', 'integer', 'exists:employees,id'], 'project_inquiry_name' => ['nullable', 'string', 'max:255'], 'project_inquiry_position' => ['nullable', 'string', 'max:255'], 'project_inquiry_telegram' => ['nullable', 'string', 'max:255'], 'project_inquiry_phone' => ['nullable', 'string', 'max:50'], 'project_inquiry_active' => ['required', 'boolean']]);
        $site = SiteSetting::query()->firstOrCreate([]);
        $site->update($this->clean($validated));

        return response()->json(['data' => $site->fresh()]);
    }

    private function modelClass(string $resource): string
    {
        return match ($resource) {
            'services' => Service::class,
            'projects' => Project::class,
            'employees' => Employee::class,
            default => abort(404),
        };
    }

    private function rules(string $resource, ?Model $model = null): array
    {
        $unique = fn (string $table) => Rule::unique($table, 'slug')->ignore($model?->getKey());
        $required = $model ? 'sometimes' : 'required';

        return match ($resource) {
            'services' => ['slug' => [$required, 'alpha_dash:ascii', 'max:120', $unique('services')], 'name' => [$required, 'string', 'max:255'], 'short_description' => [$required, 'string', 'max:1000'], 'description' => ['nullable', 'string', 'max:30000'], 'cover_path' => ['nullable', 'string', 'max:2048'], 'sort_order' => ['integer', 'min:0'], 'is_published' => ['boolean']],
            'projects' => ['slug' => [$required, 'alpha_dash:ascii', 'max:120', $unique('projects')], 'title' => [$required, 'string', 'max:255'], 'description' => [$required, 'string', 'max:30000'], 'category' => [$required, 'string', 'max:120'], 'images' => ['nullable', 'array', 'max:20'], 'images.*' => ['string', 'max:2048'], 'links' => ['nullable', 'array', 'max:20'], 'sort_order' => ['integer', 'min:0'], 'is_published' => ['boolean']],
            'employees' => ['user_id' => ['nullable', 'integer', 'exists:users,id', Rule::unique('employees', 'user_id')->ignore($model?->getKey())], 'slug' => [$required, 'alpha_dash:ascii', 'max:120', $unique('employees')], 'name' => [$required, 'string', 'max:255'], 'position' => [$required, 'string', 'max:255'], 'department' => [$required, Rule::in(['management', 'it', 'product', 'design', 'marketing', 'sales', 'hr', 'finance', 'operations', 'support'])], 'short_bio' => ['nullable', 'string', 'max:1000'], 'activity' => ['nullable', 'string', 'max:30000'], 'company_story' => ['nullable', 'string', 'max:30000'], 'started_at' => ['nullable', 'date'], 'photo_path' => ['nullable', 'string', 'max:2048'], 'sort_order' => ['integer', 'min:0'], 'is_public' => ['boolean']],
            default => abort(404),
        };
    }

    private function clean(array $validated): array
    {
        return collect($validated)->map(fn (mixed $value): mixed => is_string($value) ? trim(strip_tags($value)) : $value)->all();
    }
}
