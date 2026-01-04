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
        Schema::table('tours', function (Blueprint $table) {
            $table->foreignId('parent_tour_id')->nullable()->after('trip_id')->constrained('tours')->onDelete('cascade');
            $table->integer('position')->default(0)->after('parent_tour_id');
            
            // Add unique constraint: sub-tour name must be unique within parent tour
            $table->unique(['parent_tour_id', 'name'], 'tours_parent_tour_id_name_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropUnique('tours_parent_tour_id_name_unique');
            $table->dropForeign(['parent_tour_id']);
            $table->dropColumn(['parent_tour_id', 'position']);
        });
    }
};
