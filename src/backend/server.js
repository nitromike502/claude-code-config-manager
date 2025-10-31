const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8420;

// Global security middleware: Prevent path traversal attacks
// Note: Express normalizes paths before middleware runs, so this catches encoded traversal (%2F)
// but not plain ../ which gets normalized away at the HTTP parser level
app.use((req, res, next) => {
  const originalUrl = req.originalUrl || '';

  // Check for path traversal sequences in URLs targeting projects
  if (originalUrl.includes('/api/projects') && originalUrl.includes('..')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID format',
      details: 'Project ID must not contain path traversal sequences'
    });
  }

  next();
});

// Middleware
app.use(cors()); // Enable CORS for frontend development
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Import routes
const projectsRouter = require('./routes/projects');
const userRouter = require('./routes/user');

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/user', userRouter);

// Serve static frontend files from built SPA (dist)
// Fall back to frontend for development if dist is not available
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    service: 'claude-code-manager'
  });
});

// Catch-all route for SPA (serve index.html for all non-API routes)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.url.startsWith('/api/')) {
    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).json({
          success: false,
          error: 'Frontend not found. Run "npm run build" to build the SPA.'
        });
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`Claude Code Manager Backend Server`);
    console.log('='.repeat(60));
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Available API endpoints:');
    console.log('  GET  /api/health                        - Health check');
    console.log('  GET  /api/projects                      - List all projects');
    console.log('  POST /api/projects/scan                 - Rescan projects');
    console.log('  GET  /api/projects/:id/agents           - Get project agents');
    console.log('  GET  /api/projects/:id/commands         - Get project commands');
    console.log('  GET  /api/projects/:id/hooks            - Get project hooks');
    console.log('  GET  /api/projects/:id/mcp              - Get project MCP servers');
    console.log('  GET  /api/user/agents                   - Get user agents');
    console.log('  GET  /api/user/commands                 - Get user commands');
    console.log('  GET  /api/user/hooks                    - Get user hooks');
    console.log('  GET  /api/user/mcp                      - Get user MCP servers');
    console.log('='.repeat(60));
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
