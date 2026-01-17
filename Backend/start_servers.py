"""Start Flask API server, Telegram bot server, and Supabase server"""
import subprocess
import sys
import os

# Change to Backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("🚀 Starting PanicBot Servers...")
print("=" * 60)
print("📡 Flask API Server: http://0.0.0.0:5000")
print("🤖 Telegram Bot Server: Polling for updates...")
print("🔐 Supabase Server: http://localhost:3000")
print("=" * 60)
print("Press Ctrl+C to stop all servers")
print("=" * 60)

# Start all servers
try:
    # Start Flask API server (with output visible)
    flask_process = subprocess.Popen(
        [sys.executable, "api_server.py"],
        stdout=sys.stdout,
        stderr=sys.stderr,
        bufsize=1
    )
    
    # Start Telegram bot server (with output visible)
    bot_process = subprocess.Popen(
        [sys.executable, "bot_server.py"],
        stdout=sys.stdout,
        stderr=sys.stderr,
        bufsize=1
    )
    
    # Start Supabase server (Node.js)
    supabase_dir = os.path.join(os.path.dirname(__file__), "supabase-server")
    supabase_process = None
    if os.path.exists(supabase_dir):
        # Check if node_modules exists, if not, warn user
        node_modules = os.path.join(supabase_dir, "node_modules")
        if not os.path.exists(node_modules):
            print("⚠️  Warning: Supabase server dependencies not installed.")
            print("   Run: cd supabase-server && npm install")
        else:
            # Use shell=True for Windows compatibility
            if sys.platform == "win32":
                supabase_process = subprocess.Popen(
                    ["npm.cmd", "start"],
                    cwd=supabase_dir,
                    shell=True,
                    stdout=sys.stdout,
                    stderr=sys.stderr,
                    bufsize=1
                )
            else:
                supabase_process = subprocess.Popen(
                    ["npm", "start"],
                    cwd=supabase_dir,
                    shell=True,
                    stdout=sys.stdout,
                    stderr=sys.stderr,
                    bufsize=1
                )
    else:
        print("⚠️  Warning: supabase-server directory not found. Skipping Supabase server.")
    
    # Wait for all processes
    flask_process.wait()
    bot_process.wait()
    if supabase_process:
        supabase_process.wait()
except KeyboardInterrupt:
    print("\n\n🛑 Stopping servers...")
    flask_process.terminate()
    bot_process.terminate()
    if supabase_process:
        supabase_process.terminate()
    flask_process.wait()
    bot_process.wait()
    if supabase_process:
        supabase_process.wait()
    print("✅ All servers stopped")
