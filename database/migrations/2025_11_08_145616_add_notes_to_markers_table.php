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
        Schema::table('markers', function (Blueprint $table) {
            // Check if the 'notes' column already exists before adding it
            // This is necessary because the UUID migration recreates the table with all columns
            if (! Schema::hasColumn('markers', 'notes')) {
                $table->text('notes')->nullable()->after('type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('markers', function (Blueprint $table) {
            if (Schema::hasColumn('markers', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
