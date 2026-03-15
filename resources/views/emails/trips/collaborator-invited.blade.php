<x-mail::message>
# {{ __('mail.trip_collaborator_invited.greeting') }}

{{ __('mail.trip_collaborator_invited.intro', ['inviter' => $inviterName, 'trip' => $tripName]) }}

<x-mail::button :url="$tripUrl">
{{ __('mail.trip_collaborator_invited.action') }}
</x-mail::button>

{{ __('mail.trip_collaborator_invited.outro') }}

{{ config('app.name') }}
</x-mail::message>
