<?php

use App\Mail\UserInvitationMail;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

test('invitation email is queued when invitation is created', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $email = 'newuser@test.com';

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => $email]);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) use ($email) {
        return $mail->hasTo($email);
    });
});

test('invitation email has correct recipient', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $email = 'recipient@test.com';

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => $email]);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) use ($email) {
        return $mail->hasTo($email);
    });
});

test('invitation email has correct subject', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'test@test.com']);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) {
        $envelope = $mail->envelope();

        return $envelope->subject === 'You have been invited to '.config('app.name');
    });
});

test('invitation email contains invitation token URL', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $email = 'test@test.com';

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => $email]);

    $invitation = UserInvitation::where('email', $email)->first();

    Mail::assertQueued(UserInvitationMail::class, function ($mail) use ($invitation) {
        $expectedUrl = route('register.invitation', $invitation->token);

        return $mail->invitation->token === $invitation->token
            && str_contains(
                $mail->render(),
                $expectedUrl
            );
    });
});

test('invitation email contains inviter name', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create(['name' => 'Admin User']);

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'test@test.com']);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) use ($admin) {
        return str_contains(
            $mail->render(),
            $admin->name
        );
    });
});

test('invitation email contains expiration date', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();
    $email = 'test@test.com';

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => $email]);

    $invitation = UserInvitation::where('email', $email)->first();
    $expectedDate = $invitation->expires_at->format('M d, Y');

    Mail::assertQueued(UserInvitationMail::class, function ($mail) use ($expectedDate) {
        return str_contains(
            $mail->render(),
            $expectedDate
        );
    });
});

test('invitation email is sent with correct from name', function () {
    Mail::fake();

    config(['app.name' => 'TravelMap Test']);

    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'test@test.com']);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) {
        $rendered = $mail->render();

        return str_contains($rendered, config('app.name'));
    });
});

test('invitation email contains accept invitation button', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'test@test.com']);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) {
        return str_contains(
            $mail->render(),
            'Accept Invitation'
        );
    });
});

test('invitation email uses markdown template', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'test@test.com']);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) {
        return $mail->content()->markdown === 'emails.user-invitation';
    });
});

test('invitation email contains invitation greeting', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create();

    actingAs($admin)
        ->post(route('admin.invitations.store'), ['email' => 'test@test.com']);

    Mail::assertQueued(UserInvitationMail::class, function ($mail) {
        return str_contains(
            $mail->render(),
            "You've Been Invited!"
        );
    });
});
