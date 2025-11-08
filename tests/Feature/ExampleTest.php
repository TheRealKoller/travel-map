<?php

it('redirects to login when not authenticated', function () {
    $response = $this->get('/');

    $response->assertRedirectToRoute('login');
});
