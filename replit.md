# CareerMatch - Career Matching Platform

## Overview

CareerMatch is a career guidance platform that helps users find suitable professions based on their personality type (RIASEC/Holland methodology), skills, interests, and salary preferences. Built with Scala 3 backend and React TypeScript frontend.

## Project Architecture

### Backend (Scala)
- **Framework**: Akka HTTP with Scala 3.3.1
- **Database**: PostgreSQL with HikariCP connection pool
- **JSON**: spray-json for serialization
- **Location**: `/backend`
- **Port**: 8080

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts for RIASEC visualization
- **Location**: `/frontend`
- **Port**: 5000

## Project Structure

```
/
├── backend/
│   ├── src/main/scala/careermatch/
│   │   ├── Main.scala           # Entry point with Akka HTTP server
│   │   ├── models/Models.scala  # Data models with spray-json formats
│   │   ├── routes/Routes.scala  # HTTP endpoints with CORS
│   │   ├── services/            # Business logic
│   │   │   ├── RiasecService.scala    # RIASEC calculation
│   │   │   └── ProfessionService.scala # Profession matching
│   │   └── db/Database.scala    # PostgreSQL connection and queries
│   ├── build.sbt
│   └── project/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx          # Landing page
│   │   │   ├── QuestionnairePage.tsx # Multi-step form
│   │   │   └── ResultsPage.tsx       # Results with charts
│   │   ├── services/api.ts    # API client
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf            # For Docker deployment
│   └── Dockerfile.frontend
├── Dockerfile                # Combined backend+frontend build
├── docker-compose.yml        # Full stack with PostgreSQL
└── replit.md
```

## API Endpoints

### Core Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/questions` | GET | Get RIASEC test questions (18 questions) |
| `/api/professions` | GET | Get all professions (with optional filters) |
| `/api/professions/:id` | GET | Get profession by ID |
| `/api/match` | POST | Submit questionnaire, get matched professions |
| `/api/compare?ids=1,2,3` | GET | Compare professions side-by-side |

### Authentication Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register with email/password |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/google` | POST | Login/register with Google OAuth |
| `/api/auth/verify-email` | POST | Verify email with token |
| `/api/auth/resend-verification` | POST | Resend verification email |
| `/api/auth/me` | GET | Get current user (requires Bearer token) |
| `/api/auth/toggle-view-mode` | POST | Toggle admin/guest view mode |

### Admin Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/courses` | GET | Get all partner courses |
| `/api/courses` | POST | Create partner course (admin only) |
| `/api/courses/:id` | DELETE | Delete partner course (admin only) |
| `/api/courses/profession/:id` | GET | Get courses for profession |
| `/api/news` | GET | Get all news |
| `/api/news` | POST | Create news item (admin only) |
| `/api/news/:id` | DELETE | Delete news item (admin only) |
| `/api/tests` | GET | Get active tests |
| `/api/tests/admin` | GET | Get all tests (admin only) |
| `/api/tests/:id` | GET | Get test with questions |
| `/api/tests` | POST | Create test (admin only) |
| `/api/tests/:id` | DELETE | Delete test (admin only) |
| `/api/tests/:id/toggle` | POST | Toggle test active status (admin only) |

## RIASEC Personality Types

- **R (Realistic)**: Practical, hands-on work
- **I (Investigative)**: Research, analysis, problem-solving
- **A (Artistic)**: Creative, expressive work
- **S (Social)**: Helping, teaching, counseling
- **E (Enterprising)**: Leadership, sales, business
- **C (Conventional)**: Organization, data, structure

## Running the Application

### Development (Replit)
1. Backend workflow starts on port 8080 (`sbt run`)
2. Frontend workflow starts on port 5000 (`npm run dev`)
3. API calls are proxied from frontend to backend via Vite config

### Docker Deployment
```bash
# Full stack with database
docker-compose up --build

# Access at http://localhost:5000
```

## Key Features

1. **RIASEC Personality Test**: 18 questions evaluating 6 personality dimensions
2. **Profession Matching**: Cosine similarity algorithm matching user profile with 20 professions
3. **Interactive Dashboard**: Radar charts showing RIASEC profile
4. **Profession Comparison**: Compare up to 3 professions side-by-side
5. **Filtering & Sorting**: Filter by salary, work type, education level
6. **Responsive Design**: Mobile-friendly with Tailwind CSS
7. **Admin Panel**: First registered user becomes admin automatically
   - Partner course management (link courses to professions)
   - News feed management (displayed on homepage)
   - Custom test creation with multiple choice questions
   - Admin/Guest view toggle for testing user experience

## Database Schema

### professions table
- `id`: Serial primary key
- `name`: Profession name (VARCHAR)
- `description`: Description (TEXT)
- `skills`: Required skills (TEXT[])
- `riasec_profile`: RIASEC scores (JSONB)
- `avg_salary`: Average salary in rubles (INTEGER)
- `demand_score`: Job market demand 0-100 (INTEGER)
- `work_type`: удалённая/офис/гибкий график (VARCHAR)
- `education_required`: Required education level (VARCHAR)

### user_profiles table (for future use)
- Session-based storage for user questionnaire data

### users table
- `id`: Serial primary key
- `email`: User email (VARCHAR, UNIQUE)
- `password_hash`: BCrypt hashed password (VARCHAR)
- `name`: User display name (VARCHAR)
- `email_verified`: Email verification status (BOOLEAN)
- `google_id`: Google OAuth ID (VARCHAR, UNIQUE)
- `verification_token`: Email verification token (VARCHAR)
- `verification_expires`: Token expiration timestamp (TIMESTAMP)
- `role`: User role - 'admin' or 'guest' (VARCHAR, default: 'guest')
- `is_viewing_as_guest`: Admin view toggle (BOOLEAN, default: false)
- `created_at`: Account creation timestamp (TIMESTAMP)

### partner_courses table
- `id`: Serial primary key
- `profession_id`: Foreign key to professions
- `title`: Course title (VARCHAR)
- `description`: Course description (TEXT)
- `url`: External course link (VARCHAR)
- `provider`: Course provider name (VARCHAR)
- `created_at`: Creation timestamp (TIMESTAMP)

### news table
- `id`: Serial primary key
- `title`: News title (VARCHAR)
- `content`: News content (TEXT)
- `author_id`: Foreign key to users
- `created_at`: Creation timestamp (TIMESTAMP)

### custom_tests table
- `id`: Serial primary key
- `title`: Test title (VARCHAR)
- `description`: Test description (TEXT)
- `author_id`: Foreign key to users
- `is_active`: Whether test is visible to users (BOOLEAN)
- `created_at`: Creation timestamp (TIMESTAMP)

### custom_test_questions table
- `id`: Serial primary key
- `test_id`: Foreign key to custom_tests
- `text`: Question text (TEXT)
- `options`: Answer options (TEXT[])
- `correct_option_index`: Index of correct answer (INTEGER)
- `order_num`: Question order (INTEGER)

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string

### Backend Configuration
- `PORT`: Backend server port (default: 8080)
- `HOST`: Backend server host (default: 0.0.0.0)
- `JWT_SECRET`: Secret key for JWT token signing

### Authentication
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID (for Google login)
- `SMTP_HOST`: SMTP server host (for email verification)
- `SMTP_PORT`: SMTP server port (default: 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `SMTP_FROM`: Sender email address
- `APP_URL`: Application URL for email links

### Frontend
- `VITE_API_URL`: API base URL for frontend (default: /api)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID (frontend)

## Replit Setup

- **Workflows**: Two workflows configured - Backend (sbt run on port 8080) and Frontend (npm run dev on port 5000)
- **Database**: Replit PostgreSQL with auto-initialization and seeding on backend startup
- **Environment Variables**: DATABASE_URL and JWT_SECRET are configured
- **Deployment**: Autoscale deployment configured with SBT assembly JAR and serve for static files

## Recent Changes

- 2025-12-11: Admin panel and content management
  - Role system with first user becoming admin automatically
  - Admin/guest view mode toggle for testing
  - Partner courses management linked to professions
  - News feed management displayed on homepage
  - Custom test creation with multiple choice questions
  - New pages: AdminPage, TestsPage
  - Updated database schema with new tables

- 2025-12-11: Replit environment setup
  - Installed Java GraalVM and SBT for Scala backend
  - Installed Node.js 20 for React frontend
  - Configured PostgreSQL database with auto-initialization
  - Set up JWT_SECRET for authentication
  - Configured Vite with allowedHosts for Replit proxy

- 2024-12-11: Authentication system
  - Email/password registration with email verification
  - JWT-based authentication with 7-day token expiry
  - Google OAuth login integration
  - User database with BCrypt password hashing
  - Login/Register pages with modern UI
  - Auth context for frontend state management

- 2024-12-10: Initial MVP implementation
  - Scala 3 backend with Akka HTTP and spray-json
  - React TypeScript frontend with Tailwind CSS and Recharts
  - PostgreSQL database with 20 seeded professions
  - RIASEC matching algorithm with cosine similarity
  - Docker containerization with nginx for frontend
  - Multi-step questionnaire with validation
  - Results page with filtering, sorting, and comparison
