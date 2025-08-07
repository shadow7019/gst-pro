# Contributing to GST Pro

Thank you for your interest in contributing to GST Pro! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
1. Check existing issues to avoid duplicates
2. Use the appropriate issue template
3. Provide detailed information including:
   - Operating system and version
   - GST Pro version
   - Steps to reproduce
   - Expected vs actual behavior

### Feature Requests
1. Use the feature request template
2. Explain the use case and benefits
3. Consider if it fits the project's scope

### Code Contributions

#### Prerequisites
- Python 3.8+
- Node.js 16+
- Git
- Basic knowledge of React and FastAPI

#### Development Setup

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/gst-pro.git
   cd gst-pro
   ```

3. **Set up the backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Set up the frontend**:
   ```bash
   cd frontend
   yarn install
   ```

5. **Start development servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   python server.py
   
   # Terminal 2 - Frontend
   cd frontend
   yarn start
   ```

#### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**:
   ```bash
   # Test web version
   yarn start
   
   # Test desktop version
   yarn electron-dev
   
   # Build desktop version
   ./build-desktop.sh
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

## 📋 Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints where possible
- Write docstrings for functions
- Keep functions focused and small

### JavaScript/React (Frontend)
- Use ES6+ features
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused

### General
- Write clear, descriptive commit messages
- Use meaningful variable and function names
- Comment complex logic
- Update documentation for new features

## 🧪 Testing

### Manual Testing
- Test all major features before submitting PR
- Test on different operating systems if possible
- Verify both web and desktop versions work

### Areas to Test
- Expense addition and categorization
- GST calculations
- Income tracking
- Tax advice feature
- Data persistence
- UI responsiveness

## 📁 Project Structure

```
gst-pro/
├── backend/                 # Python FastAPI backend
│   ├── server.py           # Main web server
│   ├── server_standalone.py # Desktop server
│   ├── build_executable.py # Build script
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/               # React source code
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
├── .github/               # GitHub templates and workflows
├── build-desktop.sh       # Desktop build script
└── prepare-release.sh     # Release preparation script
```

## 🎯 Contribution Areas

### High Priority
- Bug fixes
- Performance improvements
- Security enhancements
- Documentation improvements

### Medium Priority
- New GST calculation features
- UI/UX improvements
- Additional export formats
- Better error handling

### Low Priority
- New themes
- Additional charts/graphs
- Advanced filtering options

## ❓ Questions?

- Open a discussion on GitHub
- Check existing issues and discussions
- Review the README.md for basic information

## 🔄 Review Process

1. All PRs require review before merging
2. Automated checks must pass
3. Changes should include appropriate tests
4. Breaking changes require discussion

## 📝 License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.
