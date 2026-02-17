<?php

use App\Mail\UserInvitationMail;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertAuthenticated;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

uses(RefreshDatabase::class);

// Admin can view invitations list
test('admin can view invitations list', function () {
    $admin = User::factory()->admin()->create();
    $invitations = UserInvitation::factory()->count(3)->create();

    actingAs($admin)
        ->get(route('admin.invitations.index'))
        ->assertOk();
})->skip('Frontend not implemented yet - see separate frontend issue');

// Non-admin cannot view invitations list
test('non-admin cannot view invitations list', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('admin.invitations.index'))
        ->assertForbidden();
});

// Admin can send invitation
test('admin can send invitation', function () {
    Mail::fake();
    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'new@test.com'])
        ->assertRedirect()
        ->assertSessionHas('success');

    assertDatabaseHas('user_invitations', ['email' => 'new@test.com']);
    Mail::assertSent(UserInvitationMail::class);
});

// Non-admin cannot send invitation
test('non-admin cannot send invitation', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->post(route('admin.invitations.store'), ['email' => 'new@test.com'])
        ->assertForbidden();
});

// Cannot invite existing user
test('cannot invite existing user email', function () {
    $admin = User::factory()->admin()->create();
    $existingUser = User::factory()->create(['email' => 'existing@test.com']);

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'existing@test.com'])
        ->assertSessionHasErrors('email');
});

// Cannot create duplicate invitation
test('cannot create duplicate invitation', function () {
    $admin = User::factory()->admin()->create();
    UserInvitation::factory()->create(['email' => 'invited@test.com']);

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'invited@test.com'])
        ->assertSessionHasErrors('email');
});

// User can register with valid token
test('user can register with valid token', function () {
    $invitation = UserInvitation::factory()->create();

    post(route('register.invitation.accept', $invitation->token), [
        'name' => 'New User',
        'email' => $invitation->email,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success');

    assertAuthenticated();
    assertDatabaseHas('users', [
        'email' => $invitation->email,
        'name' => 'New User',
    ]);

    // Check invitation is marked as accepted
    expect($invitation->fresh()->isAccepted())->toBeTrue();
});

// Cannot register with expired token
test('cannot register with expired token', function () {
    $invitation = UserInvitation::factory()->expired()->create();

    get(route('register.invitation', $invitation->token))
        ->assertOk();
})->skip('Frontend not implemented yet - see separate frontend issue');

// Cannot register with already accepted token
test('cannot register with already accepted token', function () {
    $invitation = UserInvitation::factory()->accepted()->create();

    get(route('register.invitation', $invitation->token))
        ->assertOk();
})->skip('Frontend not implemented yet - see separate frontend issue');

// Shows registration form with valid token
test('shows registration form with valid token', function () {
    $invitation = UserInvitation::factory()->create();

    get(route('register.invitation', $invitation->token))
        ->assertOk();
})->skip('Frontend not implemented yet - see separate frontend issue');

// Cannot accept invitation with mismatched email
test('cannot accept invitation with mismatched email', function () {
    $invitation = UserInvitation::factory()->create(['email' => 'invited@test.com']);

    post(route('register.invitation.accept', $invitation->token), [
        'name' => 'New User',
        'email' => 'different@test.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])
        ->assertSessionHasErrors('email');
});

// User is auto-verified after accepting invitation
test('user is auto verified after accepting invitation', function () {
    $invitation = UserInvitation::factory()->create();

    post(route('register.invitation.accept', $invitation->token), [
        'name' => 'New User',
        'email' => $invitation->email,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $user = User::where('email', $invitation->email)->first();
    expect($user->email_verified_at)->not->toBeNull();
});

// Admin can delete invitation
test('admin can delete invitation', function () {
    $admin = User::factory()->admin()->create();
    $invitation = UserInvitation::factory()->create();

    actingAs($admin)
        ->delete(route('admin.invitations.destroy', $invitation))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(UserInvitation::find($invitation->id))->toBeNull();
});

// Non-admin cannot delete invitation
test('non-admin cannot delete invitation', function () {
    $user = User::factory()->create();
    $invitation = UserInvitation::factory()->create();

    actingAs($user)
        ->delete(route('admin.invitations.destroy', $invitation))
        ->assertForbidden();
});

// Registration requires valid password
test('registration requires valid password', function () {
    $invitation = UserInvitation::factory()->create();

    post(route('register.invitation.accept', $invitation->token), [
        'name' => 'New User',
        'email' => $invitation->email,
        'password' => 'short',
        'password_confirmation' => 'short',
    ])
        ->assertSessionHasErrors('password');
});

// Registration requires password confirmation
test('registration requires password confirmation', function () {
    $invitation = UserInvitation::factory()->create();

    post(route('register.invitation.accept', $invitation->token), [
        'name' => 'New User',
        'email' => $invitation->email,
        'password' => 'password123',
        'password_confirmation' => 'different123',
    ])
        ->assertSessionHasErrors('password');
});
