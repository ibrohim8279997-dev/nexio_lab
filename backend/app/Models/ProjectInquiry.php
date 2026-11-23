<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectInquiry extends Model
{
    protected $guarded = [];

    protected $hidden = ['client_name', 'phone', 'email', 'telegram', 'project_description', 'required_functionality', 'ip_hash'];

    protected function casts(): array
    {
        return [
            'client_name' => 'encrypted',
            'phone' => 'encrypted',
            'email' => 'encrypted',
            'telegram' => 'encrypted',
            'project_title' => 'encrypted',
            'project_description' => 'encrypted',
            'required_functionality' => 'encrypted',
            'delivered_at' => 'datetime',
            'next_attempt_at' => 'datetime',
        ];
    }
}
