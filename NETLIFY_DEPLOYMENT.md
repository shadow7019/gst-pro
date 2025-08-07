# Netlify Deployment Guide for GST Pro

## Quick Setup

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
   - Production branch: `main` (or your default branch)

3. **Environment Variables** (if needed)
   - `NODE_VERSION=18`
   - `NPM_VERSION=8`
   - `CI=true` (prevents warnings from failing the build)

## Advanced Configuration

### Custom Domain Setup
1. Go to Site Settings > Domain management
2. Add your custom domain
3. Update DNS settings as instructed

### Environment Variables
```
NODE_ENV=production
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
CI=true
```

### Build Optimization
- The `netlify.toml` file is pre-configured for optimal performance
- Includes security headers and caching rules
- SPA redirect handling for React Router

## Troubleshooting

### Common Issues

1. **"Base directory does not exist"**
   - Ensure your `netlify.toml` doesn't have an incorrect `base` setting
   - Our config doesn't use `base` - builds from repository root

2. **"Failed to parse configuration"**
   - Check `netlify.toml` syntax
   - Ensure proper TOML formatting

3. **Build fails with "command not found"**
   - Check Node.js version in build settings
   - Ensure `package.json` scripts are correct

4. **Static files not loading**
   - Verify `homepage` field in `package.json`
   - Check build output directory

### Manual Deployment
```bash
# Build the project
./build-web.sh

# Deploy using Netlify CLI
npx netlify-cli deploy --prod --dir=frontend/build
```

## Performance Features

- **Asset Optimization**: Automatic minification and compression
- **CDN**: Global content delivery network
- **Caching**: Optimized cache headers for static assets
- **Security Headers**: XSS protection, content security policy
- **SPA Support**: Single Page Application routing

## Monitoring

- **Build Logs**: Available in Netlify dashboard
- **Deploy Previews**: Automatic preview for pull requests  
- **Analytics**: Built-in traffic analytics
- **Forms**: Contact form handling (if needed)

For more details, see: https://docs.netlify.com/
