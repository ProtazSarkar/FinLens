import subprocess
import sys
import os

def run():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, 'Backend')
    frontend_dir = os.path.join(root, 'Frontend')

    # Detect executable for npx on Windows
    npx_cmd = 'npx.cmd' if os.name == 'nt' else 'npx'

    # Check whether 'dev' mode is requested
    is_dev = len(sys.argv) > 1 and sys.argv[1].lower() in ('dev', 'development', '--dev', '-d')

    if is_dev:
        print("\n" + "=" * 65)
        print(" 🛠️  FinLens — Launching in DEVELOPMENT Mode")
        print(" • Vite Hot Module Replacement (HMR) active on Port 3000")
        print(" • Flask Backend with Live Debugger on Port 5000")
        print("=" * 65 + "\n")
        
        backend_env = {**os.environ, 'FLASK_ENV': 'development', 'FLASK_DEBUG': '1'}
        frontend_cmd = [npx_cmd, 'vite', '--host', '0.0.0.0', '--port', '3000']
    else:
        print("\n" + "=" * 65)
        print(" 🚀 FinLens — Launching in PRODUCTION Mode")
        print(" • Optimized Production Frontend on Port 3000")
        print(" • Production Flask Engine on Port 5000")
        print(" • (Run 'python start.py dev' for live development/HMR mode)")
        print("=" * 65 + "\n")

        # Build frontend if dist does not exist yet
        dist_path = os.path.join(frontend_dir, 'dist', 'index.html')
        if not os.path.exists(dist_path):
            print("📦 Building production frontend bundle...")
            build_proc = subprocess.run([npx_cmd, 'vite', 'build'], cwd=frontend_dir)
            if build_proc.returncode != 0:
                print("⚠️ Build failed, falling back to vite dev server.")
                frontend_cmd = [npx_cmd, 'vite', '--host', '0.0.0.0', '--port', '3000']
            else:
                frontend_cmd = [npx_cmd, 'vite', 'preview', '--host', '0.0.0.0', '--port', '3000']
        else:
            frontend_cmd = [npx_cmd, 'vite', 'preview', '--host', '0.0.0.0', '--port', '3000']

        backend_env = {**os.environ, 'FLASK_ENV': 'production', 'FLASK_DEBUG': '0'}

    backend_proc = subprocess.Popen(
        [sys.executable, 'app.py'],
        cwd=backend_dir,
        env=backend_env
    )

    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        env={**os.environ, 'BROWSER': 'none'}
    )

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down FinLens services gracefully...")
        
        for proc in (backend_proc, frontend_proc):
            if proc and proc.poll() is None:
                proc.terminate()

        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
            frontend_proc.kill()
            
        print("Done.")

if __name__ == '__main__':
    run()
