<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Review;
use App\Models\ReviewModerationHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::query()->with('order', 'employee')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $paginator = $query->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return response()->json(['data' => $paginator->items(), 'meta' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()], 'links' => ['prev' => $paginator->previousPageUrl(), 'next' => $paginator->nextPageUrl()]]);
    }

    public function moderate(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate(['status' => ['required', Rule::in(['approved', 'rejected'])], 'note' => ['nullable', 'string', 'max:2000']]);
        $oldStatus = $review->status;

        DB::transaction(function () use ($review, $validated, $request, $oldStatus): void {
            $review->update(['status' => $validated['status'], 'published_at' => $validated['status'] === 'approved' ? now() : null]);
            ReviewModerationHistory::query()->create(['review_id' => $review->id, 'user_id' => $request->user()->id, 'from_status' => $oldStatus, 'to_status' => $validated['status'], 'note' => isset($validated['note']) ? strip_tags($validated['note']) : null]);
            AuditLog::query()->create(['user_id' => $request->user()->id, 'action' => 'review.moderated', 'subject_type' => Review::class, 'subject_id' => $review->id, 'before' => ['status' => $oldStatus], 'after' => ['status' => $validated['status']], 'ip_address' => $request->ip()]);
        });

        return response()->json(['data' => $review->fresh()->load('moderationHistory')]);
    }
}
