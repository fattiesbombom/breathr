# Supabase Backend Server

Node.js Express server with Supabase authentication and user onboarding flow.

## Setup

### 1. Install Dependencies

```bash
cd Backend/supabase-server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Update `.env` with your Supabase project details:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (bypasses RLS)
- `SUPABASE_ANON_KEY`: Anon/public key

### 3. Run Database Schema

Execute the SQL in `supabase-schema.sql` in your Supabase SQL Editor to create the tables and triggers.

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

- `POST /auth/login` - Login with email/password
- `POST /auth/signup` - Register new user
- `POST /auth/logout` - Logout user
- `GET /auth/status` - Check auth and onboarding status

### Onboarding

- `POST /onboarding/set-guardian` - Set guardian username (accessible before onboarding complete)

### User Search

- `GET /users/search?query=<search_term>` - Search users by email or username (requires onboarding)

### Protected Endpoints

- `GET /api/profile` - Get user profile (requires onboarding)

## Authentication Flow

1. User signs up/logs in → receives JWT token
2. Client checks `/auth/status` → if `onboardingComplete: false`, show onboarding screen
3. User sets guardian username via `/onboarding/set-guardian`
4. Once guardian is set, user can access all protected endpoints

## Request Format

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

## Example Usage

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Set Guardian (Onboarding)
```bash
curl -X POST http://localhost:3000/onboarding/set-guardian \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"guardian_username": "guardian_user"}'
```

### Search Users
```bash
curl -X GET "http://localhost:3000/users/search?query=john" \
  -H "Authorization: Bearer <token>"
```
