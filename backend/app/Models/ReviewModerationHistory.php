<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['review_id', 'user_id', 'from_status', 'to_status', 'note'])]
class ReviewModerationHistory extends Model {}
