import requests
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(SCRIPT_DIR, 'users.json')

def load_users():
    """Load users from users.json file."""
    if not os.path.exists(USERS_FILE):
        return {}
    
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def send_telegram_message(username=None, message="Test message"):
    """
    Send a message to Telegram.
    
    Args:
        username: Telegram username (optional). If provided, looks up chat_id from users.json.
                  If not provided, uses the first user in users.json.
        message: Message text to send
    """
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    
    if not bot_token:
        raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required. Please create a .env file in the Backend directory.")

    # Load users from users.json (same as api_server.py and bot_server.py)
    users = load_users()
    
    if not users:
        raise ValueError("No users found in users.json. Start the bot_server.py first to populate users.json")
    
    # Get chat_id from users.json
    if username:
        if username not in users:
            raise ValueError(f"User '{username}' not found in users.json. Available users: {list(users.keys())}")
        chat_id = users[username]
    else:
        # Use first user if no username specified
        first_username = list(users.keys())[0]
        chat_id = users[first_username]
        print(f"⚠️ No username specified, using first user: {first_username} (chat_id: {chat_id})")

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print(f"✅ Message sent successfully to {username or first_username} (chat_id: {chat_id})!")
        else:
            print(f"❌ Failed to send. Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Example: send to a specific user
    # send_telegram_message(username="aryanagr", message="Your mother is FAT.")
    
    # Or send to first user in users.json
    send_telegram_message(message="Test message from send_msg.py")