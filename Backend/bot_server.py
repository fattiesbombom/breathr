import requests
import time
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- CONFIGURATION ---
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
if not TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required. Please create a .env file in the Backend directory.")

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, 'users.json')  # Always use absolute path

def load_database():
    """Loads the saved users from the JSON file."""
    try:
        if os.path.exists(DB_FILE):
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        else:
            print(f"⚠️ users.json not found at {DB_FILE}, creating new file...")
            # Create empty file
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump({}, f, indent=4)
            return {}
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing users.json: {e}")
        print("Creating new file...")
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump({}, f, indent=4)
        return {}
    except Exception as e:
        print(f"❌ Error loading database: {e}")
        return {}

def save_database(db):
    """Saves the users to the JSON file."""
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=4, ensure_ascii=False)
        print(f"✅ Database saved to {DB_FILE}")
    except Exception as e:
        print(f"❌ Error saving database: {e}")

def send_message(chat_id, text):
    """Sends a message to a specific Telegram chat."""
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    requests.post(url, json=payload)


def handle_updates(updates, user_db):
    """Processes new messages."""
    highest_update_id = 0
    db_updated = False
    
    for update in updates:
        # Handle both text messages and /start button clicks
        if 'message' in update:
            message = update['message']
            chat_id = message['chat']['id']
            
            # Get username (if they have one), otherwise use their first name
            username = message['from'].get('username')
            if not username:
                # Fallback to first_name if no username
                username = message['from'].get('first_name', 'Unknown')
                print(f"⚠️ User has no username, using first_name: {username}")
            # Save user immediately when they interact with bot
            if username not in user_db or user_db[username] != chat_id:
                user_db[username] = chat_id
                db_updated = True
                print(f"💾 Saving User: {username} -> {chat_id}")
            else:
                print(f"ℹ️ User {username} already in database")
            


            text = message.get('text', '')
            print(f"📨 Received: '{text}' from {username} (chat_id: {chat_id})")
            
            # Handle /start command (with or without parameters)
            if text.startswith('/start'):
                send_message(chat_id, f"Welcome {username}! Your ID has been obtained and saved automatically. You are now connected!")
                print(f"✅ User {username} connected via /start")
                db_updated = True  # Ensure we save on /start
            elif text.lower() == '/hello':
                send_message(chat_id, f"Hello, {username}! I have saved your ID.")
            elif text.lower() == '/info':
                send_message(chat_id, f"Your Chat ID is {chat_id}. Your username is: {username}. I am running on a server.")

            # update the ID so we don't process this message again
            update_id = update['update_id']
            if update_id > highest_update_id:
                highest_update_id = update_id
    
    # Save database once after processing all updates
    if db_updated:
        save_database(user_db)
        print(f"📊 Current database: {user_db}")

    return highest_update_id

# ... (keep main loop the same) ...

# --- MAIN LOOP ---

def main():
    print("=" * 60)
    print("🤖 BOT SERVER STARTING...")
    print("=" * 60)
    print(f"📁 Database file: {DB_FILE}")
    print(f"🔑 Bot Token: {TOKEN[:10]}...{TOKEN[-5:]}")
    print("=" * 60)
    
    # Load existing users
    user_db = load_database()
    print(f"📊 Loaded {len(user_db)} users from database: {user_db}")
    print("🔄 Starting to poll Telegram API for updates...")
    print("⏳ Waiting for messages (this may take up to 30 seconds per poll)...")
    print("=" * 60)

    # Skip old messages - start from current time
    # Get the latest update_id first to skip all old messages
    print("🔄 Fetching latest update ID to skip old messages...")
    try:
        test_response = requests.get(f"https://api.telegram.org/bot{TOKEN}/getUpdates?offset=-1&limit=1", timeout=10)
        if test_response.status_code == 200:
            test_data = test_response.json()
            if test_data.get('ok') and test_data.get('result'):
                latest_updates = test_data['result']
                if latest_updates:
                    last_update_id = latest_updates[-1]['update_id']
                    print(f"⏭️ Skipping all updates before ID: {last_update_id}")
                else:
                    last_update_id = None
                    print("📭 No previous updates found, starting fresh")
            else:
                last_update_id = None
        else:
            last_update_id = None
    except Exception as e:
        print(f"⚠️ Could not fetch latest update ID: {e}")
        print("📝 Will process all updates (this may include old messages)")
        last_update_id = None
    
    main.poll_count = 0

    while True:
        try:
            # Ask Telegram for updates. 
            # 'timeout=30' keeps the connection open for 30s waiting for a msg (Long Polling)
            url = f"https://api.telegram.org/bot{TOKEN}/getUpdates?timeout=30"
            if last_update_id:
                url += f"&offset={last_update_id + 1}"

            response = requests.get(url, timeout=35)
            
            if response.status_code != 200:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                time.sleep(5)
                continue
            
            data = response.json()
            
            if not data.get('ok'):
                print(f"❌ Telegram API Error: {data.get('description', 'Unknown error')}")
                time.sleep(5)
                continue

            if data.get('result'):
                # Process the messages
                last_update_id = handle_updates(data['result'], user_db)
            else:
                # No new updates - show heartbeat every 10 polls (5 minutes)
                if not hasattr(main, 'poll_count'):
                    main.poll_count = 0
                main.poll_count += 1
                if main.poll_count % 10 == 0:
                    print(f"💓 Bot is alive... waiting for messages (poll #{main.poll_count})")
            
        except requests.exceptions.Timeout:
            print("⏱️ Request timeout (this is normal for long polling)")
        except requests.exceptions.RequestException as e:
            print(f"❌ Network Error: {e}")
            print("🔄 Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            print(f"❌ Unexpected Error: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(5) # Wait a bit before retrying if network fails

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Bot server stopped by user (Ctrl+C)")
        print("✅ Shutting down gracefully...")
        sys.exit(0)