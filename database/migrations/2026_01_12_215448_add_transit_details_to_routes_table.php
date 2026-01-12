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
        Schema::table('routes', function (Blueprint $table) {
            $table->json('transit_details')->nullable()->after('geometry')->comment('Detailed transit information (stops, lines, times)');
            $table->json('alternatives')->nullable()->after('transit_details')->comment('Alternative route options');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('routes', function (Blueprint $table) {
            $table->dropColumn(['transit_details', 'alternatives']);
        });
    }
};
