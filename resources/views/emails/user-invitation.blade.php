<x-mail::message>
# You've Been Invited!

{{ $inviterName }} has invited you to join {{ config('app.name') }}.

Click the button below to create your account and get started.

<x-mail::button :url="$url">
Accept Invitation
</x-mail::button>

**This invitation will expire on {{ $expiresAt }}.**

If you have any questions, please contact us.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
