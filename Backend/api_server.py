from flask import Flask, request, jsonify
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configuration
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
if not BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required. Please create a .env file in the Backend directory.")

# Get the directory where this script is located (same as bot_server.py)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(SCRIPT_DIR, 'users.json')  # Always use absolute path
TELEGRAM_API_URL = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'


def load_users():
    """Load users from users.json file."""
    if not os.path.exists(USERS_FILE):
        return {}
    
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}


def send_telegram_message(chat_id, message):
    """Send a message to Telegram using the Bot API."""
    payload = {
        'chat_id': chat_id,
        'text': message
    }
    
    try:
        response = requests.post(TELEGRAM_API_URL, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Telegram API error: {str(e)}")


@app.route('/send', methods=['POST'])
def send_message():
    """Endpoint to send a message to a user via Telegram."""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        username = data.get('username')
        message = data.get('message')
        
        # Validate required fields
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Load users database
        users = load_users()
        
        # Find chat_id for username
        if username not in users:
            return jsonify({
                'error': f'User "{username}" not found in database'
            }), 404
        
        chat_id = users[username]
        
        # Send message via Telegram API
        try:
            result = send_telegram_message(chat_id, message)
            return jsonify({
                'success': True,
                'message': 'Message sent successfully',
                'chat_id': chat_id,
                'telegram_response': result
            }), 200
        except Exception as e:
            return jsonify({
                'error': 'Failed to send message via Telegram API',
                'details': str(e)
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@app.route('/send-message', methods=['POST'])
def send_message_alt():
    """Alternative endpoint that accepts target_username instead of username."""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Support both 'target_username' and 'username' for flexibility
        username = data.get('target_username') or data.get('username')
        message = data.get('message')
        
        # Validate required fields
        if not username:
            return jsonify({'error': 'target_username is required'}), 400
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Load users database
        users = load_users()
        
        # Find chat_id for username
        if username not in users:
            return jsonify({
                'error': f'User "{username}" not found in database'
            }), 404
        
        chat_id = users[username]
        
        # Send message via Telegram API
        try:
            result = send_telegram_message(chat_id, message)
            return jsonify({
                'success': True,
                'message': 'Message sent successfully',
                'chat_id': chat_id,
                'telegram_response': result
            }), 200
        except Exception as e:
            return jsonify({
                'error': 'Failed to send message via Telegram API',
                'details': str(e)
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@app.route('/users', methods=['GET'])
def get_users():
    """Endpoint to get list of all users."""
    try:
        users = load_users()
        # Return just the usernames as a list
        return jsonify({
            'success': True,
            'users': list(users.keys())
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to load users',
            'details': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    print("🚀 Flask API Server starting...")
    print(f"📡 Server will be available at http://{host}:{port}")
    print("💡 Use your local IP address (e.g., http://192.168.1.5:5000) to access from mobile devices")
    app.run(host=host, port=port, debug=True)
