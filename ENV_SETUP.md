# Environment Variables Setup Guide

This project uses environment variables to store sensitive information like API keys and tokens. Follow these steps to set up your `.env` files.

## Backend Setup

### 1. Backend Directory (`Backend/.env`)

Copy the example file and fill in your values:
```bash
cd Backend
copy .env.example .env
```

Edit `.env` and add your values:
```
TELEGRAM_BOT_TOKEN=your_actual_telegram_bot_token_here
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
```

**Note:** Chat IDs are stored in `users.json` (automatically managed by `bot_server.py`), not in environment variables.

### 2. Supabase Server (`Backend/supabase-server/.env`)

Copy the example file:
```bash
cd supabase-server
copy .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
PORT=3000
FRONTEND_URL=http://localhost:8081
```

## Frontend Setup

### 3. Frontend Directory (`Frontend/Frontend/.env`)

Copy the example file:
```bash
cd Frontend/Frontend
copy .env.example .env
```

Edit `.env` and add your values:
```
EXPO_PUBLIC_API_BASE_URL=http://your_local_ip:5000
EXPO_PUBLIC_SUPABASE_API_URL=http://your_local_ip:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_BOT_USERNAME=PanicBreatheBot
```

**Important Notes:**
- Replace `your_local_ip` with your computer's local IP address (find it with `ipconfig` on Windows or `ifconfig` on Mac/Linux)
- For Expo, all environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the client code
- **Note:** The frontend does NOT need `SUPABASE_ANON_KEY` - it only communicates with the backend API, which handles all Supabase connections
- After creating/updating `.env` files, restart your servers for changes to take effect

## Installing Dependencies

Make sure you have `python-dotenv` installed for Python files:
```bash
cd Backend
pip install -r requirements.txt
```

## Security

- **Never commit `.env` files to git** - they are already in `.gitignore`
- Only commit `.env.example` files as templates
- Keep your tokens and keys secure and private
