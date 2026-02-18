<?php

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin can view invitations page', function () {
    $admin = User::factory()->admin()->create();
    $invitations = UserInvitation::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get('/admin/invitations')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/invitations/index')
            ->has('invitations.data', 3)
        );
});

test('admin can see invitation data in response', function () {
    $admin = User::factory()->admin()->create();
    $invitation = UserInvitation::factory()->create([
        'email' => 'test@example.com',
        'invited_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get('/admin/invitations')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/invitations/index')
            ->where('invitations.data.0.email', 'test@example.com')
        );
});

test('non-admin cannot access invitations page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin/invitations')
        ->assertForbidden();
});
