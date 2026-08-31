<?php

namespace App\Enums;

enum ListingTransactionType: string
{
    case Rent = 'rent';
    case Sale = 'sale';
    case Service = 'service';
    case Hire = 'hire';
    case Booking = 'booking';
    case Lease = 'lease';
    case Job = 'job';
    case Cv = 'cv';
    case Other = 'other';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
