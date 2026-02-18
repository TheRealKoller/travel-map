<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\InvitationResource;
use App\Mail\UserInvitationMail;
use App\Models\User;
use App\Models\UserInvitation;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    /**
     * Display a listing of invitations (admin only).
     */
    public function index(): Response
    {
        Gate::authorize('invite-users');

        $invitations = UserInvitation::query()
            ->with('inviter')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('admin/invitations/index', [
            'invitations' => InvitationResource::collection($invitations),
        ]);
    }

    /**
     * Send a new invitation (admin only).
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('invite-users');

        $validated = $request->validate([
            'email' => ['required', 'email', 'lowercase', 'unique:users,email', 'unique:user_invitations,email'],
        ]);

        $invitation = UserInvitation::create([
            'email' => $validated['email'],
            'token' => UserInvitation::generateToken(),
            'invited_by' => Auth::id(),
            'role' => UserRole::User,
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($invitation->email)->send(new UserInvitationMail($invitation));

        return redirect()->back()->with('success', 'Invitation sent successfully.');
    }

    /**
     * Show the registration form for a specific invitation token.
     */
    public function show(string $token): Response
    {
        $invitation = UserInvitation::where('token', $token)->firstOrFail();

        if ($invitation->isExpired()) {
            return Inertia::render('auth/invitation-invalid', [
                'reason' => 'expired',
            ]);
        }

        if ($invitation->isAccepted()) {
            return Inertia::render('auth/invitation-invalid', [
                'reason' => 'already_accepted',
            ]);
        }

        return Inertia::render('auth/register-invitation', [
            'token' => $token,
            'email' => $invitation->email,
        ]);
    }

    /**
     * Accept an invitation and create a new user account.
     */
    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = UserInvitation::where('token', $token)->firstOrFail();

        if (! $invitation->isValid()) {
            return redirect()->route('login')->with('error', 'This invitation is no longer valid.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'lowercase',
                function (string $attribute, mixed $value, Closure $fail) use ($invitation): void {
                    if (strcasecmp((string) $value, (string) $invitation->email) !== 0) {
                        $fail('The '.$attribute.' must match the invitation email.');
                    }
                },
            ],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $invitation->email,
            'password' => Hash::make($validated['password']),
            'role' => $invitation->role,
        ]);

        // Verify email explicitly (not mass-assignable for security)
        $user->forceFill(['email_verified_at' => now()])->save();

        $invitation->update([
            'accepted_at' => now(),
        ]);

        Auth::login($user);

        return redirect()->route('dashboard')->with('success', 'Welcome! Your account has been created successfully.');
    }

    /**
     * Delete an invitation (admin only).
     */
    public function destroy(UserInvitation $invitation): RedirectResponse
    {
        Gate::authorize('invite-users');

        $invitation->delete();

        return redirect()->back()->with('success', 'Invitation deleted successfully.');
    }
}
