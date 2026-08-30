<?php

namespace App\Enums;

enum ServiceSubCategoryType: string
{
    case Property = 'property';
    case HousingRent = 'housing_rent';
    case HousingSale = 'housing_sale';
    case Marketplace = 'marketplace';
    case ServiceRenderer = 'service_renderer';
    case Job = 'job';
    case Rental = 'rental';
    case Event = 'event';
    case Other = 'other';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
