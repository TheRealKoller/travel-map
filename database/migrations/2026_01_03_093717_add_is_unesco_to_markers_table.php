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
        Schema::table('markers', function (Blueprint $table) {
            $table->boolean('is_unesco')->default(false)->after('type');
        });

        // Migrate existing UNESCO markers to Point of Interest with is_unesco = true
        DB::table('markers')
            ->where('type', 'unesco world heritage')
            ->update([
                'type' => 'point of interest',
                'is_unesco' => true,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert UNESCO markers back to their original type
        DB::table('markers')
            ->where('is_unesco', true)
            ->update([
                'type' => 'unesco world heritage',
            ]);

        Schema::table('markers', function (Blueprint $table) {
            $table->dropColumn('is_unesco');
        });
    }
};
