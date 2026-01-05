# Route Authentication Documentation

This document provides an overview of the authentication requirements for all routes in the Travel Map application.

## Security Status: ✅ All Application Routes Protected

All backend endpoints require authentication except for intentionally public routes (authentication flows, health checks, and public assets).

## Protected Routes (Require Authentication)

### Core Application Routes

All application routes require both `auth` and `verified` middleware:

#### Home & Dashboard
- `GET /` - Home page (redirects to map interface)
- `GET /dashboard` - User dashboard

#### Trips Management
- `GET /trips` - List user's trips
- `POST /trips` - Create new trip
- `GET /trips/{trip}` - View trip details
- `PUT /trips/{trip}` - Update trip
- `DELETE /trips/{trip}` - Delete trip

#### Tours Management
- `GET /tours` - List tours for a trip
- `POST /tours` - Create new tour
- `GET /tours/{tour}` - View tour details
- `PUT /tours/{tour}` - Update tour
- `DELETE /tours/{tour}` - Delete tour
- `POST /tours/{tour}/markers` - Attach marker to tour
- `DELETE /tours/{tour}/markers` - Detach marker from tour
- `PUT /tours/{tour}/markers/reorder` - Reorder tour markers

#### Markers Management
- `GET /markers` - List markers for a trip
- `POST /markers` - Create new marker
- `PUT /markers/{marker}` - Update marker
- `DELETE /markers/{marker}` - Delete marker
- `POST /markers/search-nearby` - Search nearby places
- `GET /markers/place-types` - Get available place types

#### Routes Management
- `GET /routes` - List routes for a trip
- `POST /routes` - Create new route
- `GET /routes/{route}` - View route details
- `DELETE /routes/{route}` - Delete route

### Settings Routes

All settings routes require `auth` middleware:

- `GET /settings` - Redirects to profile settings
- `GET /settings/profile` - Profile settings page
- `PATCH /settings/profile` - Update profile
- `DELETE /settings/profile` - Delete account
- `GET /settings/password` - Password change page
- `PUT /settings/password` - Update password (rate limited)
- `GET /settings/appearance` - Appearance settings
- `GET /settings/two-factor` - Two-factor authentication settings (requires password confirmation)

### Admin/Logs Routes

- `GET /logs` - Log viewer (requires `auth` and `verified`)

### Laravel Fortify Routes (Email Verification & Two-Factor)

These routes require `auth:web` middleware:

- `GET /email/verify` - Email verification notice
- `GET /email/verify/{id}/{hash}` - Verify email address (signed route)
- `POST /email/verification-notification` - Resend verification email (rate limited)
- `POST /logout` - Logout user
- `GET /user/confirm-password` - Password confirmation page
- `POST /user/confirm-password` - Confirm password
- `GET /user/confirmed-password-status` - Check password confirmation status
- `POST /user/two-factor-authentication` - Enable 2FA
- `DELETE /user/two-factor-authentication` - Disable 2FA
- `POST /user/confirmed-two-factor-authentication` - Confirm 2FA setup
- `GET /user/two-factor-qr-code` - Get 2FA QR code
- `GET /user/two-factor-recovery-codes` - Get recovery codes
- `POST /user/two-factor-recovery-codes` - Regenerate recovery codes
- `GET /user/two-factor-secret-key` - Get 2FA secret key

### Development Routes (Protected in Production)

- `POST /_boost/browser-logs` - Laravel Boost browser logging endpoint
  - **Protection**: Auth middleware added in `AppServiceProvider`
  - **Note**: Laravel Boost only runs in local environments and is disabled during tests
  - **Security**: If accidentally enabled in production, requires authentication

## Public Routes (No Authentication Required)

### Authentication & Registration Routes

These routes use `guest` middleware (accessible only to non-authenticated users):

- `GET /login` - Login page
- `POST /login` - Process login (rate limited)
- `GET /register` - Registration page
- `POST /register` - Process registration
- `GET /forgot-password` - Password reset request page
- `POST /forgot-password` - Send password reset email
- `GET /reset-password/{token}` - Password reset form
- `POST /reset-password` - Process password reset
- `GET /two-factor-challenge` - Two-factor authentication challenge page
- `POST /two-factor-challenge` - Verify 2FA code (rate limited)

### System Routes

- `GET /up` - Health check endpoint (required for monitoring systems)
- `GET /storage/{path}` - Public file storage access (Laravel's default public storage)

## Implementation Details

### Primary Protection Mechanism

Routes are protected using Laravel's middleware system:

```php
// In routes/web.php
Route::middleware(['auth', 'verified'])->group(function () {
    // All application routes
});

// In routes/settings.php
Route::middleware('auth')->group(function () {
    // All settings routes
});
```

### Additional Protection for Laravel Boost

Laravel Boost's browser logging endpoint is protected via dynamic middleware injection in `AppServiceProvider`:

```php
// In app/Providers/AppServiceProvider.php
$this->app->booted(function () {
    $route = Route::getRoutes()->getByName('boost.browser-logs');
    if ($route) {
        $route->middleware('auth');
    }
});
```

This ensures that even if Laravel Boost is accidentally enabled in production, the logging endpoint requires authentication.

## Testing

Comprehensive authentication tests are located in `tests/Feature/Auth/RouteAuthenticationTest.php`:

- ✅ 30 tests covering all application endpoints
- ✅ Tests verify unauthorized access returns 401 (Unauthorized) or redirects to login
- ✅ Tests cover trips, tours, markers, routes, settings, and logs

Run tests with:
```bash
./vendor/bin/pest tests/Feature/Auth/RouteAuthenticationTest.php
```

## Security Recommendations

1. **Production Environment**:
   - Ensure `BOOST_ENABLED=false` in production `.env` (or don't set it, as Boost only runs in local environments by default)
   - Verify `APP_ENV=production` in production deployments
   - Keep `APP_DEBUG=false` in production

2. **Rate Limiting**:
   - Login route: 5 attempts per minute per email+IP combination
   - Two-factor route: Default throttling
   - Password update: 6 attempts per minute

3. **Email Verification**:
   - Most application routes require both `auth` AND `verified` middleware
   - Unverified users are limited to verification-related actions

4. **Route Protection Checklist**:
   - ✅ All application data routes protected
   - ✅ All settings routes protected
   - ✅ All admin routes protected
   - ✅ Development tools protected when enabled
   - ✅ Authentication routes appropriately public
   - ✅ Health check remains public for monitoring
   - ✅ Storage routes remain public for asset delivery

## Conclusion

The Travel Map application follows Laravel security best practices:

- **Secure by default**: All application routes require authentication
- **Appropriate exceptions**: Only authentication flows and system endpoints are public
- **Defense in depth**: Multiple middleware layers (auth, verified, password.confirm)
- **Rate limiting**: Sensitive operations are rate-limited
- **Comprehensive testing**: Authentication requirements are validated by tests

Last Updated: 2026-01-05
