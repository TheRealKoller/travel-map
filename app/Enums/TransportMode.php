<?php

namespace App\Enums;

enum TransportMode: string
{
    case DrivingCar = 'driving-car';
    case CyclingRegular = 'cycling-regular';
    case FootWalking = 'foot-walking';

    public function label(): string
    {
        return match ($this) {
            self::DrivingCar => 'Car',
            self::CyclingRegular => 'Bicycle',
            self::FootWalking => 'Walking',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::DrivingCar => 'car',
            self::CyclingRegular => 'bike',
            self::FootWalking => 'person-walking',
        };
    }
}
