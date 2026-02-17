<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Admin User Configuration
    |--------------------------------------------------------------------------
    |
    | These settings are used to create or update the admin user account
    | during database seeding or via the user:create-admin command.
    |
    | IMPORTANT: These values should be set in your .env file for production
    | deployments to ensure secure admin user creation.
    |
    */

    'user' => [
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
        'name' => env('ADMIN_NAME'),
    ],

];
