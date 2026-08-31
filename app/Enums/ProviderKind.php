<?php

namespace App\Enums;

enum ProviderKind: string
{
    case User = 'user';
    case Landlord = 'landlord';
    case Agent = 'agent';
    case Artisan = 'artisan';
    case Business = 'business';
    case Company = 'company';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
