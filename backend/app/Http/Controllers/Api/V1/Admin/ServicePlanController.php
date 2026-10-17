<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServicePlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServicePlanController extends Controller
{
    public function store(Request $request, Service $service): JsonResponse
    {
        $plan = $service->plans()->create($this->validated($request, $service));

        return response()->json(['data' => $plan], 201);
    }

    public function update(Request $request, ServicePlan $servicePlan): JsonResponse
    {
        $servicePlan->update($this->validated($request, $servicePlan->service, $servicePlan));

        return response()->json(['data' => $servicePlan->fresh()]);
    }

    public function destroy(ServicePlan $servicePlan): JsonResponse
    {
        $servicePlan->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, Service $service, ?ServicePlan $plan = null): array
    {
        $required = $plan ? 'sometimes' : 'required';
        $validated = $request->validate([
            'slug' => [$required, 'alpha_dash:ascii', 'max:120', Rule::unique('service_plans')->where('service_id', $service->id)->ignore($plan?->id)],
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price_amount' => [$required, 'numeric', 'min:0', 'max:99999999.99'],
            'price_format' => [$required, Rule::in(['fixed', 'from'])],
            'currency' => [$required, 'string', 'size:3'],
            'duration' => [$required, 'string', 'max:255'],
            'included_revisions' => ['nullable', 'integer', 'min:0', 'max:100'],
            'extra_revision_price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'features' => ['nullable', 'array', 'max:50'],
            'features.*' => ['string', 'max:500'],
            'extras' => ['nullable', 'array', 'max:30'],
            'extras.*.name' => ['required', 'string', 'max:255'],
            'extras.*.price_label' => ['required', 'string', 'max:120'],
            'extras.*.price_amount' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'notice' => ['nullable', 'string', 'max:5000'],
            'sort_order' => ['integer', 'min:0', 'max:10000'],
            'is_active' => ['boolean'],
        ]);

        return $this->clean($validated);
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function clean(array $values): array
    {
        return array_map(function (mixed $value): mixed {
            if (is_array($value)) {
                return $this->clean($value);
            }

            return is_string($value) ? trim(strip_tags($value)) : $value;
        }, $values);
    }
}
