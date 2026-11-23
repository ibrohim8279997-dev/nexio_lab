<?php

namespace App\Jobs;

use App\Models\ProjectInquiry;
use App\Services\CrmClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;

class SendInquiryToCrm implements ShouldQueue
{
    use Queueable;

    public int $tries = 8;

    public function __construct(public int $inquiryId) {}

    /** Exponential backoff: 1m, 5m, 15m, 1h, 3h, 6h, 12h. */
    public function backoff(): array
    {
        return [60, 300, 900, 3600, 10800, 21600, 43200];
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping((string) $this->inquiryId))->expireAfter(120)->releaseAfter(30)];
    }

    public function handle(CrmClient $crm): void
    {
        $inquiry = ProjectInquiry::find($this->inquiryId);
        if (! $inquiry || $inquiry->status !== 'pending') {
            return;
        }

        $outcome = $crm->send($inquiry);
        if ($outcome === CrmClient::RETRY) {
            $this->release($this->backoff()[min($this->attempts() - 1, 6)]);
        }
    }

    public function failed(?\Throwable $e): void
    {
        ProjectInquiry::whereKey($this->inquiryId)->where('status', 'pending')
            ->update(['status' => 'failed', 'last_error' => 'Retries exhausted.']);
    }
}
