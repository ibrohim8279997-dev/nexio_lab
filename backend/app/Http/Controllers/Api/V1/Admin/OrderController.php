<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientAccess;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $this->scopedQuery($request)
            ->with('service', 'employees')
            ->withExists(['clientAccesses as client_access_active' => fn (Builder $builder): Builder => $builder
                ->whereNull('revoked_at')
                ->where('expires_at', '>', now())]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = '%'.addcslashes($request->string('search')->toString(), '%_').'%';
            $query->where(fn (Builder $builder) => $builder->where('client_name', 'like', $search)->orWhere('client_email', 'like', $search)->orWhere('public_id', $request->string('search')));
        }

        $paginator = $query->latest()->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return response()->json(['data' => $paginator->items(), 'meta' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()], 'links' => ['prev' => $paginator->previousPageUrl(), 'next' => $paginator->nextPageUrl()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertAdministrator($request);
        $validated = $request->validate(['service_id' => ['nullable', 'exists:services,id'], 'client_name' => ['required', 'string', 'max:255'], 'client_email' => ['required', 'email', 'max:255'], 'client_phone' => ['nullable', 'string', 'max:50'], 'description' => ['nullable', 'string', 'max:30000'], 'agreed_price' => ['nullable', 'numeric', 'min:0'], 'currency' => ['required', 'string', 'size:3'], 'due_at' => ['nullable', 'date']]);
        $validated['description'] = isset($validated['description']) ? strip_tags($validated['description']) : null;
        $order = Order::query()->create($validated);
        $order->statusHistory()->create(['user_id' => $request->user()->id, 'to_status' => 'new']);

        return response()->json(['data' => $order], 201);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $order = $this->findScoped($request, $order);

        return response()->json(['data' => $order->load('service', 'employees', 'statusHistory')]);
    }

    public function assignees(Request $request, Order $order): JsonResponse
    {
        $this->assertAdministrator($request);
        $validated = $request->validate(['employee_ids' => ['required', 'array', 'max:30'], 'employee_ids.*' => ['integer', 'exists:employees,id']]);
        $order->employees()->sync($validated['employee_ids']);

        return response()->json(['data' => $order->load('employees')]);
    }

    public function status(Request $request, Order $order): JsonResponse
    {
        $order = $this->findScoped($request, $order);
        $validated = $request->validate(['status' => ['required', Rule::in(['new', 'briefing', 'in_progress', 'review', 'completed', 'cancelled'])], 'note' => ['nullable', 'string', 'max:2000']]);

        DB::transaction(function () use ($order, $validated, $request): void {
            $oldStatus = $order->status;
            $order->update(['status' => $validated['status'], 'completed_at' => $validated['status'] === 'completed' ? now() : null]);
            OrderStatusHistory::query()->create(['order_id' => $order->id, 'user_id' => $request->user()->id, 'from_status' => $oldStatus, 'to_status' => $validated['status'], 'note' => isset($validated['note']) ? strip_tags($validated['note']) : null]);
        });

        return response()->json(['data' => $order->fresh()->load('statusHistory')]);
    }

    public function history(Request $request, Order $order): JsonResponse
    {
        $order = $this->findScoped($request, $order);

        return response()->json(['data' => $order->statusHistory()->oldest()->get()]);
    }

    public function clientAccess(Request $request, Order $order): JsonResponse
    {
        $this->assertAdministrator($request);
        $validated = $request->validate(['expires_in_hours' => ['nullable', 'integer', 'between:1,168']]);
        $token = Str::random(96);

        DB::transaction(function () use ($order, $token, $validated, $request): void {
            $order->clientAccesses()->whereNull('revoked_at')->update(['revoked_at' => now(), 'session_hash' => null]);
            ClientAccess::query()->create(['order_id' => $order->id, 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addHours($validated['expires_in_hours'] ?? 48), 'issued_ip' => $request->ip()]);
        });

        $invitationUrl = rtrim(config('app.frontend_url'), '/').'/client/access#token='.$token;

        return response()->json(['data' => ['url' => $invitationUrl, 'invitation_url' => $invitationUrl, 'expires_at' => now()->addHours($validated['expires_in_hours'] ?? 48)->toISOString()]], 201);
    }

    public function revokeClientAccess(Request $request, Order $order): JsonResponse
    {
        $this->assertAdministrator($request);
        $order->clientAccesses()->whereNull('revoked_at')->update(['revoked_at' => now(), 'session_hash' => null]);

        return response()->json(['data' => ['revoked' => true]]);
    }

    private function scopedQuery(Request $request): Builder
    {
        $query = Order::query();

        if ($request->user()->role === 'staff') {
            $query->whereHas('employees', fn (Builder $builder) => $builder->where('user_id', $request->user()->id));
        }

        return $query;
    }

    private function findScoped(Request $request, Order $order): Order
    {
        return $this->scopedQuery($request)->whereKey($order->getKey())->firstOrFail();
    }

    private function assertAdministrator(Request $request): void
    {
        abort_unless(in_array($request->user()->role, ['owner', 'admin'], true), 403);
    }
}
