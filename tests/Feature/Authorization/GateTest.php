<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

uses(RefreshDatabase::class);

describe('User Management Gates', function () {
    test('admin can invite users', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('invite-users'))->toBeTrue();
    });

    test('regular user cannot invite users', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('invite-users'))->toBeFalse();
    });

    test('admin can manage users', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('manage-users'))->toBeTrue();
    });

    test('regular user cannot manage users', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('manage-users'))->toBeFalse();
    });
});

describe('Trip Management Gates', function () {
    test('admin can view all trips', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('view-all-trips'))->toBeTrue();
    });

    test('regular user cannot view all trips', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('view-all-trips'))->toBeFalse();
    });

    test('admin can edit all trips', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('edit-all-trips'))->toBeTrue();
    });

    test('regular user cannot edit all trips', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('edit-all-trips'))->toBeFalse();
    });

    test('admin can delete all trips', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('delete-all-trips'))->toBeTrue();
    });

    test('regular user cannot delete all trips', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('delete-all-trips'))->toBeFalse();
    });
});

describe('Marker Management Gates', function () {
    test('admin can view all markers', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('view-all-markers'))->toBeTrue();
    });

    test('regular user cannot view all markers', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('view-all-markers'))->toBeFalse();
    });

    test('admin can edit all markers', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('edit-all-markers'))->toBeTrue();
    });

    test('regular user cannot edit all markers', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('edit-all-markers'))->toBeFalse();
    });
});

describe('Tour Management Gates', function () {
    test('admin can view all tours', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('view-all-tours'))->toBeTrue();
    });

    test('regular user cannot view all tours', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('view-all-tours'))->toBeFalse();
    });

    test('admin can edit all tours', function () {
        $admin = User::factory()->admin()->create();

        expect(Gate::forUser($admin)->allows('edit-all-tours'))->toBeTrue();
    });

    test('regular user cannot edit all tours', function () {
        $user = User::factory()->create();

        expect(Gate::forUser($user)->allows('edit-all-tours'))->toBeFalse();
    });
});
