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
    
    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", "gst-pro-backend",
        "--distpath", "./dist",
        "--specpath", "./build",
        "--workpath", "./build/temp",
        "--add-data", "*.py:.",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.protocols.websockets.auto", 
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "aiosqlite",
        "--hidden-import", "sqlalchemy.dialects.sqlite",
        "--console",
        "server_standalone.py"
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("✅ Executable built successfully!")
        print(f"📦 Location: {Path('dist/gst-pro-backend.exe').absolute()}")
        
        # Test the executable
        print("\n🧪 Testing executable...")
        test_cmd = ["./dist/gst-pro-backend", "--help"]
        test_result = subprocess.run(test_cmd, capture_output=True, text=True)
        
        if test_result.returncode == 0:
            print("✅ Executable test passed!")
        else:
            print("⚠️  Executable test had issues, but build completed.")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)
    
    print("\n🎉 Backend executable is ready for packaging!")

if __name__ == "__main__":
    build_executable()