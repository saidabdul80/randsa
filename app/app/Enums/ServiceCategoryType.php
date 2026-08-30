<?php

namespace App\Enums;

enum ServiceCategoryType: string
{
    case Housing = 'housing';
    case Marketplace = 'marketplace';
    case ArtisanServices = 'artisan_services';
    case Jobs = 'jobs';
    case Rentals = 'rentals';
    case Leisure = 'leisure';
    case Other = 'other';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
