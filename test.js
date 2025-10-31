#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server responds correctly
 * This script sends a "list tools" request to the server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Spawn the MCP server
const server = spawn('node', [join(__dirname, 'dist', 'index.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    SUI_GRAPHQL_URL: 'https://graphql.testnet.sui.io/graphql'
  }
});

// MCP protocol: send initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

// MCP protocol: send list tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list'
};

let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();

  // Process complete JSON-RPC messages (one per line)
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Received response:', JSON.stringify(response, null, 2));

        if (response.id === 1) {
          // After init response, send list tools request
          console.log('\nSending list tools request...\n');
          server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
        } else if (response.id === 2) {
          // Got tools list, print and exit
          console.log('\n✅ MCP Server is working!');
          console.log(`\nFound ${response.result.tools.length} tools:`);
          response.result.tools.forEach((tool, i) => {
            console.log(`${i + 1}. ${tool.name} - ${tool.description.substring(0, 60)}...`);
          });
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        console.error('Error parsing response:', e.message);
      }
    }
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code || 1);
  }
});

// Send initialize request
console.log('Sending initialize request...\n');
server.stdin.write(JSON.stringify(initRequest) + '\n');

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Test timeout!');
  server.kill();
  process.exit(1);
}, 10000);
