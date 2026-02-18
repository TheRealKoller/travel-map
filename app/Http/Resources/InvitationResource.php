<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'invited_by' => $this->invited_by,
            'accepted_at' => $this->accepted_at,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'inviter' => $this->whenLoaded('inviter', fn () => [
                'id' => $this->inviter->id,
                'name' => $this->inviter->name,
            ]),
        ];
    }
}
