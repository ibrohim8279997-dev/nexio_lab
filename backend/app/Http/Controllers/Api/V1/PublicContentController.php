<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSlug;
use App\Models\Project;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServicePlan;
use App\Models\SiteSetting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PublicContentController extends Controller
{
    public function site(): JsonResponse
    {
        $site = SiteSetting::query()->first();

        return response()->json(['data' => $site ? $this->siteData($site) : null]);
    }

    public function home(): JsonResponse
    {
        return response()->json(['data' => [
            'site' => optional(SiteSetting::query()->first(), fn (SiteSetting $site): array => $this->siteData($site)),
            'services' => Service::query()->with(['plans' => fn ($query) => $query->where('is_active', true)])->where('is_published', true)->orderBy('sort_order')->limit(6)->get()->map(fn (Service $service): array => $this->serviceData($service)),
            'projects' => Project::query()->where('is_published', true)->orderBy('sort_order')->limit(6)->get()->map(fn (Project $project): array => $this->projectData($project)),
            'employees' => Employee::query()->where('is_public', true)->orderBy('sort_order')->limit(6)->get()->map(fn (Employee $employee): array => $this->employeeData($employee)),
            'reviews' => Review::query()->with('employee')->where('status', 'approved')->latest('published_at')->limit(6)->get()->map(fn (Review $review): array => $this->reviewData($review)),
        ]]);
    }

    public function services(Request $request): JsonResponse
    {
        return $this->paginated(Service::query()->with(['plans' => fn ($query) => $query->where('is_active', true)])->where('is_published', true)->orderBy('sort_order'), $request, fn (Service $service): array => $this->serviceData($service));
    }

    public function service(string $slug): JsonResponse
    {
        $service = Service::query()->with(['plans' => fn ($query) => $query->where('is_active', true)])->where('slug', $slug)->where('is_published', true)->firstOrFail();

        return response()->json(['data' => $this->serviceData($service, true)]);
    }

    public function projects(Request $request): JsonResponse
    {
        return $this->paginated(Project::query()->where('is_published', true)->orderBy('sort_order'), $request, fn (Project $project): array => $this->projectData($project));
    }

    public function project(string $slug): JsonResponse
    {
        $project = Project::query()->where('slug', $slug)->where('is_published', true)->firstOrFail();

        return response()->json(['data' => $this->projectData($project)]);
    }

    public function employees(Request $request): JsonResponse
    {
        return $this->paginated(Employee::query()->where('is_public', true)->orderBy('sort_order'), $request, fn (Employee $employee): array => $this->employeeData($employee));
    }

    public function employee(string $slug): JsonResponse|RedirectResponse
    {
        $employee = Employee::query()->where('slug', $slug)->where('is_public', true)->first();

        if (! $employee) {
            $previous = EmployeeSlug::query()->with('employee')->where('slug', $slug)->firstOrFail();
            abort_unless($previous->employee?->is_public, 404);

            return redirect()->route('public.employees.show', ['slug' => $previous->employee->slug], 301);
        }

        $employee->load(['reviews' => fn ($query) => $query->where('status', 'approved')->latest('published_at')]);

        return response()->json(['data' => $this->employeeData($employee, true)]);
    }

    public function reviews(Request $request): JsonResponse
    {
        return $this->paginated(Review::query()->with('employee')->where('status', 'approved')->latest('published_at'), $request, fn (Review $review): array => $this->reviewData($review));
    }

    private function paginated(Builder $query, Request $request, callable $transform): JsonResponse
    {
        $paginator = $query->paginate(min(max($request->integer('per_page', 12), 1), 50));

        return response()->json([
            'data' => collect($paginator->items())->map($transform)->values(),
            'meta' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()],
            'links' => ['first' => $paginator->url(1), 'last' => $paginator->url($paginator->lastPage()), 'prev' => $paginator->previousPageUrl(), 'next' => $paginator->nextPageUrl()],
        ]);
    }

    private function serviceData(Service $service, bool $detailed = false): array
    {
        $coverUrl = $service->cover_path ? asset('storage/'.$service->cover_path) : null;
        $plans = $service->relationLoaded('plans') ? $service->plans->map(fn (ServicePlan $plan): array => $this->servicePlanData($plan))->values() : collect();
        $startingPlan = $plans->sortBy('price_amount')->first();

        return array_filter(['slug' => $service->slug, 'name' => $service->name, 'short_description' => $service->short_description, 'summary' => $service->short_description, 'description' => $detailed ? $service->description : null, 'cover_url' => $coverUrl, 'cover' => $coverUrl, 'starting_price' => $startingPlan ? ['amount' => $startingPlan['price_amount'], 'format' => $startingPlan['price_format'], 'currency' => $startingPlan['currency']] : null, 'starting_duration' => $startingPlan['duration'] ?? null, 'plans' => $plans->all()], fn (mixed $value): bool => $value !== null);
    }

    private function servicePlanData(ServicePlan $plan): array
    {
        return [
            'id' => $plan->id,
            'slug' => $plan->slug,
            'name' => $plan->name,
            'description' => $plan->description,
            'price_amount' => (float) $plan->price_amount,
            'price_format' => $plan->price_format,
            'currency' => $plan->currency,
            'duration' => $plan->duration,
            'included_revisions' => $plan->included_revisions,
            'extra_revision_price' => $plan->extra_revision_price !== null ? (float) $plan->extra_revision_price : null,
            'features' => $plan->features ?? [],
            'extras' => $plan->extras ?? [],
            'notice' => $plan->notice,
        ];
    }

    private function projectData(Project $project): array
    {
        $images = collect($project->images ?? [])->map(function (string $image): string {
            if (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
                return $image;
            }

            if (str_starts_with($image, '/')) {
                return asset(ltrim($image, '/'));
            }

            return asset(str_starts_with($image, 'storage/') ? $image : 'storage/'.$image);
        })->values()->all();

        return ['slug' => $project->slug, 'title' => $project->title, 'description' => $project->description, 'category' => $project->category, 'images' => $images, 'links' => $project->links ?? []];
    }

    private function employeeData(Employee $employee, bool $detailed = false): array
    {
        $photoUrl = $employee->photo_path ? asset('storage/'.$employee->photo_path) : asset('images/employee-placeholder.svg');

        return array_filter(['slug' => $employee->slug, 'name' => $employee->name, 'position' => $employee->position, 'role' => $employee->position, 'department' => $employee->department, 'short_bio' => $employee->short_bio, 'activity' => $detailed ? $employee->activity : null, 'company_story' => $detailed ? $employee->company_story : null, 'joined_story' => $detailed ? $employee->company_story : null, 'started_at' => $employee->started_at?->toDateString(), 'photo_url' => $photoUrl, 'photo' => $photoUrl, 'reviews' => $detailed && $employee->relationLoaded('reviews') ? $employee->reviews->map(fn (Review $review): array => $this->reviewData($review))->values() : null], fn (mixed $value): bool => $value !== null);
    }

    private function reviewData(Review $review): array
    {
        return ['rating' => $review->rating, 'text' => $review->text, 'employee' => $review->employee ? ['slug' => $review->employee->slug, 'name' => $review->employee->name] : null, 'published_at' => $review->published_at?->toISOString()];
    }

    private function siteData(SiteSetting $site): array
    {
        $logoUrl = $site->logo_path ? asset('storage/'.$site->logo_path) : null;

        return ['logo_url' => $logoUrl, 'logo' => $logoUrl, 'slogan' => $site->slogan, 'intro_text' => $site->intro_text, 'hero_text' => $site->intro_text, 'about_text' => $site->about_text, 'phone' => $site->phone, 'telegram' => $site->telegram, 'whatsapp' => $site->whatsapp, 'email' => $site->email, 'availability_text' => $site->availability_text, 'online_label' => $site->availability_text, 'address' => $site->address_confirmed ? $site->address : null, 'project_inquiry' => ['employee_id' => $site->project_inquiry_employee_id, 'name' => $site->project_inquiry_name, 'position' => $site->project_inquiry_position, 'telegram' => $site->project_inquiry_telegram ?: $site->telegram, 'phone' => $site->project_inquiry_phone ?: $site->phone, 'active' => $site->project_inquiry_active]];
    }
}
