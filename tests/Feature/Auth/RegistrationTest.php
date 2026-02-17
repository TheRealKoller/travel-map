<?php

test('public registration is disabled', function () {
    // Try to access the register route - should not exist
    $this->get('/register')->assertNotFound();
});

test('public registration endpoint is disabled', function () {
    // Try to post to register route - should not exist
    $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    // Verify user was not created
    $this->assertDatabaseMissing('users', [
        'email' => 'test@example.com',
    ]);
});
