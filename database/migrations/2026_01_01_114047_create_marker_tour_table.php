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
        Schema::create('marker_tour', function (Blueprint $table) {
            $table->uuid('marker_id');
            $table->foreignId('tour_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->foreign('marker_id')
                ->references('id')
                ->on('markers')
                ->onDelete('cascade');

            $table->primary(['marker_id', 'tour_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marker_tour');
    }
};
