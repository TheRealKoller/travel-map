<?php

use App\Jobs\SendTripCollaboratorInvitationJob;
use App\Mail\TripCollaboratorInvited;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->owner = User::factory()->withoutTwoFactor()->create();
    $this->collaborator = User::factory()->withoutTwoFactor()->create();
});

test('adding a collaborator dispatches an invitation job', function () {
    Queue::fake();

    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $this->actingAs($this->owner)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => $this->collaborator->email,
    ])->assertStatus(201);

    Queue::assertPushed(SendTripCollaboratorInvitationJob::class, function ($job) use ($trip) {
        return $job->trip->is($trip)
            && $job->invitedUser->is($this->collaborator)
            && $job->inviter->is($this->owner);
    });
});

test('adding a collaborator sends an invitation email to the invited user', function () {
    Mail::fake();

    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    // Directly run the job to verify it sends the mailable
    $job = new SendTripCollaboratorInvitationJob($trip, $this->collaborator, $this->owner, 'de');
    $job->handle();

    Mail::assertSent(TripCollaboratorInvited::class, function ($mail) {
        return $mail->hasTo($this->collaborator->email);
    });
});

test('no job is dispatched when the email does not match any user', function () {
    Queue::fake();

    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->owner)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => 'nonexistent@example.com',
    ]);

    $response->assertStatus(201);

    Queue::assertNotPushed(SendTripCollaboratorInvitationJob::class);
});

test('adding with unknown email does not add any collaborator to trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $this->actingAs($this->owner)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => 'ghost@example.com',
    ])->assertStatus(201);

    expect($trip->sharedUsers()->count())->toBe(0);
});

test('invitation job uses the locale from the language cookie', function () {
    Queue::fake();

    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    // postJson only includes cookies when withCredentials() is set; use
    // withUnencryptedCookies so the raw value bypasses test-side encryption
    // and passes through the EncryptCookies middleware's 'except' list unchanged.
    $this->actingAs($this->owner)
        ->withCredentials()
        ->withUnencryptedCookies(['language' => 'en'])
        ->postJson(
            "/trips/{$trip->id}/collaborators",
            ['email' => $this->collaborator->email],
        )->assertStatus(201);

    Queue::assertPushed(SendTripCollaboratorInvitationJob::class, function ($job) {
        return $job->locale === 'en';
    });
});

test('invitation job defaults to de locale when no language cookie is present', function () {
    Queue::fake();

    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $this->actingAs($this->owner)
        ->postJson("/trips/{$trip->id}/collaborators", [
            'email' => $this->collaborator->email,
        ])->assertStatus(201);

    Queue::assertPushed(SendTripCollaboratorInvitationJob::class, function ($job) {
        return $job->locale === 'de';
    });
});

test('invitation job sends email with correct trip and inviter details', function () {
    Mail::fake();

    $trip = Trip::factory()->create(['user_id' => $this->owner->id, 'name' => 'Paris Trip']);

    $job = new SendTripCollaboratorInvitationJob($trip, $this->collaborator, $this->owner, 'en');
    $job->handle();

    Mail::assertSent(TripCollaboratorInvited::class, function ($mail) use ($trip) {
        return $mail->hasTo($this->collaborator->email)
            && $mail->trip->is($trip)
            && $mail->inviter->is($this->owner);
    });
});

test('mailable has correct subject in english', function () {
    app()->setLocale('en');

    $trip = Trip::factory()->create(['name' => 'Japan Adventure']);

    $mail = new TripCollaboratorInvited($trip, $this->collaborator, $this->owner);

    $envelope = $mail->envelope();

    expect($envelope->subject)->toContain('Japan Adventure');
});

test('mailable has correct subject in german', function () {
    app()->setLocale('de');

    $trip = Trip::factory()->create(['name' => 'Japan Abenteuer']);

    $mail = new TripCollaboratorInvited($trip, $this->collaborator, $this->owner);

    $envelope = $mail->envelope();

    expect($envelope->subject)->toContain('Japan Abenteuer');
});
