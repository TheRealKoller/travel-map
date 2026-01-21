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
            $table->text('unsplash_download_location')->nullable()->after('image_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('markers', function (Blueprint $table) {
            $table->dropColumn('unsplash_download_location');
        });
    }
};
