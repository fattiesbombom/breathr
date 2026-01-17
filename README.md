# PanicBreatheBot

A full-stack Telegram breathing/panic app with Supabase backend, Flask API, and Expo frontend. Features user profiles, friendships, death counters (game-like resets), custom icons, and Telegram bot integration for messaging.
Run locally with one command for development.

## Features
- Telegram bot auto-registers users and saves chat IDs. 
- Flask API sends messages via Telegram and manages users.json.
- Supabase PostgreSQL schema with profiles (age, guardian, deathcount, usericon), friendships table, RLS policies. 
- start_servers.py launches Flask (port 5000), bot poller, Supabase (port 3000). 
- SQL migrations for profile icons and death counts.

## Quick Start
1. Clone repo and `cd Backend`.
2. Copy `.env.example` to `.env`, add `TELEGRAM_BOT_TOKEN`. 
3. For Supabase: `cd supabase-server`, copy `.env.example` to `.env`, add credentials; `npm install`. 
5. Run `python start_servers.py`.

Flask at http://0.0.0.0:5000, Supabase Studio at http://localhost:3000.

## Project Structure
| Directory/File | Purpose |
|---------------|---------|
| Backend/bot_server.py | Telegram long-polling bot, users.json mgmt. 
| Backend/api_server.py | Flask endpoints (/send, /users). 
| Backend/supabase-server | Local Supabase instance. 
| Backend/supabase-schema.sql | Profiles, friendships tables. 
| Frontend | Expo React Native app (env vars prefixed EXPO_PUBLIC_). 
| start_servers.py | Launches all services.

## Environment Setup
Follow ENV_SETUP.md for .env files across Backend, supabase-server, Frontend. Never commit .env—use .gitignore.

## API Endpoints
- `POST /send`: Send Telegram msg by username (from users.json). 
- `POST /send-message`: Alt with target_username. 
- `GET /users`: List usernames. 
- `GET /health`: Status check.
- 
## Database Schema
Uses Supabase auth.users + public.profiles (username UNIQUE, deathcount, usericon). Friendships table with pending/accepted status, indexes, RLS for own profile access.

## Scripts
- `test_bot.py`: Bot tests. 
- `send_msg.py`: Msg utils.

## Notes
- users.json persists chat IDs locally (auto-saved). 
- "Death count" tracks resets/failures in breathing exercises. 
- Custom user icons via SQL add_user_icon_to_profiles.sql. 
- Frontend connects to local IP for mobile testing. 
