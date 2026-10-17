<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

#[Fillable(['disk', 'path', 'original_name', 'mime_type', 'size', 'width', 'height', 'uploaded_by'])]
class Media extends Model
{
    protected static function booted(): void
    {
        static::creating(function (Media $media): void {
            $media->public_id ??= (string) Str::uuid();
        });
    }
}
