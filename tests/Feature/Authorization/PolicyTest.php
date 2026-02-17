<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('TripPolicy Admin Access', function () {
    test('admin can view any trips', function () {
        $admin = User::factory()->admin()->create();

        expect($admin->can('viewAny', Trip::class))->toBeTrue();
    });

    test('regular user cannot view any trips', function () {
        $user = User::factory()->create();

        expect($user->can('viewAny', Trip::class))->toBeFalse();
    });

    test('admin can view any trip regardless of ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);

        expect($admin->can('view', $trip))->toBeTrue();
    });

    test('admin can update any trip regardless of ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);

        expect($admin->can('update', $trip))->toBeTrue();
    });

    test('admin can delete any trip regardless of ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);

        expect($admin->can('delete', $trip))->toBeTrue();
    });
});

describe('TripPolicy Regular User Access', function () {
    test('owner can view their own trip', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        expect($user->can('view', $trip))->toBeTrue();
    });

    test('owner can update their own trip', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        expect($user->can('update', $trip))->toBeTrue();
    });

    test('owner can delete their own trip', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        expect($user->can('delete', $trip))->toBeTrue();
    });

    test('shared user can view shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);

        expect($sharedUser->can('view', $trip))->toBeTrue();
    });

    test('shared user can update shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);

        expect($sharedUser->can('update', $trip))->toBeTrue();
    });

    test('shared user cannot delete shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);

        expect($sharedUser->can('delete', $trip))->toBeFalse();
    });

    test('non-owner non-shared user cannot view trip', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);

        expect($otherUser->can('view', $trip))->toBeFalse();
    });

    test('non-owner non-shared user cannot update trip', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);

        expect($otherUser->can('update', $trip))->toBeFalse();
    });

    test('non-owner non-shared user cannot delete trip', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);

        expect($otherUser->can('delete', $trip))->toBeFalse();
    });
});

describe('MarkerPolicy Admin Access', function () {
    test('admin can view any markers', function () {
        $admin = User::factory()->admin()->create();

        expect($admin->can('viewAny', Marker::class))->toBeTrue();
    });

    test('regular user cannot view any markers', function () {
        $user = User::factory()->create();

        expect($user->can('viewAny', Marker::class))->toBeFalse();
    });

    test('admin can view any marker regardless of ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);
        $marker = Marker::factory()->create([
            'user_id' => $otherUser->id,
            'trip_id' => $trip->id,
        ]);

        expect($admin->can('view', $marker))->toBeTrue();
    });

    test('admin can update any marker regardless of ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);
        $marker = Marker::factory()->create([
            'user_id' => $otherUser->id,
            'trip_id' => $trip->id,
        ]);

        expect($admin->can('update', $marker))->toBeTrue();
    });

    test('admin can delete any marker regardless of ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);
        $marker = Marker::factory()->create([
            'user_id' => $otherUser->id,
            'trip_id' => $trip->id,
        ]);

        expect($admin->can('delete', $marker))->toBeTrue();
    });
});

describe('MarkerPolicy Regular User Access', function () {
    test('owner can view their own marker', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $marker = Marker::factory()->create([
            'user_id' => $user->id,
            'trip_id' => $trip->id,
        ]);

        expect($user->can('view', $marker))->toBeTrue();
    });

    test('owner can update their own marker', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $marker = Marker::factory()->create([
            'user_id' => $user->id,
            'trip_id' => $trip->id,
        ]);

        expect($user->can('update', $marker))->toBeTrue();
    });

    test('owner can delete their own marker', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $marker = Marker::factory()->create([
            'user_id' => $user->id,
            'trip_id' => $trip->id,
        ]);

        expect($user->can('delete', $marker))->toBeTrue();
    });

    test('shared user can view marker in shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);
        $marker = Marker::factory()->create([
            'user_id' => $owner->id,
            'trip_id' => $trip->id,
        ]);

        expect($sharedUser->can('view', $marker))->toBeTrue();
    });

    test('shared user can update marker in shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);
        $marker = Marker::factory()->create([
            'user_id' => $owner->id,
            'trip_id' => $trip->id,
        ]);

        expect($sharedUser->can('update', $marker))->toBeTrue();
    });

    test('shared user can delete marker in shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);
        $marker = Marker::factory()->create([
            'user_id' => $owner->id,
            'trip_id' => $trip->id,
        ]);

        expect($sharedUser->can('delete', $marker))->toBeTrue();
    });

    test('non-owner non-shared user cannot view marker', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $marker = Marker::factory()->create([
            'user_id' => $owner->id,
            'trip_id' => $trip->id,
        ]);

        expect($otherUser->can('view', $marker))->toBeFalse();
    });

    test('non-owner non-shared user cannot update marker', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $marker = Marker::factory()->create([
            'user_id' => $owner->id,
            'trip_id' => $trip->id,
        ]);

        expect($otherUser->can('update', $marker))->toBeFalse();
    });

    test('non-owner non-shared user cannot delete marker', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $marker = Marker::factory()->create([
            'user_id' => $owner->id,
            'trip_id' => $trip->id,
        ]);

        expect($otherUser->can('delete', $marker))->toBeFalse();
    });
});

describe('TourPolicy Admin Access', function () {
    test('admin can view any tours', function () {
        $admin = User::factory()->admin()->create();

        expect($admin->can('viewAny', Tour::class))->toBeTrue();
    });

    test('regular user cannot view any tours', function () {
        $user = User::factory()->create();

        expect($user->can('viewAny', Tour::class))->toBeFalse();
    });

    test('admin can view any tour regardless of trip ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($admin->can('view', $tour))->toBeTrue();
    });

    test('admin can update any tour regardless of trip ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($admin->can('update', $tour))->toBeTrue();
    });

    test('admin can delete any tour regardless of trip ownership', function () {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $otherUser->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($admin->can('delete', $tour))->toBeTrue();
    });
});

describe('TourPolicy Regular User Access', function () {
    test('trip owner can view tour in their trip', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($user->can('view', $tour))->toBeTrue();
    });

    test('trip owner can update tour in their trip', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($user->can('update', $tour))->toBeTrue();
    });

    test('trip owner can delete tour in their trip', function () {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($user->can('delete', $tour))->toBeTrue();
    });

    test('shared user can view tour in shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($sharedUser->can('view', $tour))->toBeTrue();
    });

    test('shared user can update tour in shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($sharedUser->can('update', $tour))->toBeTrue();
    });

    test('shared user can delete tour in shared trip', function () {
        $owner = User::factory()->create();
        $sharedUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $trip->sharedUsers()->attach($sharedUser->id);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($sharedUser->can('delete', $tour))->toBeTrue();
    });

    test('non-owner non-shared user cannot view tour', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($otherUser->can('view', $tour))->toBeFalse();
    });

    test('non-owner non-shared user cannot update tour', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($otherUser->can('update', $tour))->toBeFalse();
    });

    test('non-owner non-shared user cannot delete tour', function () {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);
        $tour = Tour::factory()->create(['trip_id' => $trip->id]);

        expect($otherUser->can('delete', $tour))->toBeFalse();
    });
});
