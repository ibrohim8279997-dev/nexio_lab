<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\SendInquiryToCrm;
use App\Models\ProjectInquiry;
use App\Services\CrmClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProjectInquiryController extends Controller
{
    public const TYPES = ['website', 'crm_integration', 'custom_crm', 'android', 'windows', 'marketplace', 'other'];

    public const BUDGETS = ['under_300', '300_500', '500_1000', '1000_3000', '3000_plus', 'not_decided'];

    public function store(Request $request, CrmClient $crm): JsonResponse
    {
        // Honeypot: bots fill the hidden field. Pretend success, store nothing.
        if (filled($request->input('company_website'))) {
            return response()->json(['data' => ['status' => 'received']], 202);
        }

        $data = $request->validate([
            'submission_id' => ['required', 'uuid'],
            'client_name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32', 'regex:/^\+?[0-9\s().-]{7,32}$/'],
            'email' => ['nullable', 'email:rfc', 'max:190'],
            'telegram' => ['nullable', 'string', 'max:64', 'regex:/^(https?:\/\/t\.me\/|@)?[A-Za-z0-9_]{4,32}$/'],
            'contact_method' => ['required', 'in:phone,email,telegram'],
            'project_type' => ['required', 'in:'.implode(',', self::TYPES)],
            'project_title' => ['required', 'string', 'min:3', 'max:160'],
            'project_description' => ['required', 'string', 'min:20', 'max:5000'],
            'required_functionality' => ['nullable', 'string', 'max:3000'],
            'estimated_budget' => ['required', 'in:'.implode(',', self::BUDGETS)],
            'currency' => ['required', 'in:USD,UZS,EUR,RUB'],
            'timeframe' => ['nullable', 'string', 'max:100'],
            'source_url' => ['nullable', 'url', 'max:500'],
            'utm_source' => ['nullable', 'string', 'max:120'],
            'utm_medium' => ['nullable', 'string', 'max:120'],
            'utm_campaign' => ['nullable', 'string', 'max:120'],
        ]);

        if (blank($data['phone'] ?? null) && blank($data['email'] ?? null) && blank($data['telegram'] ?? null)) {
            throw ValidationException::withMessages(['phone' => ['At least one contact method is required.']]);
        }
        if (blank($data[$data['contact_method']] ?? null)) {
            throw ValidationException::withMessages([$data['contact_method'] => ['The preferred contact method must be filled in.']]);
        }

        // Duplicate-submission protection: the same submission_id returns the stored result.
        $existing = ProjectInquiry::where('submission_id', $data['submission_id'])->first();
        if ($existing) {
            return $this->respond($existing);
        }

        $inquiry = ProjectInquiry::create($data + [
            'external_order_id' => (string) Str::uuid(),
            'ip_hash' => hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')),
        ]);

        // One immediate attempt so the visitor gets a truthful answer; failures fall back to the queue.
        $outcome = $crm->send($inquiry);
        if ($outcome === CrmClient::RETRY) {
            SendInquiryToCrm::dispatch($inquiry->id)->delay(now()->addMinute());
        }

        return $this->respond($inquiry->refresh());
    }

    private function respond(ProjectInquiry $inquiry): JsonResponse
    {
        $delivered = $inquiry->status === 'delivered';

        return response()->json(['data' => [
            'status' => $delivered ? 'delivered' : ($inquiry->status === 'failed' ? 'failed' : 'queued'),
            'reference' => $inquiry->external_order_id,
        ]], $delivered ? 201 : 202);
    }
}
