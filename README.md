# LY Inspire - Design Inspiration Platform

A comprehensive, production-ready design inspiration platform that automatically curates top design content from multiple sources (Behance, Dribbble, Medium Design, Core77, Awwwards) and presents it in a clean, minimal interface.

## 🚀 Features

- **Daily Curation**: Automatically scrapes and curates content daily at 03:00 IST
- **Content Display**: Shows "Today's Award Pick" and "Top 10 Inspirations" on homepage
- **Archive System**: Searchable archive with filters (source, tags, date)
- **Admin Override**: Protected admin panel for manual curation control
- **Community Submissions**: User submission form with moderation queue
- **Responsive Design**: Works perfectly on mobile and desktop
- **Dark/Light Mode**: Theme switching with system preference detection

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Scrapers**: Python with Requests, BeautifulSoup, Playwright
- **Deployment**: Vercel (frontend), Railway/Supabase (database)
- **CI/CD**: GitHub Actions with automated testing and deployment

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Docker (optional, for local development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ly-inspire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

4. **Setup database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

### Docker Development

```bash
docker-compose up
```

This starts the full stack including PostgreSQL database and the web application.

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── archive/           # Archive page
│   ├── inspiration/       # Individual inspiration pages
│   └── submit/           # Submission form
├── components/            # React components
├── lib/                  # Utility functions
├── prisma/               # Database schema and migrations
├── scrapers/             # Python scraping scripts
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## 🎨 Key Components

### Homepage
- Hero section with platform introduction
- Today's Award Pick featured prominently
- Top 10 Inspirations grid with rankings

### Archive System
- Advanced filtering by platform, tags, and date
- Search functionality across titles and descriptions
- Infinite scroll pagination
- Responsive grid layout

### Admin Panel
- Dashboard with key metrics
- Submission review and approval workflow
- Manual Award Pick override
- Content management tools

### Scraping System
- Multi-platform scraping (Behance, Dribbble, etc.)
- Intelligent scoring algorithm
- Deduplication and quality filtering
- Automated daily scheduling

## 🔒 Authentication

The platform uses JWT-based authentication with:
- Secure password hashing with bcrypt
- Role-based access control (admin/user)
- Protected API routes
- Session management

Default admin credentials (change in production):
- Email: `admin@lyinspire.com`
- Password: `admin123`

## 📊 Scoring Algorithm

Content is scored using a weighted formula:
- **Engagement metrics (45%)**: Likes, views, comments
- **Image quality (15%)**: Thumbnail presence and quality
- **Recency (10%)**: How recently published
- **Tag relevance (10%)**: Design-related tag matching
- **Editorial override (20%)**: Manual admin adjustments

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Set environment variables** in Vercel dashboard
3. **Configure build settings** (already configured in `vercel.json`)

### Database Setup

Use Railway, Supabase, or any PostgreSQL provider:

1. Create database instance
2. Run migrations: `npx prisma migrate deploy`
3. Seed data: `npm run db:seed`

## 🤖 CI/CD Pipeline

The project includes comprehensive GitHub Actions workflows:

- **CI Pipeline**: Linting, type checking, testing, building
- **Deployment**: Automatic deployment on main branch
- **Daily Scraper**: Scheduled scraping at 3:00 AM IST

Required GitHub Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`
- `BEHANCE_API_KEY`
- `DRIBBBLE_ACCESS_TOKEN`

## 📝 API Documentation

### Public Endpoints

- `GET /api/today` - Get today's award pick and top 10
- `GET /api/inspirations` - Get paginated inspirations with filters
- `GET /api/inspirations/:id` - Get single inspiration details
- `POST /api/submissions` - Submit new inspiration

### Admin Endpoints (Requires authentication)

- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/submissions` - Get pending submissions
- `PATCH /api/admin/submissions/:id` - Review submission
- `POST /api/admin/award` - Set award pick
- `POST /api/admin/ingest` - Trigger manual scraping

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ly_inspire"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Admin User
ADMIN_EMAIL="admin@lyinspire.com"
ADMIN_PASSWORD="admin123"

# API Keys
BEHANCE_API_KEY="your-behance-api-key"
DRIBBBLE_ACCESS_TOKEN="your-dribbble-access-token"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Scraper Configuration

The scrapers run daily at 3:00 AM IST and can be configured in `scrapers/scheduler.py`. Each platform scraper can be enabled/disabled and has configurable limits.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

Built with ❤️ using Next.js, Prisma, and modern web technologies.