import subprocess
import sys
import os
import signal

def run():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, 'Backend')
    frontend_dir = os.path.join(root, 'Frontend')

    # Detect executable for npx on Windows
    npx_cmd = 'npx.cmd' if os.name == 'nt' else 'npx'

    print("\n🚀 Launching Flask Backend (Port 5000)...")
    backend_proc = subprocess.Popen(
        [sys.executable, 'app.py'],
        cwd=backend_dir
    )

    print("🚀 Launching React Frontend (Vite on port 3000 / fallback if needed)...")
    frontend_proc = subprocess.Popen(
        [npx_cmd, 'vite', '--host', '0.0.0.0', '--port', '3000'],
        cwd=frontend_dir,
        env={**os.environ, 'BROWSER': 'none'}
    )

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        
        # Gracefully terminate processes
        for proc in (backend_proc, frontend_proc):
            if proc and proc.poll() is None:
                proc.terminate()

        # Force kill if they don't exit cleanly
        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
            frontend_proc.kill()
            
        print("Done.")

if __name__ == '__main__':
    run()