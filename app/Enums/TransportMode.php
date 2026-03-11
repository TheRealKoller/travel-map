<?php

namespace App\Enums;

enum TransportMode: string
{
    case DrivingCar = 'driving-car';
    case CyclingRegular = 'cycling-regular';
    case FootWalking = 'foot-walking';
    case PublicTransport = 'public-transport';
    case ManualPublicTransport = 'manual-public-transport';

    public function label(): string
    {
        return match ($this) {
            self::DrivingCar => 'Car',
            self::CyclingRegular => 'Bicycle',
            self::FootWalking => 'Walking',
            self::PublicTransport => 'Public Transport',
            self::ManualPublicTransport => 'Public Transport (Manual)',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::DrivingCar => 'car',
            self::CyclingRegular => 'bike',
            self::FootWalking => 'person-walking',
            self::PublicTransport => 'train',
            self::ManualPublicTransport => 'train',
        };
    }
}
