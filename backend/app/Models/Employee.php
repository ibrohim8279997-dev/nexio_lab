<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'slug', 'name', 'position', 'department', 'short_bio', 'activity', 'company_story', 'started_at', 'photo_path', 'sort_order', 'is_public'])]
class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return ['started_at' => 'date', 'is_public' => 'boolean'];
    }

    public function slugHistory(): HasMany
    {
        return $this->hasMany(EmployeeSlug::class);
    }

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class)->withTimestamps();
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
