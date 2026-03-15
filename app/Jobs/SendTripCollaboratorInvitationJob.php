<?php

namespace App\Jobs;

use App\Mail\TripCollaboratorInvited;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendTripCollaboratorInvitationJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Trip $trip,
        public User $invitedUser,
        public User $inviter,
        public string $locale = 'de',
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Mail::to($this->invitedUser->email)
            ->locale($this->locale)
            ->send(new TripCollaboratorInvited($this->trip, $this->invitedUser, $this->inviter));
    }
}
