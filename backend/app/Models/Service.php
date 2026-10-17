<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'short_description', 'description', 'cover_path', 'sort_order', 'is_published'])]
class Service extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    public function plans(): HasMany
    {
        return $this->hasMany(ServicePlan::class)->orderBy('sort_order')->orderBy('id');
    }
}
