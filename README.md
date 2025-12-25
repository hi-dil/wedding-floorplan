# Wedding Seat Finder

A self-hosted floor plan application for wedding/event seat management. Guests can search for their name to find their assigned table, and admins can manage the floor plan layout and guest assignments.

## Features

- **Guest View**: Search by name to find your assigned table (highlighted on floor plan)
- **Admin Panel**: Password-protected dashboard
  - Drag-and-drop floor plan editor
  - Table management (add, edit, delete, reposition)
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

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with your production values
# - POSTGRES_PASSWORD (required)
# - ADMIN_PASSWORD (required)
# - JWT_SECRET (required, at least 32 characters)

# Start services
docker-compose up -d
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

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `ADMIN_PASSWORD` | Password for admin login | Yes |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | Yes |
| `APP_PORT` | Port to run the app (default: 3000) | No |

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

## Default Floor Plan

The seed script creates a pre-configured floor plan based on the original venue layout:
- 48 round tables (10 seats each)
- Pelamin (stage) area
- Caterer area
- Main entrance
- Walkway

## Admin Access

Default admin password for development: `admin123`

For production, set a strong password via the `ADMIN_PASSWORD` environment variable.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Drag-and-drop**: @dnd-kit
- **Authentication**: JWT with jose

## License

MIT
