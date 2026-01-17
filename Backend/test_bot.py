"""Quick test to verify bot can connect to Telegram API"""
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
if not TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required. Please create a .env file in the Backend directory.")

print("Testing Telegram Bot API connection...")
print(f"Token: {TOKEN[:10]}...{TOKEN[-5:]}")

# Test 1: Get bot info
print("\n1. Testing getMe endpoint...")
try:
    response = requests.get(f"https://api.telegram.org/bot{TOKEN}/getMe", timeout=10)
    data = response.json()
    if data.get('ok'):
        bot_info = data.get('result', {})
        print(f"✅ Bot is connected!")
        print(f"   Bot Name: {bot_info.get('first_name')}")
        print(f"   Bot Username: @{bot_info.get('username')}")
        print(f"   Bot ID: {bot_info.get('id')}")
    else:
        print(f"❌ Error: {data.get('description')}")
except Exception as e:
    print(f"❌ Connection failed: {e}")

# Test 2: Get updates
print("\n2. Testing getUpdates endpoint...")
try:
    response = requests.get(f"https://api.telegram.org/bot{TOKEN}/getUpdates?timeout=5", timeout=10)
    data = response.json()
    if data.get('ok'):
        updates = data.get('result', [])
        print(f"✅ API is responding!")
        print(f"   Pending updates: {len(updates)}")
        if updates:
            print(f"   Latest update ID: {updates[-1].get('update_id')}")
        else:
            print("   No pending updates (this is normal)")
    else:
        print(f"❌ Error: {data.get('description')}")
except Exception as e:
    print(f"❌ Connection failed: {e}")

print("\n" + "="*50)
print("If both tests passed, your bot is working!")
print("If tests failed, check your bot token.")
print("="*50)
