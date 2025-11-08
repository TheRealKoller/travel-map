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
        // For SQLite, we need to recreate the table
        // For MySQL/MariaDB, we can alter it
        $driver = DB::getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite: Recreate the table
            Schema::dropIfExists('markers');
            Schema::create('markers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('name')->nullable();
                $table->string('type');
                $table->text('notes')->nullable();
                $table->decimal('latitude', 10, 8);
                $table->decimal('longitude', 11, 8);
                $table->timestamps();
            });
        } else {
            // MySQL/MariaDB: Alter the table
            // WARNING: This truncates all existing marker data as UUID conversion
            // requires dropping and recreating the primary key column
            DB::table('markers')->truncate();

            Schema::table('markers', function (Blueprint $table) {
                $table->dropColumn('id');
            });

            Schema::table('markers', function (Blueprint $table) {
                $table->uuid('id')->primary()->first();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite: Recreate the table with original structure
            Schema::dropIfExists('markers');
            Schema::create('markers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('name')->nullable();
                $table->string('type');
                $table->text('notes')->nullable();
                $table->decimal('latitude', 10, 8);
                $table->decimal('longitude', 11, 8);
                $table->timestamps();
            });
        } else {
            // MySQL/MariaDB: Alter the table
            Schema::table('markers', function (Blueprint $table) {
                $table->dropColumn('id');
            });

            Schema::table('markers', function (Blueprint $table) {
                $table->id()->first();
            });
        }
    }
};
