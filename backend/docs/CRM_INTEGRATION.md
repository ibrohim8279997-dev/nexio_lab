# Nexio CRM integration (project inquiries)

Flow: form -> `POST /api/v1/project-inquiries` (validated, rate limited, honeypot, CSRF, encrypted at rest)
-> one immediate authenticated HTTPS call to the CRM -> status `delivered` only if the CRM confirms (2xx, or 409 for an
already-known `external_order_id`). Temporary failures (timeout, connection, 408/425/429/5xx) stay `pending` and are
retried by the `SendInquiryToCrm` queue job (8 tries, backoff 1m, 5m, 15m, 1h, 3h, 6h, 12h). Other 4xx = `failed`.
Run a worker for retries: `php artisan queue:work`.

Idempotency: browser `submission_id` (uuid) is unique, so double clicks/resends never create a second row;
`external_order_id` is sent in the payload and as `Idempotency-Key` on every retry.

## Environment (backend/.env only; never in frontend)
NEXIO_CRM_URL, NEXIO_CRM_SECRET, NEXIO_CRM_AUTH_SCHEME (bearer|header), NEXIO_CRM_AUTH_HEADER, NEXIO_CRM_LEAD_ID_KEY,
NEXIO_CRM_SOURCE ("Website / NexioLab.uz"), NEXIO_CRM_TIMEOUT.

## OPEN: contract must be confirmed by the CRM developer
Endpoint URL, auth method, accepted field names/enums (project_type, estimated_budget values), response shape
(lead id key) and duplicate behaviour are NOT yet confirmed. `App\Services\CrmClient::payload()` is the single place to adapt.

## Request example (current assumption)
{"external_order_id":"<uuid>","client_name":"…","phone":"+998…","email":null,"telegram":null,"contact_method":"phone",
"project_type":"website","project_title":"…","project_description":"…","required_functionality":null,
"estimated_budget":"not_decided","currency":"USD","timeframe":null,"source":"Website / NexioLab.uz",
"source_url":"https://…","utm_source":null,"utm_medium":null,"utm_campaign":null,"created_at":"2026-11-23T12:00:00+00:00"}
Website response: 201 {"data":{"status":"delivered","reference":"<uuid>"}} | 202 {"data":{"status":"queued",…}}
