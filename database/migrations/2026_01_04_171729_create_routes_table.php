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
        Schema::create('routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->uuid('start_marker_id');
            $table->uuid('end_marker_id');
            $table->string('transport_mode')->default('driving-car');
            $table->integer('distance')->nullable()->comment('Distance in meters');
            $table->integer('duration')->nullable()->comment('Duration in seconds');
            $table->json('geometry')->nullable()->comment('Route coordinates as GeoJSON');
            $table->timestamps();

            $table->foreign('start_marker_id')->references('id')->on('markers')->cascadeOnDelete();
            $table->foreign('end_marker_id')->references('id')->on('markers')->cascadeOnDelete();

            $table->index(['trip_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
