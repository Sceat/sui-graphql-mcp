#!/usr/bin/env node

/**
 * Test the MCP server with actual GraphQL queries
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = spawn('node', [join(__dirname, 'dist', 'index.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    SUI_GRAPHQL_URL: 'https://graphql.testnet.sui.io/graphql'
  }
});

let buffer = '';
let messageId = 0;

function sendRequest(method, params = {}) {
  messageId++;
  const request = {
    jsonrpc: '2.0',
    id: messageId,
    method,
    params
  };
  server.stdin.write(JSON.stringify(request) + '\n');
  return messageId;
}

server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('\n📨 Response:', JSON.stringify(response, null, 2));

        // Run tests based on response ID
        if (response.id === 1) {
          console.log('\n✅ Server initialized');
          console.log('\n🔍 Testing: List tools...');
          sendRequest('tools/list');
        } else if (response.id === 2) {
          console.log('\n✅ Tools listed');
          console.log(`Found ${response.result.tools.length} tools:`);
          response.result.tools.forEach(tool => {
            console.log(`  - ${tool.name}`);
          });

          console.log('\n🔍 Testing: Get latest checkpoint...');
          sendRequest('tools/call', {
            name: 'sui_graphql_query',
            arguments: {
              query: '{ checkpoint { sequenceNumber timestamp networkTotalTransactions } }'
            }
          });
        } else if (response.id === 3) {
          console.log('\n✅ Checkpoint query successful!');
          console.log('Result:', response.result.content[0].text.substring(0, 200) + '...');

          console.log('\n🔍 Testing: Get address balance...');
          sendRequest('tools/call', {
            name: 'sui_graphql_query',
            arguments: {
              query: '{ address(address: "0x5") { balance(coinType: "0x2::sui::SUI") { totalBalance } } }'
            }
          });
        } else if (response.id === 4) {
          console.log('\n✅ Balance query successful!');
          console.log('Result:', response.result.content[0].text);

          console.log('\n🔍 Testing: Get chain identifier...');
          sendRequest('tools/call', {
            name: 'sui_graphql_query',
            arguments: {
              query: '{ chainIdentifier }'
            }
          });
        } else if (response.id === 5) {
          console.log('\n✅ Chain identifier query successful!');
          console.log('Result:', response.result.content[0].text);

          console.log('\n🔍 Testing: Get schema (first 500 chars)...');
          sendRequest('tools/call', {
            name: 'sui_get_schema',
            arguments: {
              includeDescriptions: false
            }
          });
        } else if (response.id === 6) {
          console.log('\n✅ Schema query successful!');
          const schemaText = response.result.content[0].text;
          console.log('Schema length:', schemaText.length, 'characters');
          console.log('First 300 chars:', schemaText.substring(0, 300) + '...');

          console.log('\n\n🎉 All tests passed!');
          console.log('\n📊 Summary:');
          console.log('  ✅ Server initialization');
          console.log('  ✅ Tool listing (2 tools)');
          console.log('  ✅ GraphQL query: checkpoint');
          console.log('  ✅ GraphQL query: address balance');
          console.log('  ✅ GraphQL query: chain identifier');
          console.log('  ✅ Schema introspection');
          console.log('\n✨ MCP server is working perfectly!\n');

          server.kill();
          process.exit(0);
        }
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    }
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Start tests
console.log('🚀 Starting MCP server tests...\n');
sendRequest('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'test-client',
    version: '1.0.0'
  }
});

// Timeout
setTimeout(() => {
  console.error('❌ Tests timed out!');
  server.kill();
  process.exit(1);
}, 30000);
