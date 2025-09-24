# LY Inspire - Design Inspiration Platform

## Overview
LY Inspire is a comprehensive design inspiration platform that automatically curates top design content from multiple sources (Behance, Dribbble, Medium Design, Core77, Awwwards) and presents it in a clean, minimal interface.

## Recent Changes (September 24, 2025)
- Successfully imported GitHub repository to Replit environment
- Configured PostgreSQL database with Prisma ORM
- Set up environment variables and JWT authentication
- Generated and migrated database schema
- Seeded database with initial data (admin user and sample inspirations)
- Configured Next.js for Replit proxy environment with cache control headers
- Set up development workflow on port 5000 with proper host configuration
- Configured deployment settings for autoscale deployment

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 13.5.1 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Scrapers**: Python with Requests, BeautifulSoup, Playwright
- **UI Components**: Radix UI components with custom styling

### Database Schema
- **Users**: Admin and regular users with role-based access
- **Inspirations**: Design content from various platforms with scoring
- **Submissions**: User-submitted content with moderation workflow
- **DailyCuration**: Daily award picks and top 10 lists

### Key Features
- Daily curation of design content
- Admin panel for content management
- User submission system
- Archive with advanced filtering
- Responsive design with dark/light mode
- Real-time search and filtering

## Current Configuration

### Environment Variables
- DATABASE_URL: Configured for Replit PostgreSQL
- JWT_SECRET: Set for authentication
- ADMIN_EMAIL/PASSWORD: Default admin credentials
- NEXT_PUBLIC_APP_URL: Configured for Replit domain

### Development Workflow
- Server runs on port 5000 with 0.0.0.0 host binding
- Configured for Replit proxy environment
- Cache control headers added for proper refresh behavior

### Deployment
- Configured for autoscale deployment
- Build command: npm run build
- Run command: npm start

## User Preferences
- Follows existing project conventions and structure
- Uses Prisma for database operations (not Drizzle)
- Maintains original JWT-based authentication system
- Preserves existing UI component architecture

## Automated Scheduling System

### Production-Ready Daily Scraping
- **GitHub Actions Workflow**: Automatically runs daily at 03:00 IST (9:30 PM UTC)
- **Robust Error Handling**: Individual platform failures don't stop the entire process
- **Retry Logic**: 3 retry attempts with 5-minute delays for failed operations
- **Health Monitoring**: Database connectivity and platform availability checks
- **Fallback Mechanism**: Backup job runs curation-only if main job fails

### Platform Coverage
- **Always Available**: Medium, Core77, Awwwards (no API keys required)
- **Optional with API Keys**: Behance, Dribbble (gracefully skipped if keys missing)

### Local Development Scripts
- `npm run scraper:install` - Install Python dependencies and Playwright
- `npm run scraper:run` - Run all available scrapers
- `npm run scraper:test` - Test with Medium scraper only
- `npm run scraper:curate` - Run curation algorithm only
- `npm run scraper:config` - Check configuration status
- `npm run scraper:scheduler` - Start local scheduler daemon

### Configuration
- Environment variables managed in `scrapers/.env.example`
- Production configuration via GitHub Secrets
- Comprehensive logging with rotation and monitoring
- Health checks and performance tracking

## Status
✅ Successfully imported and configured for Replit environment
✅ Database setup and migrations completed
✅ Development server running on port 5000
✅ Deployment configuration ready
✅ **Automated daily scheduling system implemented and tested**