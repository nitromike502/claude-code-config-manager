#!/usr/bin/env node

/**
 * Claude Code Config Manager CLI
 *
 * Entry point for running the manager via npx
 */

const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const { promisify } = require('util');

const execAsync = promisify(exec);
const serverPath = path.join(__dirname, '..', 'src', 'backend', 'server.js');

/**
 * Check if a port is in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

/**
 * Find the next available port starting from startPort
 */
async function findAvailablePort(startPort = 8420, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

/**
 * Check if an instance is already running on a specific port
 */
async function checkIfRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok' && json.service === 'claude-code-config-manager') {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Check for running instances on common ports
 */
async function findRunningInstance() {
  for (let port = 8420; port < 8430; port++) {
    if (await checkIfRunning(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Main CLI entry point
 */
async function main() {
  try {
    console.log('🚀 Starting Claude Code Config Manager...\n');

    // Check if already running
    const runningPort = await findRunningInstance();
    if (runningPort) {
      console.log('✅ An instance is already running!');
      console.log(`📍 Open in browser: http://localhost:${runningPort}\n`);
      process.exit(0);
    }

    // Find available port
    const port = await findAvailablePort(8420);

    if (port !== 8420) {
      console.log(`⚠️  Port 8420 is in use, using port ${port} instead`);
    }

    console.log(`📍 Server will be available at: http://localhost:${port}\n`);

    // Start the server with the selected port
    const server = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: { ...process.env, PORT: port.toString() }
    });

    server.on('error', (err) => {
      console.error('❌ Failed to start server:', err.message);
      process.exit(1);
    });

    server.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down server...');
      server.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      server.kill('SIGTERM');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
