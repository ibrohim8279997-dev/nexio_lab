<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->foreignId('project_inquiry_employee_id')->nullable()->after('telegram')->constrained('employees')->nullOnDelete();
            $table->string('project_inquiry_name')->nullable()->after('project_inquiry_employee_id');
            $table->string('project_inquiry_position')->nullable()->after('project_inquiry_name');
            $table->string('project_inquiry_telegram')->nullable()->after('project_inquiry_position');
            $table->string('project_inquiry_phone')->nullable()->after('project_inquiry_telegram');
            $table->boolean('project_inquiry_active')->default(true)->after('project_inquiry_phone');
        });

        DB::table('site_settings')->orderBy('id')->each(function (object $site): void {
            DB::table('site_settings')->where('id', $site->id)->update([
                'project_inquiry_name' => 'Nexio Lab Owner',
                'project_inquiry_position' => 'Owner / Project Manager',
                'project_inquiry_telegram' => $site->telegram,
                'project_inquiry_phone' => $site->phone,
                'project_inquiry_active' => true,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('project_inquiry_employee_id');
            $table->dropColumn(['project_inquiry_name', 'project_inquiry_position', 'project_inquiry_telegram', 'project_inquiry_phone', 'project_inquiry_active']);
        });
    }
};
