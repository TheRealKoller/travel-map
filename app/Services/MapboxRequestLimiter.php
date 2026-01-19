<?php

namespace App\Services;

use App\Exceptions\MapboxQuotaExceededException;
use App\Models\MapboxRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MapboxRequestLimiter
{
    private readonly int $monthlyLimit;

    public function __construct()
    {
        $this->monthlyLimit = (int) config('services.mapbox.monthly_request_limit', 10000);
    }

    /**
     * Check if we can make a Mapbox request based on current quota.
     *
     * @throws MapboxQuotaExceededException
     */
    public function checkQuota(): void
    {
        $currentPeriod = $this->getCurrentPeriod();
        $record = $this->getOrCreateRecord($currentPeriod);

        if ($record->count >= $this->monthlyLimit) {
            Log::warning('Mapbox monthly quota exceeded', [
                'period' => $currentPeriod,
                'current_count' => $record->count,
                'limit' => $this->monthlyLimit,
            ]);

            throw new MapboxQuotaExceededException(
                "Mapbox API monthly quota exceeded ({$record->count}/{$this->monthlyLimit} requests). Please try again next month."
            );
        }
    }

    /**
     * Increment the request counter after a successful API call.
     */
    public function incrementCount(): void
    {
        $currentPeriod = $this->getCurrentPeriod();

        DB::transaction(function () use ($currentPeriod) {
            $record = $this->getOrCreateRecord($currentPeriod);
            $record->increment('count');
            $record->update(['last_request_at' => now()]);
        });
    }

    /**
     * Get current usage statistics.
     *
     * @return array{period: string, count: int, limit: int, remaining: int}
     */
    public function getUsageStats(): array
    {
        $currentPeriod = $this->getCurrentPeriod();
        $record = $this->getOrCreateRecord($currentPeriod);

        return [
            'period' => $currentPeriod,
            'count' => $record->count,
            'limit' => $this->monthlyLimit,
            'remaining' => max(0, $this->monthlyLimit - $record->count),
        ];
    }

    /**
     * Get the current period identifier (YYYY-MM format).
     */
    private function getCurrentPeriod(): string
    {
        return now()->format('Y-m');
    }

    /**
     * Get or create the record for the given period.
     */
    private function getOrCreateRecord(string $period): MapboxRequest
    {
        return MapboxRequest::firstOrCreate(
            ['period' => $period],
            ['count' => 0]
        );
    }
}
