import subprocess
import sys
import os

def install_backend_deps(backend_dir):
    req_file = os.path.join(backend_dir, 'requirements.txt')
    if os.path.exists(req_file):
        print("🔍 Checking Python backend dependencies...")
        subprocess.check_call(
            [sys.executable, '-m', 'pip', 'install', '-r', req_file],
            cwd=backend_dir
        )

def install_frontend_deps(frontend_dir):
    node_modules = os.path.join(frontend_dir, 'node_modules')
    package_json = os.path.join(frontend_dir, 'package.json')
    
    # Only run npm install if node_modules does not exist
    if os.path.exists(package_json) and not os.path.exists(node_modules):
        print("📦 'node_modules' missing. Running 'npm install'...")
        subprocess.check_call(
            ['npm', 'install'],
            cwd=frontend_dir,
            shell=True if os.name == 'nt' else False
        )
    else:
        print("✅ Frontend dependencies already installed.")

def run():
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, 'backend')
    frontend_dir = os.path.join(root, 'frontend')

    # Step 1: Handle dependencies automatically
    install_backend_deps(backend_dir)
    install_frontend_deps(frontend_dir)

    # Step 2: Start servers
    print("\n🚀 Launching Flask Backend (Port 5000)...")
    backend_proc = subprocess.Popen(
        [sys.executable, 'run.py'],
        cwd=backend_dir
    )

    print("🚀 Launching React Frontend (Port 3000)...")
    frontend_proc = subprocess.Popen(
        ['npx', 'vite'],
        cwd=frontend_dir,
        shell=True if os.name == 'nt' else False
    )

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nTerminating services...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == '__main__':
    run()