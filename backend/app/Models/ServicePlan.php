<?php

namespace App\Models;

use Database\Factories\ServicePlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['service_id', 'slug', 'name', 'description', 'price_amount', 'price_format', 'currency', 'duration', 'included_revisions', 'extra_revision_price', 'features', 'extras', 'notice', 'sort_order', 'is_active'])]
class ServicePlan extends Model
{
    /** @use HasFactory<ServicePlanFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'price_amount' => 'decimal:2',
            'extra_revision_price' => 'decimal:2',
            'included_revisions' => 'integer',
            'features' => 'array',
            'extras' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
