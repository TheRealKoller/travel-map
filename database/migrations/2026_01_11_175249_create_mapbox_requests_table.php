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
        Schema::create('mapbox_requests', function (Blueprint $table) {
            $table->id();
            $table->string('period')->unique(); // e.g., '2026-01' for monthly tracking
            $table->unsignedBigInteger('count')->default(0);
            $table->timestamp('last_request_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mapbox_requests');
    }
};
