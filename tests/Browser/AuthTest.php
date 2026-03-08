<?php

use App\Models\User;
use App\Models\UserInvitation;

it('redirects unauthenticated user to login', function (): void {
    $page = visit('/trips');

    $page->assertPathIs('/login');
});

it('shows login page with German UI', function (): void {
    $page = visit('/login');

    $page->assertSee('Anmelden')
        ->assertSee('E-Mail-Adresse')
        ->assertSee('Passwort');
});

it('logs in with valid credentials and redirects to trips', function (): void {
    $user = User::factory()->withoutTwoFactor()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    $page = visit('/login');

    $page->fill('email', 'test@example.com')
        ->fill('password', 'password')
        ->click('@login-button')
        ->assertPathIs('/trips')
        ->assertSee('Select a trip');

    $this->assertAuthenticated();
});

it('shows error for invalid credentials', function (): void {
    User::factory()->withoutTwoFactor()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('correct-password'),
    ]);

    $page = visit('/login');

    $page->fill('email', 'test@example.com')
        ->fill('password', 'wrong-password')
        ->click('@login-button')
        ->assertSee('These credentials do not match our records.');
});

it('shows invitation registration page with valid token', function (): void {
    $invitation = UserInvitation::factory()->create([
        'email' => 'invited@example.com',
    ]);

    $page = visit("/register/{$invitation->token}");

    $page->assertSee('Registrierung abschließen')
        ->assertSee('Konto erstellen');
});

it('registers a new user via invitation link', function (): void {
    $invitation = UserInvitation::factory()->create([
        'email' => 'newuser@example.com',
    ]);

    $page = visit("/register/{$invitation->token}");

    $page->fill('name', 'New User')
        ->fill('password', 'password123')
        ->fill('password_confirmation', 'password123')
        ->click('@create-account-button')
        ->assertPathIs('/trips');

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
});
