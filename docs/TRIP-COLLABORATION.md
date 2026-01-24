# Trip Collaboration Feature

This document describes the multi-user trip collaboration feature that allows trip owners to share their trips with other users.

## Overview

Trip collaboration enables multiple users to work together on a single trip. The trip owner can invite other users as collaborators, who can then view and edit all trip-related data including markers, tours, and routes.

## Roles

### Owner
- The user who created the trip
- Full access to all trip data
- Can add/remove collaborators
- Can delete the trip

### Editor (Collaborator)
- Can view the trip and all its data
- Can create, edit, and delete markers
- Can create, edit, and delete tours
- Can create and delete routes
- **Cannot** delete the trip
- **Cannot** add or remove other collaborators

## API Endpoints

### List Trip Collaborators

```http
GET /trips/{trip}/collaborators
```

**Authorization:** User must have view access to the trip

**Response:**
```json
{
  "owner": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "owner",
    "created_at": "2024-01-01T00:00:00.000000Z"
  },
  "collaborators": [
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "editor",
      "created_at": "2024-01-15T00:00:00.000000Z"
    }
  ]
}
```

### Add Collaborator

```http
POST /trips/{trip}/collaborators
```

**Authorization:** Only the trip owner can add collaborators

**Request Body:**
```json
{
  "email": "jane@example.com",
  "role": "editor"
}
```

**Validation:**
- `email` - required, must be a valid email, must exist in users table
- `role` - optional, defaults to "editor", must be "editor"

**Response (201 Created):**
```json
{
  "message": "Collaborator added successfully",
  "collaborator": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "editor"
  }
}
```

**Errors:**
- `403 Forbidden` - User is not the trip owner
- `422 Unprocessable Entity` - User is already owner or already a collaborator

### Remove Collaborator

```http
DELETE /trips/{trip}/collaborators/{user}
```

**Authorization:** Only the trip owner can remove collaborators

**Response:** `204 No Content`

**Errors:**
- `403 Forbidden` - User is not the trip owner
- `422 Unprocessable Entity` - Cannot remove the trip owner

## Database Schema

### trip_user Table

Pivot table storing the many-to-many relationship between trips and users.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| trip_id | bigint | Foreign key to trips table |
| user_id | bigint | Foreign key to users table |
| role | enum | Role: 'owner' or 'editor' (default: 'editor') |
| created_at | timestamp | When the collaboration was created |
| updated_at | timestamp | When the collaboration was last updated |

**Constraints:**
- Unique constraint on (trip_id, user_id)
- Foreign keys cascade on delete

## Authorization

Authorization is enforced at multiple levels:

1. **TripPolicy**: Checks if user is owner or shared user for view/update operations
2. **MarkerPolicy**: Checks if user owns the marker or has access to its trip
3. **TourPolicy**: Checks if user has access to the tour's trip
4. **RouteController**: Uses trip authorization via TripPolicy

## Trip Listing

When a user requests their trip list (`GET /trips`), the response includes:
- All trips they own (`trips` relationship)
- All trips shared with them (`sharedTrips` relationship)

The results are ordered by creation date (ascending).

## Usage Examples

### Share a trip with another user

```javascript
// Add collaborator
const response = await fetch('/trips/123/collaborators', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    email: 'collaborator@example.com',
  }),
});
```

### Remove a collaborator

```javascript
// Remove collaborator
await fetch('/trips/123/collaborators/456', {
  method: 'DELETE',
  headers: {
    'Accept': 'application/json',
  },
});
```

### Check if user can edit a trip

```javascript
// The backend automatically checks authorization
// When a collaborator tries to update a trip:
const response = await fetch('/trips/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Trip Name',
  }),
});

// Will succeed if user is owner or editor
// Will return 403 if user has no access
```

## Implementation Notes

### Models

**Trip Model:**
- `sharedUsers()` - BelongsToMany relationship with User
- `hasAccess(User $user)` - Check if user has access (owner or shared)
- `isOwner(User $user)` - Check if user is the owner

**User Model:**
- `sharedTrips()` - BelongsToMany relationship with Trip
- `allAccessibleTrips()` - Query for all trips user can access (owned + shared)

### Services

**TripService:**
- `getActiveTrip()` - Updated to check both owned and shared trips
- `findTripForUser()` - Updated to use `hasAccess()` check

## Testing

The feature includes 21 comprehensive tests covering:
- Adding/removing collaborators
- Authorization checks for owners and non-owners
- Viewing, updating, and deleting shared trips
- Access to markers, tours, and routes in shared trips
- Trip listing includes shared trips
- Map access for shared trips

Run tests:
```bash
./vendor/bin/pest tests/Feature/TripCollaborationTest.php
```

## Future Enhancements

Potential future improvements:
- Additional roles (e.g., "viewer" with read-only access)
- Email notifications when added as collaborator
- Activity log for collaboration actions
- Frontend UI for managing collaborators
- Invitation system for users not yet registered
