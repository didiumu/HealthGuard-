# HealthGuard Frontend - Production Deployment

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Serve the build**
   ```bash
   npx serve -s build
   ```

## Environment Configuration

### Required Variables
- `REACT_APP_API_URL`: Backend API URL (e.g., `https://api.healthguard.com`)

### Optional Variables
- `REACT_APP_DEBUG`: Enable debug logging (`true`/`false`)
- `REACT_APP_API_TIMEOUT`: Request timeout in milliseconds (default: 10000)

## Production Checklist

### Pre-deployment
- [ ] Backend is running and accessible
- [ ] CORS is configured for your domain
- [ ] Environment variables are set
- [ ] Build completes without errors
- [ ] All tests pass (`npm test`)

### Post-deployment
- [ ] Frontend loads correctly
- [ ] API calls work (check browser network tab)
- [ ] Error handling works (test with backend offline)
- [ ] Responsive design works on mobile
- [ ] All features functional

## Architecture

```
src/
├── config/          # API configuration
├── services/        # API service layer
├── docs/           # Documentation
├── components/     # React components
└── locales/        # Internationalization
```

## API Integration

The frontend uses a centralized API service (`src/services/api.js`) that provides:

- **Error Handling**: Network, timeout, and HTTP errors
- **Request Management**: Automatic retries and timeout protection
- **Response Validation**: Ensures API responses are valid
- **Type Safety**: Validates request/response formats

## Error Handling

The application handles three types of errors:

1. **Network Errors**: Connection issues, offline status
2. **Timeout Errors**: Requests taking too long
3. **API Errors**: HTTP status errors (400, 500, etc.)

Each error type shows appropriate user messages and recovery options.

## Performance

- **Bundle Size**: Optimized with React build tools
- **API Calls**: Debounced and cached where appropriate
- **Loading States**: Clear feedback during operations
- **Error Recovery**: Retry mechanisms for failed requests

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured
   - Check browser console for specific errors

2. **API Connection Failed**
   - Verify `REACT_APP_API_URL` is correct
   - Test backend endpoint directly

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

### Debug Mode

Enable debug logging:
```bash
REACT_APP_DEBUG=true npm start
```

This will log all API requests and responses to the browser console.