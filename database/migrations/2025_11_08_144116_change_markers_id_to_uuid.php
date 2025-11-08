<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Truncate the table to remove existing data
        // Warning: This will delete all existing markers
        DB::table('markers')->truncate();

        Schema::table('markers', function (Blueprint $table) {
            // Drop the old auto-increment id column
            $table->dropColumn('id');
        });

        Schema::table('markers', function (Blueprint $table) {
            // Add new UUID id column as primary key
            $table->uuid('id')->primary()->first();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('markers', function (Blueprint $table) {
            // Drop the UUID id column
            $table->dropColumn('id');
        });

        Schema::table('markers', function (Blueprint $table) {
            // Restore the auto-increment id column
            $table->id()->first();
        });
    }
};
