<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('trips.index'))->assertRedirect(route('login'));
});

test('authenticated users can visit the trips page', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('trips.index'))->assertOk();
});
