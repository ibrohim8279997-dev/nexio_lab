<?php

namespace App\Services;

use App\Models\ProjectInquiry;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Delivers one inquiry to Nexio CRM's inbound API.
 *
 * The endpoint, auth scheme and payload mapping are driven by config('services.nexio_crm')
 * and must match the contract agreed with the CRM developer (see docs/CRM_INTEGRATION.md).
 */
class CrmClient
{
    public const DELIVERED = 'delivered';

    public const RETRY = 'retry';

    public const PERMANENT = 'permanent';

    public function configured(): bool
    {
        return filled(config('services.nexio_crm.url')) && filled(config('services.nexio_crm.secret'));
    }

    public function payload(ProjectInquiry $i): array
    {
        $lines = array_filter([
            // The website never sends a deal amount (the CRM then creates the deal with value 0),
            // only the client's budget range, so the admin must set the exact amount by hand.
            '!!! DEAL AMOUNT NOT SET: admin must enter the exact amount in the deal. The budget below is only the client\'s range.',
            '',
            'Project type: '.$i->project_type,
            'Budget: '.$i->estimated_budget.' '.$i->currency,
            $i->timeframe ? 'Timeframe: '.$i->timeframe : null,
            'Preferred contact: '.$i->contact_method,
            $i->telegram ? 'Telegram: '.$i->telegram : null,
            '',
            $i->project_description,
            $i->required_functionality ? "\nRequired functionality:\n".$i->required_functionality : null,
            '',
            'Reference: '.$i->external_order_id,
            $i->source_url ? 'Page: '.$i->source_url : null,
            collect(['utm_source', 'utm_medium', 'utm_campaign'])->filter(fn ($k) => $i->$k)->map(fn ($k) => $k.'='.$i->$k)->implode(', ') ?: null,
        ], fn ($l) => $l !== null);

        // Field names follow the CRM's own lead model: title, contact_name, email, phone, source, notes.
        return [
            'title' => $i->project_title,
            'contact_name' => $i->client_name,
            'email' => $i->email,
            'phone' => $i->phone,
            'source' => config('services.nexio_crm.source'),
            'notes' => implode("\n", $lines),
            'external_order_id' => $i->external_order_id,
        ];
    }

    /** @return string one of self::DELIVERED, self::RETRY, self::PERMANENT */
    public function send(ProjectInquiry $i): string
    {
        $i->increment('attempts');

        if (! $this->configured()) {
            return $this->record($i, self::RETRY, null, 'CRM endpoint is not configured.');
        }

        $cfg = config('services.nexio_crm');
        $request = Http::acceptJson()->asJson()
            ->timeout((int) $cfg['timeout'])->connectTimeout(5)
            ->withOptions(['verify' => (bool) ($cfg['verify_ssl'] ?? true)])
            ->withHeaders(['Idempotency-Key' => $i->external_order_id]);

        $request = $cfg['auth_scheme'] === 'bearer'
            ? $request->withToken($cfg['secret'])
            : $request->withHeaders([$cfg['auth_header'] => $cfg['secret']]);

        try {
            $response = $request->post($cfg['url'], $this->payload($i));
        } catch (ConnectionException $e) {
            return $this->record($i, self::RETRY, null, 'Connection failed or timed out.');
        }

        $status = $response->status();
        // 409 = CRM already holds this external_order_id: the lead exists, which is success.
        // A 2xx that is not a JSON object (e.g. an SPA/HTML page from a wrong URL) is NOT a confirmation.
        if ($response->successful() && ! is_array($response->json())) {
            return $this->record($i, self::PERMANENT, $status, 'CRM returned a non-JSON response; check NEXIO_CRM_URL.');
        }
        if ($response->successful() || $status === 409) {
            $leadId = $response->json($cfg['lead_id_key']);
            $i->update(['crm_lead_id' => is_scalar($leadId) ? (string) $leadId : null]);

            return $this->record($i, self::DELIVERED, $status);
        }

        $transient = $status >= 500 || in_array($status, [408, 425, 429], true);

        return $this->record($i, $transient ? self::RETRY : self::PERMANENT, $status, 'CRM responded with HTTP '.$status.'.');
    }

    private function record(ProjectInquiry $i, string $outcome, ?int $http, ?string $error = null): string
    {
        $i->update([
            'status' => match ($outcome) {self::DELIVERED => 'delivered', self::PERMANENT => 'failed', default => 'pending'},
            'last_http_status' => $http,
            'last_error' => $error,
            'delivered_at' => $outcome === self::DELIVERED ? now() : null,
        ]);
        // Never log customer data or secrets: identifiers and outcome only.
        Log::info('crm.delivery', ['external_order_id' => $i->external_order_id, 'outcome' => $outcome, 'http' => $http, 'attempt' => $i->attempts]);

        return $outcome;
    }
}
