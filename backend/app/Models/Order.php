<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable(['service_id', 'client_name', 'client_email', 'client_phone', 'description', 'brief', 'agreed_price', 'currency', 'status', 'due_at', 'completed_at'])]
class Order extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            $order->public_id ??= (string) Str::uuid();
        });
    }

    protected function casts(): array
    {
        return ['brief' => 'array', 'agreed_price' => 'decimal:2', 'due_at' => 'date', 'completed_at' => 'datetime', 'client_access_active' => 'boolean'];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class)->withTimestamps();
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function clientAccesses(): HasMany
    {
        return $this->hasMany(ClientAccess::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
