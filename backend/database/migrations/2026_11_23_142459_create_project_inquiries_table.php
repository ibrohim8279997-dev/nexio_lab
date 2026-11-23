<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_inquiries', function (Blueprint $table) {
            $table->id();
            $table->uuid('external_order_id')->unique();
            $table->uuid('submission_id')->unique();
            // Personal data columns hold encrypted payloads (Laravel "encrypted" cast).
            $table->text('client_name');
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->text('telegram')->nullable();
            $table->string('contact_method', 20);
            $table->string('project_type', 30);
            $table->text('project_title');
            $table->text('project_description');
            $table->text('required_functionality')->nullable();
            $table->string('estimated_budget', 30);
            $table->string('currency', 3)->default('USD');
            $table->string('timeframe', 100)->nullable();
            $table->text('source_url')->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->string('status', 20)->default('pending')->index(); // pending | delivered | failed
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->unsignedSmallInteger('last_http_status')->nullable();
            $table->string('last_error', 500)->nullable();
            $table->string('crm_lead_id')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('next_attempt_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_inquiries');
    }
};
