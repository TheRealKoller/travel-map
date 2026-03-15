<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // MySQL: modify the ENUM type to include 'viewer'
            DB::statement("ALTER TABLE trip_user MODIFY COLUMN collaboration_role ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'editor'");
        } elseif ($driver === 'sqlite') {
            // SQLite does not support ALTER TABLE to modify CHECK constraints.
            // We recreate the table with the updated CHECK constraint.
            DB::statement('PRAGMA foreign_keys = OFF');
            DB::statement("
                CREATE TABLE trip_user_new (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    trip_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    collaboration_role VARCHAR NOT NULL DEFAULT 'editor'
                        CHECK (collaboration_role IN ('owner', 'editor', 'viewer')),
                    created_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    UNIQUE (trip_id, user_id),
                    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            ");
            DB::statement('INSERT INTO trip_user_new SELECT id, trip_id, user_id, collaboration_role, created_at, updated_at FROM trip_user');
            DB::statement('DROP TABLE trip_user');
            DB::statement('ALTER TABLE trip_user_new RENAME TO trip_user');
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE trip_user SET collaboration_role = 'editor' WHERE collaboration_role = 'viewer'");
            DB::statement("ALTER TABLE trip_user MODIFY COLUMN collaboration_role ENUM('owner', 'editor') NOT NULL DEFAULT 'editor'");
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            DB::statement("
                CREATE TABLE trip_user_new (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    trip_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    collaboration_role VARCHAR NOT NULL DEFAULT 'editor'
                        CHECK (collaboration_role IN ('owner', 'editor')),
                    created_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    UNIQUE (trip_id, user_id),
                    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            ");
            DB::statement("INSERT INTO trip_user_new SELECT id, trip_id, user_id,
                CASE WHEN collaboration_role = 'viewer' THEN 'editor' ELSE collaboration_role END,
                created_at, updated_at FROM trip_user");
            DB::statement('DROP TABLE trip_user');
            DB::statement('ALTER TABLE trip_user_new RENAME TO trip_user');
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }
};
