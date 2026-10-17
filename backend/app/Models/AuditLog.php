<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'action', 'subject_type', 'subject_id', 'before', 'after', 'ip_address'])]
class AuditLog extends Model
{
    protected function casts(): array
    {
        return ['before' => 'array', 'after' => 'array'];
    }
}
