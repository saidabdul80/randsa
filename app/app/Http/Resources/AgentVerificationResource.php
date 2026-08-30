<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgentVerificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'whatsapp_number' => $this->whatsapp_number,
            'office_address' => $this->office_address,
            'profile_photo' => $this->profile_photo,
            'id_document' => $this->id_document,
            'cac_document' => $this->cac_document,
            'authorization_document' => $this->authorization_document,
            'status' => $this->status,
            'admin_note' => $this->admin_note,
            'submitted_at' => $this->submitted_at,
            'reviewed_at' => $this->reviewed_at,
            'agent' => new UserProfileResource($this->whenLoaded('agent')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
