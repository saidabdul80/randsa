<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentVerification extends Model
{
    protected $fillable = [
        'agent_id',
        'full_name',
        'phone',
        'whatsapp_number',
        'office_address',
        'profile_photo',
        'id_document',
        'cac_document',
        'authorization_document',
        'status',
        'admin_note',
        'submitted_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'profile_photo' => 'array',
            'id_document' => 'array',
            'cac_document' => 'array',
            'authorization_document' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
