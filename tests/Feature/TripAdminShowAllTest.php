<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->withoutTwoFactor()->create();
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('admin with show_all sees all trips from all users', function () {
    Trip::factory()->count(2)->create(['user_id' => $this->admin->id]);
    Trip::factory()->count(3)->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->admin)->getJson('/trips?show_all=1');

    $response->assertSuccessful()
        ->assertJsonCount(5);
});

test('admin with show_all response includes owner field', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->admin)->getJson('/trips?show_all=1');

    $response->assertSuccessful()
        ->assertJsonFragment([
            'id' => $trip->id,
            'owner' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
        ]);
});

test('admin without show_all only sees own trips', function () {
    Trip::factory()->count(2)->create(['user_id' => $this->admin->id]);
    Trip::factory()->count(3)->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->admin)->getJson('/trips');

    $response->assertSuccessful()
        ->assertJsonCount(2);
});

test('regular user cannot use show_all to see other users trips', function () {
    Trip::factory()->count(2)->create(['user_id' => $this->user->id]);
    Trip::factory()->count(3)->create(['user_id' => $this->admin->id]);

    $response = $this->actingAs($this->user)->getJson('/trips?show_all=1');

    $response->assertSuccessful()
        ->assertJsonCount(2);
});

test('admin with show_all sees all trips including own', function () {
    Trip::factory()->count(2)->create(['user_id' => $this->admin->id]);
    Trip::factory()->count(2)->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->admin)->getJson('/trips?show_all=1');

    $response->assertSuccessful()
        ->assertJsonCount(4);
});
