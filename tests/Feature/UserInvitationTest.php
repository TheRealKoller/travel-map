<?php

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user invitation can be created', function () {
    $inviter = User::factory()->create(['role' => 'admin']);
    $email = 'invited@example.com';
    $token = UserInvitation::generateToken();

    $invitation = UserInvitation::create([
        'email' => $email,
        'token' => $token,
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    expect($invitation->email)->toBe($email);
    expect($invitation->token)->toBe($token);
    expect($invitation->invited_by)->toBe($inviter->id);
    expect($invitation->role)->toBe('user');
    expect($invitation->expires_at)->not->toBeNull();
    expect($invitation->accepted_at)->toBeNull();
});

test('invitation token is unique and 64 characters long', function () {
    $token = UserInvitation::generateToken();

    expect($token)->toBeString();
    expect(strlen($token))->toBe(64);
});

test('invitation belongs to inviter', function () {
    $inviter = User::factory()->create(['role' => 'admin']);

    $invitation = UserInvitation::create([
        'email' => 'test@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    expect($invitation->inviter)->toBeInstanceOf(User::class);
    expect($invitation->inviter->id)->toBe($inviter->id);
});

test('user has sent invitations relationship', function () {
    $inviter = User::factory()->create(['role' => 'admin']);

    UserInvitation::create([
        'email' => 'test1@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    UserInvitation::create([
        'email' => 'test2@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    expect($inviter->sentInvitations)->toHaveCount(2);
    expect($inviter->sentInvitations->first())->toBeInstanceOf(UserInvitation::class);
});

test('invitation knows if it is expired', function () {
    $inviter = User::factory()->create(['role' => 'admin']);

    $expiredInvitation = UserInvitation::create([
        'email' => 'expired@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->subDays(1),
    ]);

    $validInvitation = UserInvitation::create([
        'email' => 'valid@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    expect($expiredInvitation->isExpired())->toBeTrue();
    expect($validInvitation->isExpired())->toBeFalse();
});

test('invitation knows if it is accepted', function () {
    $inviter = User::factory()->create(['role' => 'admin']);

    $acceptedInvitation = UserInvitation::create([
        'email' => 'accepted@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
        'accepted_at' => now(),
    ]);

    $pendingInvitation = UserInvitation::create([
        'email' => 'pending@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    expect($acceptedInvitation->isAccepted())->toBeTrue();
    expect($pendingInvitation->isAccepted())->toBeFalse();
});

test('invitation knows if it is valid', function () {
    $inviter = User::factory()->create(['role' => 'admin']);

    // Valid invitation
    $validInvitation = UserInvitation::create([
        'email' => 'valid@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    // Expired invitation
    $expiredInvitation = UserInvitation::create([
        'email' => 'expired@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->subDays(1),
    ]);

    // Accepted invitation
    $acceptedInvitation = UserInvitation::create([
        'email' => 'accepted@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
        'accepted_at' => now(),
    ]);

    expect($validInvitation->isValid())->toBeTrue();
    expect($expiredInvitation->isValid())->toBeFalse();
    expect($acceptedInvitation->isValid())->toBeFalse();
});

test('invitations are deleted when inviter is deleted', function () {
    $inviter = User::factory()->create(['role' => 'admin']);

    $invitation = UserInvitation::create([
        'email' => 'test@example.com',
        'token' => UserInvitation::generateToken(),
        'invited_by' => $inviter->id,
        'role' => 'user',
        'expires_at' => now()->addDays(7),
    ]);

    $invitationId = $invitation->id;

    $inviter->delete();

    expect(UserInvitation::find($invitationId))->toBeNull();
});
