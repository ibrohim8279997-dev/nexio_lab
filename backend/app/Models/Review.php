<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['order_id', 'employee_id', 'rating', 'text', 'status', 'published_at'])]
class Review extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function moderationHistory(): HasMany
    {
        return $this->hasMany(ReviewModerationHistory::class);
    }
}
