# GST Pro - Automated GST & Tax Platform

A comprehensive desktop application for GST calculations, expense tracking, and tax advice for Indian businesses.

## 🚀 Features

- **Expense Tracking**: Add and categorize business expenses
- **GST Calculations**: Automatic GST calculations with state-wise rates
- **Income Management**: Track and manage business income
- **Tax Advice**: AI-powered tax consultation
- **Offline Operation**: Runs completely offline once installed
- **Cross-Platform**: Available for Windows, macOS, and Linux

## 📥 Download & Install

### Option 1: Download Pre-built Installers (Recommended)

1. Go to the [Releases page](https://github.com/shadow7019/gst-pro/releases)
2. Download the installer for your operating system:
   - **Windows**: `GST-Pro-Setup-x.x.x.exe`
   - **macOS**: `GST-Pro-x.x.x.dmg`
   - **Linux**: `GST-Pro-x.x.x.AppImage`
3. Run the installer and follow the setup instructions
4. Launch GST Pro from your applications menu

### Option 2: Build from Source

#### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with yarn
- **Git**

#### Build Steps

1. **Clone the repository**:
```bash
git clone https://github.com/shadow7019/gst-pro.git
cd gst-pro
```

2. **Install backend dependencies**:
```bash
cd backend
pip install -r requirements_standalone.txt
pip install pyinstaller
```

3. **Install frontend dependencies**:
```bash
cd ../frontend
yarn install
```

4. **Build desktop application**:
```bash
# From project root directory
chmod +x build-desktop.sh
./build-desktop.sh
```

5. **Find your installers**:
The built installers will be available in `frontend/dist/`:
- Windows: `.exe` installer
- macOS: `.dmg` installer
- Linux: `.AppImage` file

## 🛠️ Development

### Web Development Mode

1. **Start backend server**:
```bash
cd backend
python server.py
```

2. **Start frontend development server**:
```bash
cd frontend
yarn start
```

3. **Access the application**:
Open http://localhost:3000 in your browser

### Desktop Development Mode

```bash
cd frontend
yarn electron-dev
```

This starts both the React development server and Electron app simultaneously.

## 📁 Project Structure

```
gst-pro/
├── backend/                 # Python FastAPI backend
│   ├── server.py           # Web server
│   ├── server_standalone.py # Desktop server
│   ├── build_executable.py # Build script
│   └── requirements.txt    # Dependencies
├── frontend/               # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
├── build-desktop.sh       # Desktop build script
└── README.md              # This file
```

## 🔧 Configuration

### Backend Configuration
- Database: SQLite (automatically created)
- Port: 8000 (web), 8001 (desktop)
- CORS: Configured for local development

### Frontend Configuration
- Framework: React 18
- UI Components: Shadcn/ui
- Styling: Tailwind CSS
- Desktop: Electron

## 📊 Usage

### Adding Expenses
1. Navigate to "Add Expense" tab
2. Fill in expense details (date, amount, category, vendor)
3. Select vendor state for accurate GST calculation
4. Click "Add Expense"

### Viewing Reports
- **Dashboard**: Overview of expenses and GST summary
- **Expenses**: Detailed expense list with filtering
- **GST Summary**: Breakdown of GST calculations

### Tax Consultation
- Use the "Tax Advice" feature for AI-powered tax guidance
- Ask questions about GST rates, compliance, and deductions

## 🛡️ Privacy & Security

- **100% Local**: All data stays on your computer
- **No Cloud Dependency**: Works completely offline
- **Secure Storage**: Local SQLite database
- **No Data Transmission**: No personal data sent to external servers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/shadow7019/gst-pro/issues) page
2. Create a new issue with detailed information
3. Include your operating system and error messages

---

**Made with ❤️ for Indian businesses**
