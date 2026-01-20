<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            // Planned start period (can be year only, year+month, or year+month+day)
            $table->unsignedSmallInteger('planned_start_year')->nullable()->after('viewport_static_image_url');
            $table->unsignedTinyInteger('planned_start_month')->nullable()->after('planned_start_year');
            $table->unsignedTinyInteger('planned_start_day')->nullable()->after('planned_start_month');

            // Planned end period (can be year only, year+month, or year+month+day)
            $table->unsignedSmallInteger('planned_end_year')->nullable()->after('planned_start_day');
            $table->unsignedTinyInteger('planned_end_month')->nullable()->after('planned_end_year');
            $table->unsignedTinyInteger('planned_end_day')->nullable()->after('planned_end_month');

            // Planned duration in days (independent of the period)
            $table->unsignedSmallInteger('planned_duration_days')->nullable()->after('planned_end_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn([
                'planned_start_year',
                'planned_start_month',
                'planned_start_day',
                'planned_end_year',
                'planned_end_month',
                'planned_end_day',
                'planned_duration_days',
            ]);
        });
    }
};
