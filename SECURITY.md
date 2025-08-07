# Security Policy

## Supported Versions

We provide security updates for the following versions of GST Pro:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of GST Pro seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
- Email: [Create a private email or contact method]
- GitHub Security Advisories: Use the "Security" tab in this repository

### What to Include

Please include the following information in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days  
- **Status Updates**: Weekly until resolved
- **Resolution**: Target within 30 days for critical issues

### Security Considerations

GST Pro is designed with security in mind:

- **Local Data Only**: All data stays on the user's computer
- **No Network Dependencies**: Application works completely offline
- **Encrypted Storage**: Local database uses SQLite with appropriate security measures
- **No Telemetry**: No data is sent to external servers
- **Sandboxed Execution**: Electron app runs in a secure sandbox

### Safe Usage Recommendations

To use GST Pro securely:

1. **Download from Official Sources**: Only download from GitHub releases
2. **Verify File Integrity**: Check file hashes if provided
3. **Keep Updated**: Install security updates promptly
4. **Backup Data**: Regularly backup your GST data
5. **System Security**: Keep your operating system updated

### Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1, 1.0.2)
- Documented in the changelog
- Announced in release notes
- Applied to supported versions only
