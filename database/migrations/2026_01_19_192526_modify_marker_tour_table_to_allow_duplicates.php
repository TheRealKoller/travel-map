<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create a new temporary table with the correct structure
        Schema::create('marker_tour_new', function (Blueprint $table) {
            $table->id();
            $table->uuid('marker_id');
            $table->foreignId('tour_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('marker_id')
                ->references('id')
                ->on('markers')
                ->onDelete('cascade');
        });

        // Copy data from the old table to the new table
        DB::statement('INSERT INTO marker_tour_new (marker_id, tour_id, position, created_at, updated_at) 
                       SELECT marker_id, tour_id, position, created_at, updated_at FROM marker_tour');

        // Drop the old table
        Schema::dropIfExists('marker_tour');

        // Rename the new table to marker_tour
        Schema::rename('marker_tour_new', 'marker_tour');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Create a new temporary table with the old structure (composite primary key)
        Schema::create('marker_tour_old', function (Blueprint $table) {
            $table->uuid('marker_id');
            $table->foreignId('tour_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('marker_id')
                ->references('id')
                ->on('markers')
                ->onDelete('cascade');

            $table->primary(['marker_id', 'tour_id']);
        });

        // Copy unique combinations from the new table (remove duplicates)
        DB::statement('INSERT INTO marker_tour_old (marker_id, tour_id, position, created_at, updated_at) 
                       SELECT marker_id, tour_id, MIN(position) as position, MIN(created_at) as created_at, MAX(updated_at) as updated_at 
                       FROM marker_tour 
                       GROUP BY marker_id, tour_id');

        // Drop the new table
        Schema::dropIfExists('marker_tour');

        // Rename the old table back to marker_tour
        Schema::rename('marker_tour_old', 'marker_tour');
    }
};
