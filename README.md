# Wedding Seat Finder

A self-hosted floor plan application for wedding/event seat management. Guests can search for their name to find their assigned table, and admins can manage the floor plan layout and guest assignments.

## Features

- **Guest View**: Search by name to find your assigned table (highlighted on floor plan)
- **Interactive Floor Plan**: Pinch-to-zoom, pan, and tap tables to view guest lists
- **Mobile Optimized**: Responsive design with touch gestures for mobile devices
- **Admin Panel**: Password-protected dashboard
  - Drag-and-drop floor plan editor
  - Table management (add, edit, delete, reposition)
  - Fixture/walkway editing with resize handles
  - Multi-table selection (Ctrl+click, Select Row/Column)
  - Guest management (add, edit, delete, assign to tables)
- **Docker-ready**: Compose files for easy deployment

## Quick Start (Docker)

### Development

```bash
# Start database and app
docker-compose -f docker-compose.dev.yml up -d

# The app will be available at http://localhost:3000
# Admin password: admin123
```

### Production

1. **Clone and configure**

```bash
# Clone the repository
git clone <repository-url>
cd zi-floor-plan

# Create .env file from example
cp .env.example .env
```

2. **Generate secure secrets**

```bash
# Generate a secure JWT_SECRET (64 characters)
openssl rand -base64 48

# Generate a secure POSTGRES_PASSWORD
openssl rand -base64 24

# Generate a secure ADMIN_PASSWORD
openssl rand -base64 16
```

3. **Edit `.env` with your production values**

```bash
# Required - Use the generated secrets above!
POSTGRES_PASSWORD=<paste_generated_postgres_password>
ADMIN_PASSWORD=<paste_generated_admin_password>
JWT_SECRET=<paste_generated_jwt_secret>

# Optional
APP_PORT=3000
POSTGRES_USER=floorplan
POSTGRES_DB=floorplan
```

4. **Build and start services**

```bash
# Build and start in detached mode
docker-compose up -d --build

# Check logs
docker-compose logs -f app

# The app will be available at http://localhost:3000 (or your APP_PORT)
```

5. **Initialize the database (first run only)**

```bash
# Run database migrations
docker-compose run --rm --entrypoint sh migrate -c \
  'echo "DATABASE_URL=postgresql://${POSTGRES_USER:-floorplan}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-floorplan}" > .env && \
  ./node_modules/.bin/prisma migrate deploy'

# Seed with sample data (optional - creates 49 tables with sample layout)
docker-compose run --rm --entrypoint sh migrate -c \
  'echo "DATABASE_URL=postgresql://${POSTGRES_USER:-floorplan}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-floorplan}" > .env && \
  npm run db:seed'
```

### Production with Reverse Proxy (Recommended)

For production, it's recommended to use a reverse proxy like Nginx or Traefik for SSL/TLS.

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Updating Production

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Run any new migrations
docker-compose run --rm --entrypoint sh migrate -c \
  'echo "DATABASE_URL=postgresql://${POSTGRES_USER:-floorplan}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-floorplan}" > .env && \
  ./node_modules/.bin/prisma migrate deploy'
```

### Backup Database

```bash
# Create backup
docker-compose exec db pg_dump -U floorplan floorplan > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T db psql -U floorplan floorplan < backup.sql
```

## Local Development (without Docker)

### Prerequisites

- Node.js 22+
- PostgreSQL 16+

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database connection string

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run db:seed

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `ADMIN_PASSWORD` | Password for admin login | Yes | - |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | Yes | - |
| `APP_PORT` | Port to run the app | No | 3000 |
| `POSTGRES_USER` | PostgreSQL username | No | floorplan |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes (Docker) | - |
| `POSTGRES_DB` | PostgreSQL database name | No | floorplan |

## Project Structure

```
├── docker/               # Dockerfiles
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin pages
│   │   └── page.tsx      # Guest search page
│   ├── components/       # React components
│   ├── lib/              # Utilities (prisma, auth)
│   └── types/            # TypeScript types
├── docker-compose.yml    # Production compose
└── docker-compose.dev.yml # Development compose
```

## Admin Access

Access the admin panel at `/admin/login`

Default admin password for development: `admin123`

For production, set a strong password via the `ADMIN_PASSWORD` environment variable.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM 7
- **Authentication**: JWT with jose
- **Fonts**: Cormorant Garamond (display), Outfit (body)

## License

MIT
