<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['logo_path', 'slogan', 'intro_text', 'about_text', 'phone', 'telegram', 'whatsapp', 'email', 'availability_text', 'address', 'address_confirmed', 'project_inquiry_employee_id', 'project_inquiry_name', 'project_inquiry_position', 'project_inquiry_telegram', 'project_inquiry_phone', 'project_inquiry_active'])]
class SiteSetting extends Model
{
    protected function casts(): array
    {
        return ['address_confirmed' => 'boolean', 'project_inquiry_active' => 'boolean'];
    }
}
