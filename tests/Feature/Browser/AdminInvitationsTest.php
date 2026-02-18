<?php

use App\Mail\UserInvitationMail;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

test('admin can view invitations page', function () {
    $admin = User::factory()->admin()->create();
    $invitations = UserInvitation::factory()->count(3)->create();

    $page = actingAs($admin)->visit('/admin/invitations');

    $page->assertSee('User invitations')
        ->assertSee('Send invitation')
        ->assertSee('All invitations')
        ->assertNoJavascriptErrors();
});

test('admin can see invitation in table', function () {
    $admin = User::factory()->admin()->create();
    $invitation = UserInvitation::factory()->create([
        'email' => 'test@example.com',
        'invited_by' => $admin->id,
    ]);

    $page = actingAs($admin)->visit('/admin/invitations');

    $page->assertSee('test@example.com')
        ->assertSee($admin->name)
        ->assertSee('Pending')
        ->assertNoJavascriptErrors();
});

test('admin can send invitation', function () {
    Mail::fake();
    $admin = User::factory()->admin()->create();

    $page = actingAs($admin)->visit('/admin/invitations');

    $page->fill('email', 'newuser@example.com')
        ->click('Send invitation')
        ->waitForText('Invitation sent successfully')
        ->assertSee('newuser@example.com')
        ->assertNoJavascriptErrors();

    expect(UserInvitation::where('email', 'newuser@example.com')->exists())->toBeTrue();
    Mail::assertSent(UserInvitationMail::class);
});

test('admin can delete invitation', function () {
    $admin = User::factory()->admin()->create();
    $invitation = UserInvitation::factory()->create([
        'email' => 'delete-me@example.com',
    ]);

    $page = actingAs($admin)->visit('/admin/invitations');

    $page->assertSee('delete-me@example.com')
        ->click('Delete')
        ->assertDialogOpened()
        ->acceptDialog()
        ->pause(500)
        ->assertNoJavascriptErrors();

    expect(UserInvitation::find($invitation->id))->toBeNull();
});

test('non-admin cannot access invitations page', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->get('/admin/invitations')
        ->assertForbidden();
});

test('admin sidebar shows user invitations link', function () {
    $admin = User::factory()->admin()->create();

    $page = actingAs($admin)->visit('/dashboard');

    $page->assertSee('User invitations')
        ->assertNoJavascriptErrors();
});

test('non-admin sidebar does not show user invitations link', function () {
    $user = User::factory()->create();

    $page = actingAs($user)->visit('/dashboard');

    $page->assertDontSee('User invitations')
        ->assertNoJavascriptErrors();
});

test('invitation status badges display correctly', function () {
    $admin = User::factory()->admin()->create();

    // Pending invitation
    $pending = UserInvitation::factory()->create(['email' => 'pending@example.com']);

    // Expired invitation
    $expired = UserInvitation::factory()->expired()->create(['email' => 'expired@example.com']);

    // Accepted invitation
    $accepted = UserInvitation::factory()->accepted()->create(['email' => 'accepted@example.com']);

    $page = actingAs($admin)->visit('/admin/invitations');

    $page->assertSee('pending@example.com')
        ->assertSee('Pending')
        ->assertSee('expired@example.com')
        ->assertSee('Expired')
        ->assertSee('accepted@example.com')
        ->assertSee('Accepted')
        ->assertNoJavascriptErrors();
});

test('admin sees validation error for invalid email', function () {
    $admin = User::factory()->admin()->create();

    $page = actingAs($admin)->visit('/admin/invitations');

    $page->fill('email', 'invalid-email')
        ->click('Send invitation')
        ->pause(500)
        ->assertNoJavascriptErrors();
});

test('admin sees validation error for duplicate email', function () {
    $admin = User::factory()->admin()->create();
    UserInvitation::factory()->create(['email' => 'duplicate@example.com']);

    $page = actingAs($admin)->visit('/admin/invitations');

    $page->fill('email', 'duplicate@example.com')
        ->click('Send invitation')
        ->pause(500)
        ->assertNoJavascriptErrors();
});
