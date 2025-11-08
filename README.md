# Travel Map Application

A Laravel application with React/Inertia.js frontend for managing travel maps.

## Some infos and Links
* icons https://fontawesome.com/search?o=r&ic=free&s=regular&ip=classic
* marker icons: https://github.com/lennardv2/Leaflet.awesome-markers
* map library: https://leafletjs.com/

## Requirements

- PHP 8.1 or higher
- Composer
- Node.js 18 or higher
- npm or yarn
- MySQL or PostgreSQL database

## Installation & Setup

### 1. Install PHP Dependencies

```bash
composer install
```

### 2. Install JavaScript Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` and set your database credentials:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Run Database Migrations

```bash
php artisan migrate
```

### 6. Build Frontend Assets

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
```

## Running the Application

### Development Mode

1. **Start the Laravel development server** (in one terminal):
   ```bash
   php artisan serve
   ```

2. **Start the Vite development server** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Open your browser** and visit:
   ```
   http://localhost:8000
   ```

### Production Mode

1. Build the frontend assets:
   ```bash
   npm run build
   ```

2. Configure your web server (Apache/Nginx) to point to the `public` directory

3. Ensure proper file permissions:
   ```bash
   chmod -R 775 storage bootstrap/cache
   ```

## Testing

Run the test suite:

```bash
php artisan test
```

Or using Pest directly:

```bash
./vendor/bin/pest
```

## Additional Commands

### Clear Application Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Create Database Seeder Data
```bash
php artisan db:seed
```

## Troubleshooting

- **Port 8000 already in use**: Specify a different port with `php artisan serve --port=8001`
- **Database connection errors**: Verify your `.env` database credentials
- **Permission errors**: Ensure `storage` and `bootstrap/cache` directories are writable
- **Frontend not loading**: Make sure `npm run dev` is running alongside `php artisan serve`
