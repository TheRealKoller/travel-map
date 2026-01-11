# Copilot Instructions for Travel Map

## Project Overview

This is a **Travel Map** application built with Laravel 12 (PHP 8.2+) backend and React 19 + TypeScript frontend using Inertia.js for seamless SPA-like experiences. The application allows users to manage travel markers on interactive maps using Leaflet.js.

**Repository Size:** ~470 packages (NPM), ~135 packages (Composer)  
**Languages:** PHP, TypeScript/JavaScript (React), CSS (TailwindCSS)  
**Frameworks:** Laravel 12, React 19, Inertia.js v2, Vite 7  
**Testing:** Pest (PHP), 41 existing tests  
**Database:** SQLite (default), supports MySQL/PostgreSQL

## Workflow

- when you begin working on a new feature or bugfix, please create a new branch from `main` named `feature/your-feature-name` or `bugfix/your-bugfix-name`.
- After finishing the current task, please run all tests to ensure nothing is broken.
- If any tests fail, please fix the issues before proceeding.
- When all tests pass, please execute prettier and PHP CS Fixer to ensure code style consistency.
- Finally, run static analysis tools like PHPStan and Psalm to catch potential issues early.

## Environment Setup

### Required Versions
- **PHP:** 8.2 or higher (CI uses 8.4)
- **Composer:** 2.8+
- **Node.js:** 18 or higher (CI uses Node 22)
- **npm:** 10.8+

### Initial Setup Steps

**ALWAYS follow this exact sequence for a fresh clone:**

1. **Install PHP dependencies first:**
   ```bash
   composer install --no-interaction --prefer-dist --optimize-autoloader
   ```
   - Takes ~30-60 seconds
   - Ignore warnings about "Ambiguous class resolution" - these are benign

2. **Install Node dependencies:**
   ```bash
   npm ci
   ```
   - Takes ~20-30 seconds
   - May show 1 moderate vulnerability in vite (safe to ignore for development)

3. **Setup environment file:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   - The `.env.example` defaults to SQLite (no additional DB setup needed)
   - Database file is auto-created at `database/database.sqlite`
   - **Security:** APP_KEY is generated dynamically and never committed to git
   - For E2E tests, the key is auto-generated when running `npm run test:e2e`

4. **Run migrations:**
   ```bash
   php artisan migrate --force
   ```
   - Takes ~30ms
   - Uses SQLite by default (no MySQL/PostgreSQL setup needed)

5. **Build frontend assets:**
   ```bash
   npm run build
   ```
   - Takes ~10 seconds
   - Produces files in `public/build/`
   - You may see a warning about chunk sizes >500kB (this is expected, can be ignored)

## Build & Development

### Building Assets

**Production build:**
```bash
npm run build
```
- Always required before running tests in CI
- Output goes to `public/build/`
- Takes ~10 seconds

**Development mode:**
```bash
npm run dev
```
- Starts Vite dev server on default port
- Use alongside `php artisan serve` for local development
- Auto-reloads on file changes

### Alternative: All-in-one dev command
```bash
composer dev
```
- Runs `php artisan serve`, `php artisan queue:listen`, and `npm run dev` concurrently
- Requires manual termination (Ctrl+C)

## Testing

### Running Tests

**ALWAYS run tests using one of these commands:**

```bash
./vendor/bin/pest
```
OR
```bash
composer test
```
OR
```bash
php artisan test
```

- All commands run the same Pest test suite (41 tests)
- Takes ~2-3 seconds
- Tests use in-memory SQLite (`:memory:`), so no database setup needed
- **Important:** `composer test` clears config cache first, which is safer

### Test Structure
- **Unit tests:** `tests/Unit/` - Pure unit tests
- **Feature tests:** `tests/Feature/` - Integration tests with database
- Test configuration: `phpunit.xml` and `tests/Pest.php`
- Tests automatically use `DB_CONNECTION=sqlite` and `DB_DATABASE=:memory:`

## Testing Guidelines: No Real External API Calls

**CRITICAL RULE: ALL tests (Unit, Feature, E2E) MUST NOT make real requests to 3rd-party APIs.**

### General Testing Principles
- **Mock ALL external services**: Mapbox, payment gateways, email services, etc.
- **Intercept ALL HTTP requests**: Use Laravel's `Http::fake()` to intercept requests
- **Provide fake responses**: All intercepted requests must return appropriate fake/mock responses
- **Never use real API keys in tests**: Use fake tokens that follow the correct format but don't work with real APIs

### PHP Tests (Unit & Feature)
- Use Laravel's `Http::fake()` to mock HTTP clients:
  ```php
  use Illuminate\Support\Facades\Http;
  
  Http::fake([
      'api.mapbox.com/*' => Http::response(['data' => 'mocked'], 200),
      'api.stripe.com/*' => Http::response(['id' => 'fake_id'], 200),
  ]);
  ```
- Use `Http::preventStrayRequests()` to ensure no unmocked requests slip through
- Mock external services using Laravel's service container or test doubles

### Why This Matters
- **Speed**: Tests run faster without real API calls
- **Reliability**: Tests don't fail due to network issues or API rate limits
- **Cost**: Avoid unnecessary API usage charges
- **Isolation**: Tests remain independent and deterministic
- **CI/CD**: Tests work in isolated environments without API keys

### E2E Testing Best Practices

**Test Selectors:**
- **ALWAYS use `data-testid` attributes** for selecting elements in E2E tests
- Add `data-testid` to all interactive elements (buttons, inputs, forms, links, etc.)
- Use descriptive, kebab-case naming: `data-testid="create-marker-button"`, `data-testid="marker-name-input"`
- Select elements in tests using: `page.getByTestId('element-id')` or  `page.locator('[data-testid="element-id"]')` when necessary
- Avoid selecting by text content, CSS classes, or element types as they are fragile and break easily
- Exception: Text content can be used for non-interactive elements like headings or labels when appropriate

**Test Assertions:**
- **NEVER use `if` statements to check element visibility** - they cause tests to pass silently when elements are missing
- **ALWAYS use `await expect().toBeVisible()`** to assert element visibility
- **Use proper timeouts** for async operations: `{ timeout: 5000 }` or `{ timeout: 10000 }`
- If an element might not be visible, use `try/catch` or explicitly check with `.catch()`, but always fail the test if the element is required

**Anti-patterns (DO NOT DO):**
```typescript
// BAD: Test passes even if button is not visible
if (await button.isVisible({ timeout: 2000 })) {
    await button.click();
}

// BAD: No else clause means test passes silently
const element = page.locator('text=Something');
if (await element.isVisible()) {
    await expect(element).toHaveText('Expected');
}
```

**Good patterns:**
```typescript
// GOOD: Test fails if button is not visible
const button = page.getByTestId('submit-button');
await expect(button).toBeVisible({ timeout: 5000 });
await button.click();

// GOOD: For optional elements, use try/catch and handle both cases explicitly
try {
    const optional = page.locator('text=Optional');
    await expect(optional).toBeVisible({ timeout: 2000 });
    // Handle the case when it's visible
} catch {
    // Explicitly handle when it's not visible (if that's valid)
}
```

**Example:**
```tsx
// Good: Using data-testid
<button data-testid="save-marker-button" onClick={handleSave}>
  Save Marker
</button>

// In test:
await page.getByTestId('save-marker-button').click();
```

**Running E2E Tests:**
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with interactive UI
npm run test:e2e:headed    # Run in headed mode (see browser)
npm run test:e2e:debug     # Run in debug mode
```

## Linting & Formatting

### PHP Code Formatting (Laravel Pint)

**Check for style issues:**
```bash
./vendor/bin/pint --test
```

**Auto-fix style issues:**
```bash
./vendor/bin/pint
```

- Pint uses Laravel's default style rules (no custom pint.json)
- **ALWAYS run Pint before committing PHP code**
- Auto-fixes imports, spacing, braces, etc.

### JavaScript/TypeScript Formatting (Prettier)

**Check formatting:**
```bash
npm run format:check
```

**Auto-fix formatting:**
```bash
npm run format
```

- Uses Prettier with Tailwind plugin
- Organizes imports automatically
- Configuration in `.prettierrc`

### JavaScript/TypeScript Linting (ESLint)

**Lint and auto-fix:**
```bash
npm run lint
```

- Uses ESLint 9 with flat config (`eslint.config.js`)
- Includes React, TypeScript, and React Hooks rules
- Automatically fixes most issues

### TypeScript Type Checking

```bash
npm run types
```

- Runs `tsc --noEmit` to check types without building
- Takes ~2-3 seconds
- **Run this after making TypeScript changes**

## GitHub Actions Workflows

### Test Workflow (`.github/workflows/tests.yml`)

**Triggers:** Push/PR to `develop` or `main` branches

**Steps performed:**
1. Checkout code
2. Setup PHP 8.4 with Composer
3. Setup Node.js 22 with npm cache
4. `npm ci` - Install Node dependencies
5. `composer install` - Install PHP dependencies  
6. `npm run build` - Build frontend assets
7. `cp .env.example .env` - Setup environment
8. `php artisan key:generate` - Generate app key
9. `./vendor/bin/pest` - Run tests

**To replicate CI locally:**
```bash
npm ci
composer install --no-interaction --prefer-dist --optimize-autoloader
npm run build
cp .env.example .env
php artisan key:generate
./vendor/bin/pest
```

### Lint Workflow (`.github/workflows/lint.yml`)

**Triggers:** Push/PR to `develop` or `main` branches

**Steps performed:**
1. Checkout code
2. Setup PHP 8.4
3. `composer install` and `npm install`
4. `vendor/bin/pint` - Format PHP code
5. `npm run format` - Format JS/TS code
6. `npm run lint` - Lint JS/TS code

**To replicate CI locally:**
```bash
composer install -q --no-ansi --no-interaction --no-scripts --no-progress --prefer-dist
npm install
vendor/bin/pint
npm run format
npm run lint
```

**Note:** Auto-commit is currently disabled (commented out) in the workflow

## Project Architecture

### Backend (Laravel)

**Key directories:**
- `app/Models/` - Eloquent models (User, Marker)
- `app/Http/Controllers/` - HTTP controllers including MarkerController
- `app/Http/Middleware/` - HandleInertiaRequests, HandleAppearance
- `app/Http/Requests/` - Form request validation classes
- `app/Actions/Fortify/` - Laravel Fortify authentication actions
- `app/Policies/` - Authorization policies (MarkerPolicy)
- `app/Providers/` - Service providers (AppServiceProvider, FortifyServiceProvider)

**Routes:**
- `routes/web.php` - Web routes (markers, auth)
- `routes/settings.php` - Settings routes (profile, password, 2FA)
- `routes/console.php` - Artisan commands

**Database:**
- `database/migrations/` - Schema migrations (7 migrations total)
- `database/seeders/` - Database seeders
- `database/factories/` - Model factories

**Configuration:**
- `config/` - Laravel config files (app, database, auth, fortify, inertia, etc.)
- `.env` - Environment variables

### Frontend (React + TypeScript)

**Key directories:**
- `resources/js/pages/` - Inertia.js page components
  - `auth/` - Authentication pages (login, register, etc.)
  - `settings/` - User settings pages
  - `map.tsx` - Main map interface
  - `dashboard.tsx` - Dashboard page
- `resources/js/components/` - Reusable React components
  - UI components using Radix UI + Tailwind
  - `travel-map.tsx` - Main map component with Leaflet
- `resources/js/types/` - TypeScript type definitions
- `resources/css/` - Global CSS files

**Build configuration:**
- `vite.config.ts` - Vite configuration with Laravel plugin
- `tsconfig.json` - TypeScript configuration (strict mode, ESNext target)
- `eslint.config.js` - ESLint flat config
- `.prettierrc` - Prettier configuration
- `tailwind.config.js` - TailwindCSS configuration (auto-generated)
- `components.json` - shadcn/ui components config

### Entry Points

- **Backend:** `public/index.php` (Laravel entry point)
- **Frontend:** `resources/js/app.tsx` (Inertia app)
- **SSR:** `resources/js/ssr.tsx` (Server-side rendering entry)
- **Blade template:** `resources/views/app.blade.php` (HTML wrapper)

## Common Tasks & Pitfalls

### Making Code Changes

1. **For PHP changes:**
   - Edit files in `app/`, `routes/`, `database/`, `config/`
   - Run `./vendor/bin/pint` to format
   - Run `./vendor/bin/pest` to test
   - Run `php artisan config:clear` if config changes aren't reflecting

2. **For TypeScript/React changes:**
   - Edit files in `resources/js/`
   - Run `npm run types` to check types
   - Run `npm run lint` to lint
   - Run `npm run format` to format
   - Run `npm run build` to verify it builds
   - Run `./vendor/bin/pest` to ensure backend integration tests pass

3. **For full-stack features:**
   - Make backend changes first (models, controllers, routes)
   - Then make frontend changes (pages, components)
   - **ALWAYS** run both PHP and JS linters
   - **ALWAYS** run tests
   - **ALWAYS** build assets before final verification

### Common Errors & Solutions

**Error: "npm WARN deprecated"**
- **Solution:** Ignore - these are informational warnings about transitive dependencies

**Error: "Target class does not exist"**
- **Solution:** Run `composer dump-autoload`

**Error: "Application key not set"**
- **Solution:** Run `php artisan key:generate`

**Error: "No such table" in tests**
- **Solution:** Tests use in-memory SQLite automatically - this shouldn't happen. If it does, check `phpunit.xml` for `DB_CONNECTION=sqlite` and `DB_DATABASE=:memory:`

**Error: Vite not found or connection refused**
- **Solution:** Run `npm run build` for production, or `npm run dev` for development

**Error: "Class not found" after adding new PHP class**
- **Solution:** Composer's autoloader needs refresh: `composer dump-autoload`

### Database Notes

- Default is **SQLite** stored at `database/database.sqlite`
- For MySQL/PostgreSQL, update `.env` with connection details
- Migrations create: users, cache, jobs, sessions, markers tables
- Tests ALWAYS use in-memory SQLite regardless of `.env` settings

### Performance Notes

- `npm run build` takes ~10 seconds
- `composer install` takes ~30-60 seconds on first run
- `npm ci` takes ~20-30 seconds
- Tests run in ~2-3 seconds
- Database migrations complete in <50ms with SQLite

## Additional Commands

### Clear Laravel caches:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Serve application locally:
```bash
# Terminal 1
php artisan serve
# Terminal 2
npm run dev
# Access at http://localhost:8000
```

### Docker (optional):
```bash
docker-compose up -d
# Starts MariaDB on port 3306 and Adminer on port 8080
```

## Final Checklist Before Committing

**Run these commands in sequence:**

1. `./vendor/bin/pint` - Format PHP code
2. `npm run format` - Format JS/TS code  
3. `npm run lint` - Lint JS/TS code
4. `npm run types` - Check TypeScript types
5. `npm run build` - Ensure frontend builds
6. `composer test` - Run all tests (clears config cache first)

**If all pass, your changes are ready to commit!**

## Trust These Instructions

These instructions are comprehensive and tested. **ALWAYS follow them exactly** unless you encounter an error not documented here. If you find missing or incorrect information, update this file and note the discrepancy, but otherwise trust the documented commands and sequences.

---

## Coding Style Guidelines

### General Coding Standards

- Follow **PSR-12** coding style and structure.
- Prefer short, expressive, and readable code.
- Use **meaningful, descriptive variable, function, class, and file names**.
- Apply proper PHPDoc blocks for classes, methods, and complex logic.
- Organize code into small, reusable functions or classes with single responsibility.
- Avoid magic numbers or hard-coded strings; use constants or config files.

### PHP 8.2/8.4 Best Practices

- Use **readonly properties** to enforce immutability where applicable.
- Use **Enums** instead of string or integer constants.
- Utilize **First-class callable syntax** for callbacks.
- Leverage **Constructor Property Promotion**.
- Use **Union Types**, **Intersection Types**, and **true/false return types** for strict typing.
- Apply **Static Return Type** where needed.
- Use the **Nullsafe Operator (?->)** for optional chaining.
- Adopt **final classes** where extension is not intended.
- Use **Named Arguments** for improved clarity when calling functions with multiple parameters.

### Laravel 12 Project Structure & Conventions

- Follow the official Laravel project structure:

  - `app/Http/Controllers` - Controllers
  - `app/Models` - Eloquent models
  - `app/Http/Requests` - Form request validation
  - `app/Http/Resources` - API resource responses
  - `app/Enums` - Enums
  - `app/Services` - Business logic
  - `app/Data` - Data Transfer Objects (DTOs)
  - `app/Actions` - Single-responsibility action classes
  - `app/Policies` - Authorization logic

- Controllers must:

  - Be thin.
  - Use dependency injection.
  - Use Form Requests for validation.
  - Return typed responses (e.g., `JsonResponse`).
  - Use Resource classes for API responses.

- Business logic should reside in:
  - Service classes
  - Action classes
  - Event listeners or Jobs for asynchronous tasks

### Eloquent ORM & Database

- Use **Eloquent Models** with proper `$fillable` or `$guarded` attributes for mass assignment protection.
- Utilize **casts** for date, boolean, JSON, and custom data types.
- Apply **accessors & mutators** for attribute transformation.
- Avoid direct raw SQL unless absolutely necessary; prefer Eloquent or Query Builder.
- Migrations:
  - Always use migrations for schema changes.
  - Include proper constraints (foreign keys, unique indexes, etc.).
  - Prefer UUIDs or ULIDs as primary keys where applicable.

### API Development

- Use **API Resource classes** for consistent and structured JSON responses.
- Apply **route model binding** where possible.
- Use Form Requests for input validation.
- Adhere to proper HTTP status codes (200, 201, 204, 400, 422, 500, etc.).
- Include versioning in API routes if applicable (e.g., `/api/v1/users`).

### Security Best Practices

- Never trust user input; always validate and sanitize inputs.
- Use prepared statements via Eloquent or Query Builder to prevent SQL injection.
- Use Laravel's built-in CSRF, XSS, and validation mechanisms.
- Store sensitive information in `.env`, never hard-code secrets.
- Apply proper authorization checks using Policies or Gates.
- Follow principle of least privilege for users, roles, and permissions.

### Testing Standards

- Prefer **PHPUnit** with clear, human-readable test names.
- Use **factories** for test data setup.
- Include feature tests for user-facing functionality.
- Include unit tests for business logic, services, and helper classes.
- Mock external services using Laravel's `Http::fake()` or equivalent.
- Maintain high code coverage but focus on meaningful tests over 100% coverage obsession.

### Software Quality & Maintainability

- Follow **SOLID Principles**:

  - Single Responsibility Principle (SRP)
  - Open/Closed Principle (OCP)
  - Liskov Substitution Principle (LSP)
  - Interface Segregation Principle (ISP)
  - Dependency Inversion Principle (DIP)

- Follow **DRY** (Don't Repeat Yourself) and **KISS** (Keep It Simple, Stupid) principles.
- Apply **YAGNI** (You Aren't Gonna Need It) to avoid overengineering.
- Document complex logic with PHPDoc and inline comments.

### Performance & Optimization

- Eager load relationships to avoid N+1 queries.
- Use caching with Laravel's Cache system for frequently accessed data.
- Paginate large datasets using `paginate()` instead of `get()`.
- Queue long-running tasks using Laravel Queues.
- Optimize database indexes for common queries.

### Modern Laravel Features to Use

- Use **Job batching** for complex queue workflows.
- Use **Event Broadcasting** if real-time updates are needed.
- Use **Laravel Scout** and **Full-text search** if search functionality is required.
- Use **Rate Limiting** for API routes.
- Consider **Laravel Vapor** or **Octane** for serverless or high-performance applications (optional).

### Additional Copilot Behavior Preferences

- Generate **strictly typed**, modern PHP code using latest language features.
- Prioritize **readable, clean, maintainable** code over cleverness.
- Avoid legacy or deprecated Laravel patterns (facade overuse, logic-heavy views, etc.).
- Suggest proper class placement based on Laravel directory structure.
- Suggest tests alongside new features where applicable.
- Default to **immutability**, **dependency injection**, and **encapsulation** best practices.
- Avoid starting responses with "Sure!", "You're right!" or similar phrases; be direct and concise.
- When writing text that'll be visible to users, use **clear, professional language** without unnecessary exclamations or informalities. Also use Sentence case for titles and headings.

---

## React Specific Guidelines

### Component Design

- **Functional Components & Hooks:** Prefer **functional components with React Hooks**. Avoid class components unless explicitly for error boundaries.
- **Single Responsibility:** Each component should ideally have one primary responsibility. **Components should be kept small and focused.**
- **Component Naming:** Use `PascalCase` for all component names (e.g., `MyButton`, `UserAvatar`).
- **Props:**
  - Use `camelCase` for prop names.
  - Destructure props in the component's function signature.
  - Provide clear `interface` or `type` definitions for props in TypeScript.
- **Immutability:** Never mutate props or state directly. Always create new objects or arrays for updates.
- **Fragments:** Use `<>...</>` or `React.Fragment` to avoid unnecessary DOM wrapper elements.
- **Custom Hooks:** Extract reusable stateful logic into **custom hooks** (e.g., `useDebounce`, `useLocalStorage`).
- **UI Components:** Use [shadcn/ui](https://ui.shadcn.com/) for building UI components to ensure consistency and accessibility.

### State Management

- **Local State:** Use `useState` for component-level state.
- **Global State:** For global or shared state, prefer **React Context API** or a dedicated state management library (e.g., Zustand, Redux, Jotai). Avoid prop drilling.

### Styling

- **Consistent Approach:** use Tailwind CSS v4 ou later.
- **Scoped Styles:** Ensure styles are scoped to avoid global conflicts.

### Performance

- **Keys:** Always provide a unique and stable `key` prop when mapping over lists. Do not use array `index` as a key if the list can change.
- **Lazy Loading:** Suggest `React.lazy` and `Suspense` for code splitting large components or routes.

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context
This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.14
- inertiajs/inertia-laravel (INERTIA) - v2
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/wayfinder (WAYFINDER) - v0
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA) - v2
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure - don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Replies
- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.


=== boost rules ===

## Laravel Boost
- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan
- Use the `list-artisan-commands` tool when you need to call an Artisan command to double check the available parameters.

## URLs
- Whenever you share a project URL with the user you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain / IP, and port.

## Tinker / Debugging
- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool
- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)
- Boost comes with a powerful `search-docs` tool you should use before any other approaches. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation specific for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The 'search-docs' tool is perfect for all Laravel related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel-ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries - package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax
- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit"
3. Quoted Phrases (Exact Position) - query="infinite scroll" - Words must be adjacent and in that order
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit"
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms


=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors
- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters.

### Type Declarations
- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments
- Prefer PHPDoc blocks over comments. Never use comments within the code itself unless there is something _very_ complex going on.

## PHPDoc Blocks
- Add useful array shape type definitions for arrays when appropriate.

## Enums
- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.


=== inertia-laravel/core rules ===

## Inertia Core

- Inertia.js components should be placed in the `resources/js/Pages` directory unless specified differently in the JS bundler (vite.config.js).
- Use `Inertia::render()` for server-side routing instead of traditional Blade views.
- Use `search-docs` for accurate guidance on all things Inertia.

<code-snippet lang="php" name="Inertia::render Example">
// routes/web.php example
Route::get('/users', function () {
    return Inertia::render('Users/Index', [
        'users' => User::all()
    ]);
});
</code-snippet>


=== inertia-laravel/v2 rules ===

## Inertia v2

- Make use of all Inertia features from v1 & v2. Check the documentation before making any changes to ensure we are taking the correct approach.

### Inertia v2 New Features
- Polling
- Prefetching
- Deferred props
- Infinite scrolling using merging props and `WhenVisible`
- Lazy loading data on scroll

### Deferred Props & Empty States
- When using deferred props on the frontend, you should add a nice empty state with pulsing / animated skeleton.

### Inertia Form General Guidance
- The recommended way to build forms when using Inertia is with the `<Form>` component - a useful example is below. Use `search-docs` with a query of `form component` for guidance.
- Forms can also be built using the `useForm` helper for more programmatic control, or to follow existing conventions. Use `search-docs` with a query of `useForm helper` for guidance.
- `resetOnError`, `resetOnSuccess`, and `setDefaultsOnSuccess` are available on the `<Form>` component. Use `search-docs` with a query of 'form component resetting' for guidance.


=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database
- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation
- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources
- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Controllers & Validation
- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

### Queues
- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### Authentication & Authorization
- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

### URL Generation
- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration
- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing
- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] <name>` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

### Vite Error
- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.


=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version specific documentation.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

### Laravel 12 Structure
- No middleware files in `app/Http/Middleware/`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- **No app\Console\Kernel.php** - use `bootstrap/app.php` or `routes/console.php` for console configuration.
- **Commands auto-register** - files in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database
- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 11 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models
- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.


=== wayfinder/core rules ===

## Laravel Wayfinder

Wayfinder generates TypeScript functions and types for Laravel controllers and routes which you can import into your client side code. It provides type safety and automatic synchronization between backend routes and frontend code.

### Development Guidelines
- Always use `search-docs` to check wayfinder correct usage before implementing any features.
- Always Prefer named imports for tree-shaking (e.g., `import { show } from '@/actions/...'`)
- Avoid default controller imports (prevents tree-shaking)
- Run `wayfinder:generate` after route changes if Vite plugin isn't installed

### Feature Overview
- Form Support: Use `.form()` with `--with-form` flag for HTML form attributes — `<form {...store.form()}>` → `action="/posts" method="post"`
- HTTP Methods: Call `.get()`, `.post()`, `.patch()`, `.put()`, `.delete()` for specific methods — `show.head(1)` → `{ url: "/posts/1", method: "head" }`
- Invokable Controllers: Import and invoke directly as functions. For example, `import StorePost from '@/actions/.../StorePostController'; StorePost()`
- Named Routes: Import from `@/routes/` for non-controller routes. For example, `import { show } from '@/routes/post'; show(1)` for route name `post.show`
- Parameter Binding: Detects route keys (e.g., `{post:slug}`) and accepts matching object properties — `show("my-post")` or `show({ slug: "my-post" })`
- Query Merging: Use `mergeQuery` to merge with `window.location.search`, set values to `null` to remove — `show(1, { mergeQuery: { page: 2, sort: null } })`
- Query Parameters: Pass `{ query: {...} }` in options to append params — `show(1, { query: { page: 1 } })` → `"/posts/1?page=1"`
- Route Objects: Functions return `{ url, method }` shaped objects — `show(1)` → `{ url: "/posts/1", method: "get" }`
- URL Extraction: Use `.url()` to get URL string — `show.url(1)` → `"/posts/1"`

### Example Usage

<code-snippet name="Wayfinder Basic Usage" lang="typescript">
    // Import controller methods (tree-shakable)
    import { show, store, update } from '@/actions/App/Http/Controllers/PostController'

    // Get route object with URL and method...
    show(1) // { url: "/posts/1", method: "get" }

    // Get just the URL...
    show.url(1) // "/posts/1"

    // Use specific HTTP methods...
    show.get(1) // { url: "/posts/1", method: "get" }
    show.head(1) // { url: "/posts/1", method: "head" }

    // Import named routes...
    import { show as postShow } from '@/routes/post' // For route name 'post.show'
    postShow(1) // { url: "/posts/1", method: "get" }
</code-snippet>


### Wayfinder + Inertia
If your application uses the `<Form>` component from Inertia, you can use Wayfinder to generate form action and method automatically.
<code-snippet name="Wayfinder Form Component (React)" lang="typescript">

<Form {...store.form()}><input name="title" /></Form>

</code-snippet>


=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.


=== pest/core rules ===

## Pest

### Testing
- If you need to verify a feature is working, write or update a Unit / Feature test.

### Pest Tests
- All tests must be written using Pest. Use `php artisan make:test --pest <name>`.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files - these are core to the application.
- Tests should test all of the happy paths, failure paths, and weird paths.
- Tests live in the `tests/Feature` and `tests/Unit` directories.
- Pest tests look and behave like this:
<code-snippet name="Basic Pest Test Example" lang="php">
it('is true', function () {
    expect(true)->toBeTrue();
});
</code-snippet>

### Running Tests
- Run the minimal number of tests using an appropriate filter before finalizing code edits.
- To run all tests: `php artisan test`.
- To run all tests in a file: `php artisan test tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --filter=testName` (recommended after making a change to a related file).
- When the tests relating to your changes are passing, ask the user if they would like to run the entire test suite to ensure everything is still passing.

### Pest Assertions
- When asserting status codes on a response, use the specific method like `assertForbidden` and `assertNotFound` instead of using `assertStatus(403)` or similar, e.g.:
<code-snippet name="Pest Example Asserting postJson Response" lang="php">
it('returns all', function () {
    $response = $this->postJson('/api/docs', []);

    $response->assertSuccessful();
});
</code-snippet>

### Mocking
- Mocking can be very helpful when appropriate.
- When mocking, you can use the `Pest\Laravel\mock` Pest function, but always import it via `use function Pest\Laravel\mock;` before using it. Alternatively, you can use `$this->mock()` if existing tests do.
- You can also create partial mocks using the same import or self method.

### Datasets
- Use datasets in Pest to simplify tests which have a lot of duplicated data. This is often the case when testing validation rules, so consider going with this solution when writing tests for validation rules.

<code-snippet name="Pest Dataset Example" lang="php">
it('has emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with([
    'james' => 'james@laravel.com',
    'taylor' => 'taylor@laravel.com',
]);
</code-snippet>


=== pest/v4 rules ===

## Pest 4

- Pest v4 is a huge upgrade to Pest and offers: browser testing, smoke testing, visual regression testing, test sharding, and faster type coverage.
- Browser testing is incredibly powerful and useful for this project.
- Browser tests should live in `tests/Browser/`.
- Use the `search-docs` tool for detailed guidance on utilizing these features.

### Browser Testing
- You can use Laravel features like `Event::fake()`, `assertAuthenticated()`, and model factories within Pest v4 browser tests, as well as `RefreshDatabase` (when needed) to ensure a clean state for each test.
- Interact with the page (click, type, scroll, select, submit, drag-and-drop, touch gestures, etc.) when appropriate to complete the test.
- If requested, test on multiple browsers (Chrome, Firefox, Safari).
- If requested, test on different devices and viewports (like iPhone 14 Pro, tablets, or custom breakpoints).
- Switch color schemes (light/dark mode) when appropriate.
- Take screenshots or pause tests for debugging when appropriate.

### Example Tests

<code-snippet name="Pest Browser Test Example" lang="php">
it('may reset the password', function () {
    Notification::fake();

    $this->actingAs(User::factory()->create());

    $page = visit('/sign-in'); // Visit on a real browser...

    $page->assertSee('Sign In')
        ->assertNoJavascriptErrors() // or ->assertNoConsoleLogs()
        ->click('Forgot Password?')
        ->fill('email', 'nuno@laravel.com')
        ->click('Send Reset Link')
        ->assertSee('We have emailed your password reset link!')

    Notification::assertSent(ResetPassword::class);
});
</code-snippet>

<code-snippet name="Pest Smoke Testing Example" lang="php">
$pages = visit(['/', '/about', '/contact']);

$pages->assertNoJavascriptErrors()->assertNoConsoleLogs();
</code-snippet>


=== inertia-react/core rules ===

## Inertia + React

- Use `router.visit()` or `<Link>` for navigation instead of traditional links.

<code-snippet name="Inertia Client Navigation" lang="react">

import { Link } from '@inertiajs/react'
<Link href="/">Home</Link>

</code-snippet>


=== inertia-react/v2/forms rules ===

## Inertia + React Forms

<code-snippet name="`<Form>` Component Example" lang="react">

import { Form } from '@inertiajs/react'

export default () => (
    <Form action="/users" method="post">
        {({
            errors,
            hasErrors,
            processing,
            wasSuccessful,
            recentlySuccessful,
            clearErrors,
            resetAndClearErrors,
            defaults
        }) => (
        <>
        <input type="text" name="name" />

        {errors.name && <div>{errors.name}</div>}

        <button type="submit" disabled={processing}>
            {processing ? 'Creating...' : 'Create User'}
        </button>

        {wasSuccessful && <div>User created successfully!</div>}
        </>
    )}
    </Form>
)

</code-snippet>


=== tailwindcss/core rules ===

## Tailwind Core

- Use Tailwind CSS classes to style HTML, check and use existing tailwind conventions within the project before writing your own.
- Offer to extract repeated patterns into components that match the project's conventions (i.e. Blade, JSX, Vue, etc..)
- Think through class placement, order, priority, and defaults - remove redundant classes, add classes to parent or child carefully to limit repetition, group elements logically
- You can use the `search-docs` tool to get exact examples from the official documentation when needed.

### Spacing
- When listing items, use gap utilities for spacing, don't use margins.

    <code-snippet name="Valid Flex Gap Spacing Example" lang="html">
        <div class="flex gap-8">
            <div>Superior</div>
            <div>Michigan</div>
            <div>Erie</div>
        </div>
    </code-snippet>


### Dark Mode
- If existing pages and components support dark mode, new pages and components must support dark mode in a similar way, typically using `dark:`.


=== tailwindcss/v4 rules ===

## Tailwind 4

- Always use Tailwind CSS v4 - do not use the deprecated utilities.
- `corePlugins` is not supported in Tailwind v4.
- In Tailwind v4, configuration is CSS-first using the `@theme` directive — no separate `tailwind.config.js` file is needed.
<code-snippet name="Extending Theme in CSS" lang="css">
@theme {
  --color-brand: oklch(0.72 0.11 178);
}
</code-snippet>

- In Tailwind v4, you import Tailwind using a regular CSS `@import` statement, not using the `@tailwind` directives used in v3:

<code-snippet name="Tailwind v4 Import Tailwind Diff" lang="diff">
   - @tailwind base;
   - @tailwind components;
   - @tailwind utilities;
   + @import "tailwindcss";
</code-snippet>


### Replaced Utilities
- Tailwind v4 removed deprecated utilities. Do not use the deprecated option - use the replacement.
- Opacity values are still numeric.

| Deprecated |	Replacement |
|------------+--------------|
| bg-opacity-* | bg-black/* |
| text-opacity-* | text-black/* |
| border-opacity-* | border-black/* |
| divide-opacity-* | divide-black/* |
| ring-opacity-* | ring-black/* |
| placeholder-opacity-* | placeholder-black/* |
| flex-shrink-* | shrink-* |
| flex-grow-* | grow-* |
| overflow-ellipsis | text-ellipsis |
| decoration-slice | box-decoration-slice |
| decoration-clone | box-decoration-clone |


=== tests rules ===

## Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test` with a specific filename or filter.


=== laravel/fortify rules ===

## Laravel Fortify

Fortify is a headless authentication backend that provides authentication routes and controllers for Laravel applications.

**Before implementing any authentication features, use the `search-docs` tool to get the latest docs for that specific feature.**

### Configuration & Setup
- Check `config/fortify.php` to see what's enabled. Use `search-docs` for detailed information on specific features.
- Enable features by adding them to the `'features' => []` array: `Features::registration()`, `Features::resetPasswords()`, etc.
- To see the all Fortify registered routes, use the `list-routes` tool with the `only_vendor: true` and `action: "Fortify"` parameters.
- Fortify includes view routes by default (login, register). Set `'views' => false` in the configuration file to disable them if you're handling views yourself.

### Customization
- Views can be customized in `FortifyServiceProvider`'s `boot()` method using `Fortify::loginView()`, `Fortify::registerView()`, etc.
- Customize authentication logic with `Fortify::authenticateUsing()` for custom user retrieval / validation.
- Actions in `app/Actions/Fortify/` handle business logic (user creation, password reset, etc.). They're fully customizable, so you can modify them to change feature behavior.

## Available Features
- `Features::registration()` for user registration.
- `Features::emailVerification()` to verify new user emails.
- `Features::twoFactorAuthentication()` for 2FA with QR codes and recovery codes.
  - Add options: `['confirmPassword' => true, 'confirm' => true]` to require password confirmation and OTP confirmation before enabling 2FA.
- `Features::updateProfileInformation()` to let users update their profile.
- `Features::updatePasswords()` to let users change their passwords.
- `Features::resetPasswords()` for password reset via email.
</laravel-boost-guidelines>
