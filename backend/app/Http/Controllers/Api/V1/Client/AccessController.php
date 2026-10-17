<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Models\ClientAccess;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AccessController extends Controller
{
    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate(['token' => ['required', 'string', 'min:32', 'max:512']]);
        $access = ClientAccess::query()->where('token_hash', hash('sha256', $validated['token']))->first();

        if (! $access || $access->consumed_at || $access->revoked_at || $access->expires_at->isPast()) {
            return response()->json(['error' => ['code' => 'CLIENT_INVITE_GONE', 'message' => 'This invitation is invalid, expired, revoked, or already used.', 'fields' => (object) [], 'request_id' => $request->header('X-Request-Id')]], 410);
        }

        $sessionToken = Str::random(80);
        $access->forceFill(['consumed_at' => now(), 'last_used_at' => now(), 'session_hash' => hash('sha256', $sessionToken)])->save();
        $cookie = cookie('nexio_client_session', $sessionToken, max(1, now()->diffInMinutes($access->expires_at)), '/api/v1/client', null, app()->isProduction(), true, false, 'strict');

        return response()->json(['data' => ['access_granted' => true]])->cookie($cookie);
    }

    public function order(Request $request): JsonResponse
    {
        $order = $request->attributes->get('client_access')->order->load('service', 'employees');

        return response()->json(['data' => $this->orderData($order)]);
    }

    public function brief(Request $request): JsonResponse
    {
        $validated = $request->validate(['brief' => ['required', 'array', 'max:30'], 'brief.*' => ['nullable', 'string', 'max:5000']]);
        $order = $request->attributes->get('client_access')->order;
        $order->update(['brief' => collect($validated['brief'])->map(fn (mixed $value): string => strip_tags((string) $value))->all()]);

        return response()->json(['data' => $this->orderData($order->fresh()->load('service', 'employees'))]);
    }

    public function review(Request $request): JsonResponse
    {
        $validated = $request->validate(['rating' => ['required', 'integer', 'between:1,5'], 'text' => ['required', 'string', 'max:3000'], 'employee_slug' => ['nullable', 'string', 'exists:employees,slug']]);
        $order = $request->attributes->get('client_access')->order;

        if ($order->status !== 'completed' || ! $order->completed_at) {
            return response()->json(['error' => ['code' => 'ORDER_NOT_COMPLETED', 'message' => 'A review can be submitted only after order completion.', 'fields' => (object) [], 'request_id' => $request->header('X-Request-Id')]], 409);
        }

        if ($order->review()->exists()) {
            return response()->json(['error' => ['code' => 'REVIEW_ALREADY_SUBMITTED', 'message' => 'A review has already been submitted for this order.', 'fields' => (object) [], 'request_id' => $request->header('X-Request-Id')]], 409);
        }

        $employeeId = null;
        if (! empty($validated['employee_slug'])) {
            $employeeId = $order->employees()->where('slug', $validated['employee_slug'])->value('employees.id');
            abort_unless($employeeId, 422);
        }

        $review = Review::query()->create(['order_id' => $order->id, 'employee_id' => $employeeId, 'rating' => $validated['rating'], 'text' => strip_tags($validated['text']), 'status' => 'pending']);

        return response()->json(['data' => ['status' => $review->status, 'created_at' => $review->created_at->toISOString()]], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $access = $request->attributes->get('client_access');
        $access->forceFill(['session_hash' => null])->save();

        return response()->json(['data' => ['logged_out' => true]])->withoutCookie('nexio_client_session', '/api/v1/client');
    }

    private function orderData(Order $order): array
    {
        $employees = $order->employees->map(fn ($employee): array => ['slug' => $employee->slug, 'name' => $employee->name, 'position' => $employee->position, 'role' => $employee->position]);

        return ['public_id' => $order->public_id, 'service' => $order->service ? ['slug' => $order->service->slug, 'name' => $order->service->name] : null, 'description' => $order->description, 'summary' => $order->description, 'brief' => $order->brief, 'agreed_price' => $order->agreed_price, 'currency' => $order->currency, 'status' => $order->status, 'due_at' => $order->due_at?->toDateString(), 'completed_at' => $order->completed_at?->toISOString(), 'employees' => $employees, 'assignees' => $employees];
    }
}
