<?php

it('loads the login page', function (): void {
    $page = visit('/login');

    $page->assertSee('Anmelden');
});
