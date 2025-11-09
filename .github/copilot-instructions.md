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
