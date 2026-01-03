<?php

namespace App\Enums;

enum PlaceType: string
{
    case All = 'all';
    case Hotel = 'hotel';
    case Restaurant = 'restaurant';
    case Cafe = 'cafe';
    case Bar = 'bar';
    case FastFood = 'fast_food';
    case Museum = 'museum';
    case Attraction = 'attraction';
    case Viewpoint = 'viewpoint';
    case Monument = 'monument';
    case Castle = 'castle';
    case Ruins = 'ruins';
    case Church = 'church';
    case Temple = 'temple';
    case Mosque = 'mosque';
    case Park = 'park';
    case Garden = 'garden';
    case Zoo = 'zoo';
    case AmusementPark = 'amusement_park';
    case Beach = 'beach';
    case Marina = 'marina';
    case Shop = 'shop';
    case Supermarket = 'supermarket';
    case BusStation = 'bus_station';
    case TrainStation = 'train_station';
    case Airport = 'airport';
    case Ferry = 'ferry';
    case Parking = 'parking';
    case FuelStation = 'fuel';
    case Hospital = 'hospital';
    case Pharmacy = 'pharmacy';
    case Bank = 'bank';
    case ATM = 'atm';
    case PostOffice = 'post_office';
    case Library = 'library';
    case Cinema = 'cinema';
    case Theatre = 'theatre';
    case Gallery = 'gallery';

    /**
     * Get human-readable label for the place type.
     */
    public function label(): string
    {
        return match ($this) {
            self::All => 'Alle Orte',
            self::Hotel => 'Hotel',
            self::Restaurant => 'Restaurant',
            self::Cafe => 'Café',
            self::Bar => 'Bar',
            self::FastFood => 'Fast Food',
            self::Museum => 'Museum',
            self::Attraction => 'Sehenswürdigkeit',
            self::Viewpoint => 'Aussichtspunkt',
            self::Monument => 'Denkmal',
            self::Castle => 'Schloss',
            self::Ruins => 'Ruine',
            self::Church => 'Kirche',
            self::Temple => 'Tempel',
            self::Mosque => 'Moschee',
            self::Park => 'Park',
            self::Garden => 'Garten',
            self::Zoo => 'Zoo',
            self::AmusementPark => 'Freizeitpark',
            self::Beach => 'Strand',
            self::Marina => 'Hafen',
            self::Shop => 'Geschäft',
            self::Supermarket => 'Supermarkt',
            self::BusStation => 'Busbahnhof',
            self::TrainStation => 'Bahnhof',
            self::Airport => 'Flughafen',
            self::Ferry => 'Fähre',
            self::Parking => 'Parkplatz',
            self::FuelStation => 'Tankstelle',
            self::Hospital => 'Krankenhaus',
            self::Pharmacy => 'Apotheke',
            self::Bank => 'Bank',
            self::ATM => 'Geldautomat',
            self::PostOffice => 'Postamt',
            self::Library => 'Bibliothek',
            self::Cinema => 'Kino',
            self::Theatre => 'Theater',
            self::Gallery => 'Galerie',
        };
    }

    /**
     * Get Overpass query conditions for this place type.
     */
    public function getOverpassConditions(): array
    {
        return match ($this) {
            self::All => [
                'node["amenity"]',
                'node["tourism"]',
                'node["shop"]',
                'node["historic"]',
                'node["leisure"]',
            ],
            self::Hotel => [
                'node["tourism"="hotel"]',
                'node["tourism"="guest_house"]',
                'node["tourism"="hostel"]',
                'node["tourism"="motel"]',
            ],
            self::Restaurant => [
                'node["amenity"="restaurant"]',
            ],
            self::Cafe => [
                'node["amenity"="cafe"]',
            ],
            self::Bar => [
                'node["amenity"="bar"]',
                'node["amenity"="pub"]',
            ],
            self::FastFood => [
                'node["amenity"="fast_food"]',
            ],
            self::Museum => [
                'node["tourism"="museum"]',
            ],
            self::Attraction => [
                'node["tourism"="attraction"]',
            ],
            self::Viewpoint => [
                'node["tourism"="viewpoint"]',
            ],
            self::Monument => [
                'node["historic"="monument"]',
                'node["historic"="memorial"]',
            ],
            self::Castle => [
                'node["historic"="castle"]',
            ],
            self::Ruins => [
                'node["historic"="ruins"]',
            ],
            self::Church => [
                'node["amenity"="place_of_worship"]["religion"="christian"]',
                'node["building"="church"]',
            ],
            self::Temple => [
                'node["amenity"="place_of_worship"]["religion"="buddhist"]',
                'node["amenity"="place_of_worship"]["religion"="hindu"]',
            ],
            self::Mosque => [
                'node["amenity"="place_of_worship"]["religion"="muslim"]',
            ],
            self::Park => [
                'node["leisure"="park"]',
            ],
            self::Garden => [
                'node["leisure"="garden"]',
            ],
            self::Zoo => [
                'node["tourism"="zoo"]',
            ],
            self::AmusementPark => [
                'node["tourism"="theme_park"]',
                'node["leisure"="amusement_arcade"]',
            ],
            self::Beach => [
                'node["natural"="beach"]',
            ],
            self::Marina => [
                'node["leisure"="marina"]',
            ],
            self::Shop => [
                'node["shop"]',
            ],
            self::Supermarket => [
                'node["shop"="supermarket"]',
            ],
            self::BusStation => [
                'node["amenity"="bus_station"]',
                'node["highway"="bus_stop"]',
            ],
            self::TrainStation => [
                'node["railway"="station"]',
                'node["railway"="halt"]',
            ],
            self::Airport => [
                'node["aeroway"="aerodrome"]',
                'node["aeroway"="terminal"]',
            ],
            self::Ferry => [
                'node["amenity"="ferry_terminal"]',
            ],
            self::Parking => [
                'node["amenity"="parking"]',
            ],
            self::FuelStation => [
                'node["amenity"="fuel"]',
            ],
            self::Hospital => [
                'node["amenity"="hospital"]',
            ],
            self::Pharmacy => [
                'node["amenity"="pharmacy"]',
            ],
            self::Bank => [
                'node["amenity"="bank"]',
            ],
            self::ATM => [
                'node["amenity"="atm"]',
            ],
            self::PostOffice => [
                'node["amenity"="post_office"]',
            ],
            self::Library => [
                'node["amenity"="library"]',
            ],
            self::Cinema => [
                'node["amenity"="cinema"]',
            ],
            self::Theatre => [
                'node["amenity"="theatre"]',
            ],
            self::Gallery => [
                'node["tourism"="gallery"]',
            ],
        };
    }
}
