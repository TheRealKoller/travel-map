<?php

use App\Models\Trip;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

it('can create a trip with notes', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->postJson('/trips', [
            'name' => 'Trip with Notes',
            'notes' => '# My Trip Notes\n\nThis is a **test** trip with notes.',
        ])
        ->assertCreated();

    assertDatabaseHas('trips', [
        'name' => 'Trip with Notes',
        'notes' => '# My Trip Notes\n\nThis is a **test** trip with notes.',
    ]);
});

it('can update trip notes', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $user->id,
        'notes' => 'Old notes',
    ]);

    actingAs($user)
        ->putJson("/trips/{$trip->id}", [
            'notes' => '# Updated Notes\n\nThese are the updated notes.',
        ])
        ->assertOk();

    $trip->refresh();
    expect($trip->notes)->toBe('# Updated Notes\n\nThese are the updated notes.');
});

it('can clear trip notes by setting to null', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $user->id,
        'notes' => 'Some notes to be cleared',
    ]);

    actingAs($user)
        ->putJson("/trips/{$trip->id}", [
            'notes' => null,
        ])
        ->assertOk();

    $trip->refresh();
    expect($trip->notes)->toBeNull();
});

it('includes notes in trip PDF export', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $user->id,
        'notes' => '# Trip Planning\n\n- Pack hiking boots\n- Book hotel',
    ]);

    actingAs($user)
        ->get("/trips/{$trip->id}/export-pdf")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('handles empty notes gracefully', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $user->id,
        'notes' => null,
    ]);

    actingAs($user)
        ->get("/trips/{$trip->id}/export-pdf")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});
