# PanicBot / PanicBreathe 2.0 - Project Summary

## Overview
A mobile panic alert system designed for users (typically children/teens) to send emergency messages to their parent/guardian via Telegram. The app features a simple setup flow where users configure their parent's Telegram username, and the parent connects by starting a Telegram bot. Once connected, the user can send panic alerts with a single button press.

## Architecture
- **Frontend**: React Native app built with Expo (TypeScript)
- **Backend**: Python Flask REST API server
- **Telegram Bot**: Python polling bot that automatically captures user chat IDs
- **Communication Flow**: Mobile app → Flask API → Telegram Bot API → Parent's Telegram
- **Storage**: 
  - JSON file (`users.json`) for username-to-chat_id mappings (server-side)
  - AsyncStorage for parent username (client-side)

## Tech Stack

### Backend
- Python 3
- Flask (web framework for REST API)
- requests (HTTP library for Telegram API)
- JSON file storage

### Frontend
- React Native 0.81.5
- Expo SDK ~54.0
- TypeScript
- Expo Router (file-based routing)
- @react-native-async-storage/async-storage (local storage)
- expo-linking (deep linking to Telegram)

### Telegram Bot
- Python polling bot using Telegram Bot API
- Long polling (30s timeout)
- Automatic user registration on `/start` command

## Project Structure
```
PanicBot/
├── Backend/
│   ├── api_server.py          # Flask REST API server
│   ├── bot_server.py          # Telegram bot polling server (separate process)
│   ├── users.json             # User database (username -> chat_id)
│   ├── requirements.txt       # Python dependencies
│   └── send_msg.py            # Utility script
│
└── Frontend(React)/
    └── my-telegram-app/       # Expo React Native app
        ├── app/
        │   └── (tabs)/
        │       └── index.tsx  # Main screen (setup + alert)
        ├── config.ts           # Configuration (API URL, bot username, message)
        ├── package.json
        └── ... (Expo boilerplate files)
```

## Key Features

### Backend API Endpoints (`api_server.py`)
1. **POST /send-message**
   - Accepts: `{"target_username": "string", "message": "string"}`
   - Looks up chat_id from users.json
   - Sends message via Telegram Bot API
   - Returns success/error response

2. **POST /send** (alternative endpoint)
   - Same functionality, accepts `{"username": "...", "message": "..."}`

3. **GET /users**
   - Returns list of all usernames from users.json
   - Used by frontend to check if parent has connected

4. **GET /health**
   - Health check endpoint

### Telegram Bot (`bot_server.py`)
- **Long Polling**: Continuously polls Telegram for updates (30s timeout)
- **Auto-Registration**: When a user sends `/start`, automatically saves their username and chat_id to users.json
- **Commands Supported**:
  - `/start` - Welcome message + auto-save user info
  - `/hello` - Greeting response
  - `/info` - Returns user's chat ID

### Frontend Features (`app/(tabs)/index.tsx`)
1. **Setup Screen** (shown when no parent configured):
   - Text input for parent's Telegram username
   - "Save & Connect" button
   - Automatically opens Telegram with pre-filled message containing bot link
   - Saves parent username to AsyncStorage

2. **Main Alert Screen** (shown after parent is configured):
   - Large red circular "SEND HELP" button (200x200px)
   - Connection status indicator:
     - Green "✓ Parent Connected" if parent has pressed Start
     - Orange warning if parent hasn't connected yet
   - "Resend Invite Link" button (if not connected)
   - "Change Contact" link to reset and reconfigure
   - Polls server every 3 seconds to check connection status

3. **Connection Status Polling**:
   - Fetches `/users` endpoint every 3 seconds
   - Checks if parent username exists in the list
   - Updates UI to show connection status
   - Disables alert button if parent not connected

## Configuration

### Backend (`api_server.py`)
- **BOT_TOKEN**: `8290036063:AAE7tQtBQrxOnu9HczvE8CN053p8sKyj9Ak` (Telegram bot token - hardcoded)
- **USERS_FILE**: `users.json` (relative path)
- **Server**: Runs on `0.0.0.0:5000` (accessible from local network)

### Frontend (`config.ts`)
- **API_BASE_URL**: `http://10.162.173.85:5000` (local IP address - must match computer's IP)
- **BOT_USERNAME**: `PanicBreatheBot` (Telegram bot username for deep linking)
- **DEFAULT_MESSAGE**: `"Hello! I need help!"` (message sent when alert button pressed)

### User Database (`users.json`)
```json
{
    "moonthlystarlary": 1175209427,
    "sadhxna": 5160659720
}
```
Format: `"username": chat_id` (automatically populated by bot_server.py when users press `/start`)

## User Flow

### Initial Setup
1. User opens app → sees setup screen
2. User enters parent's Telegram username (e.g., "mom_telegram_123")
3. User taps "Save & Connect"
4. App saves username to AsyncStorage
5. App opens Telegram with pre-filled message containing bot link: `https://t.me/PanicBreatheBot?start=start`
6. User sends message to parent via Telegram
7. Parent clicks bot link and presses "Start" button
8. Bot automatically saves parent's username and chat_id to users.json
9. App polls server and detects parent is now in the users list
10. Connection status changes to "✓ Parent Connected"

### Sending Alert
1. User sees main alert screen with large red "SEND HELP" button
2. User taps button
3. App sends POST to `/send-message` with parent username and default message
4. Flask server looks up parent's chat_id
5. Flask server sends message via Telegram Bot API
6. Parent receives message on Telegram: "Hello! I need help!"
7. App shows success alert

## How It Works (Technical)

1. **Mobile App** → User taps "SEND HELP" button
2. **Mobile App** → Sends POST request to Flask server at `http://[LOCAL_IP]:5000/send-message`
3. **Flask Server** → Reads users.json to find chat_id for parent username
4. **Flask Server** → Sends HTTP POST to Telegram Bot API with chat_id and message
5. **Telegram** → Delivers message to parent's Telegram account

## Current State

### ✅ Completed Features
- Flask API server with all endpoints
- Telegram bot with auto-registration on `/start`
- React Native app with setup flow
- Parent connection status polling
- AsyncStorage for persistent parent username
- Deep linking to Telegram for easy parent setup
- Large, prominent panic button UI
- Connection status indicators
- Error handling and loading states
- Local network connectivity (works on physical devices)
- Git repository on GitHub

### 🔧 Technical Details
- **Network**: Uses local IP address (not localhost) so physical devices can connect
- **Authentication**: None (local network only, assumes trusted environment)
- **Data Storage**: 
  - Server: Simple JSON file (users.json)
  - Client: AsyncStorage (parent username only)
- **Polling**: Frontend polls `/users` endpoint every 3 seconds to check connection
- **Bot Registration**: Automatic - no manual database entry needed

## Dependencies

### Backend
```
Flask==3.0.0
requests==2.31.0
```

### Frontend
- Standard Expo dependencies
- `@react-native-async-storage/async-storage@2.2.0` (local storage)
- React Native core components
- expo-linking (for Telegram deep links)

## Running the App

### Backend (Flask API)
```bash
cd Backend
python api_server.py
```
Server runs on http://0.0.0.0:5000

### Telegram Bot (Separate Process)
```bash
cd Backend
python bot_server.py
```
Bot continuously polls Telegram for updates and auto-saves users.

### Frontend
```bash
cd Frontend(React)/my-telegram-app
npm start
```
Then scan QR code with Expo Go app or press 'a' for Android emulator

**Note**: Both `api_server.py` and `bot_server.py` need to be running simultaneously.

## Important Notes
- **Bot Token**: Hardcoded in both `api_server.py` and `bot_server.py` (should be moved to environment variable)
- **users.json**: Contains sensitive chat IDs (currently committed to git - consider .gitignore)
- **IP Address**: Must be updated in `config.ts` if computer's local IP changes
- **Network**: Both devices (phone and computer) must be on same Wi-Fi network
- **Two Servers**: Both Flask API and Telegram bot need to run (they're separate processes)
- **Parent Setup**: Parent must press "Start" on the Telegram bot for connection to work
- **Polling**: Frontend continuously checks connection status (every 3 seconds)

## Repository
GitHub: https://github.com/fattiesbombom/PanicBreathe2.0.git

## Next Steps / Potential Enhancements
- Environment variables for bot token and sensitive data
- Database instead of JSON file (SQLite, PostgreSQL, etc.)
- Message history/logging
- Custom message input (instead of hardcoded default)
- Multiple emergency contacts (not just one parent)
- Emergency contact groups
- Location sharing with alerts
- Push notifications
- Offline mode handling
- Better error messages
- Rate limiting on alert button
- Confirmation dialog before sending alert
- Message templates
- Admin dashboard to view sent alerts
