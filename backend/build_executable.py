#!/usr/bin/env python3
"""
Build script to create standalone executable for GST Pro backend
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

def build_executable():
    """Build standalone executable using PyInstaller"""
    
    # Clean previous builds
    dist_dir = Path("dist")
    build_dir = Path("build")
    
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    if build_dir.exists():
        shutil.rmtree(build_dir)
    
    print("🏗️  Building GST Pro Backend Executable...")
    
    # PyInstaller command with all necessary hidden imports
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", "gst-pro-backend",
        "--distpath", "./dist",
        "--specpath", "./build",
        "--workpath", "./build/temp",
        "--hidden-import", "fastapi",
        "--hidden-import", "uvicorn",
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.protocols.websockets.auto",
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "aiosqlite",
        "--hidden-import", "pydantic",
        "--hidden-import", "fastapi.middleware.cors",
        "--hidden-import", "sqlite3",
        "--hidden-import", "json",
        "--console",
        "server_standalone.py"
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("✅ Backend executable built successfully!")
        print(f"📦 Location: {Path('dist').absolute()}")
        
        # Verify the executable was created
        exe_path = Path("dist/gst-pro-backend.exe" if os.name == "nt" else "dist/gst-pro-backend")
        if exe_path.exists():
            print(f"📊 Executable size: {exe_path.stat().st_size / (1024*1024):.1f} MB")
            print("🎉 Backend executable is ready for packaging!")
        else:
            print("❌ Executable not found after build!")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)

if __name__ == "__main__":
    # Ensure we're in the right directory
    os.chdir(Path(__file__).parent)
    
    # Check if PyInstaller is available
    try:
        subprocess.run(["pyinstaller", "--version"], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print("❌ PyInstaller not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller==6.15.0"], check=True)
    
    build_executable()