# 🔍 Find Your GST Pro Directory and Setup Git

## Step 1: Find Your Project Directory
Since you're working in VS Code with the GST Pro project, you need to find where it's located on your system.

### Option A: Check VS Code Workspace
1. In VS Code, go to **File → Open Folder** 
2. Look at the current folder path in the dialog
3. Or check the bottom status bar for the current workspace path

### Option B: Find the Directory
Open **File Explorer** and look for a folder named `gst-pro` or similar containing:
- `netlify.toml`
- `build-desktop.sh` 
- `frontend/` folder
- `backend/` folder

## Step 2: Initialize Git Repository (if needed)
Once you find your project directory, open **Git Bash** or **Command Prompt** there and run:

```bash
# Navigate to your project directory (replace with actual path)
cd "C:\path\to\your\gst-pro"  # Example: cd "C:\Users\swast\Documents\gst-pro"

# Check if it's already a git repository
git status

# If not a git repo, initialize it
git init

# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/shadow7019/gst-pro.git

# Check current branch
git branch

# If not on main branch, create and switch to main
git checkout -b main
```

## Step 3: Commit and Push
```bash
# Add all files
git add .

# Make initial commit
git commit -m "Initial commit with Netlify configuration fixes"

# Push to GitHub
git push -u origin main
```

## Step 4: For Future Commits
```bash
git add netlify.toml NETLIFY-FIX-GUIDE.md
git commit -m "Fix Netlify deployment configuration"
git push origin main
```

## 🚨 Quick Fix: VS Code Terminal
The easiest way is to use VS Code's integrated terminal:

1. In VS Code, press **Ctrl+`** to open terminal
2. You should already be in the project directory
3. Run the git commands directly there

## Alternative: GitHub Desktop
If you have GitHub Desktop installed:
1. Open GitHub Desktop
2. **File → Add Local Repository**
3. Browse to your GST Pro folder
4. Publish to GitHub if not already connected
5. Commit and push your changes through the GUI

Let me know which directory path you find, and I can help you with the exact commands!
