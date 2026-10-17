<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'title', 'description', 'category', 'images', 'links', 'sort_order', 'is_published'])]
class Project extends Model
{
    protected function casts(): array
    {
        return ['images' => 'array', 'links' => 'array', 'is_published' => 'boolean'];
    }
}
