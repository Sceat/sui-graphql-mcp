# How MCP Servers Work

## Architecture Overview

MCP (Model Context Protocol) servers are **local processes** that extend Claude's capabilities. They run directly on your machine - no Docker, web servers, or complex infrastructure needed.

## The Communication Flow

```
┌───────────────────────────────────────────────────────────────┐
│                      Claude Desktop                           │
│  - User types: "What's the latest Sui checkpoint?"           │
│  - Claude decides to use sui_get_checkpoint tool             │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    │ JSON-RPC via stdin/stdout
                    │
┌───────────────────▼───────────────────────────────────────────┐
│                  MCP Server Process                           │
│  (sui-graphql-mcp running as: node dist/index.js)           │
│                                                               │
│  1. Receives tool call via stdin                             │
│  2. Executes GraphQL query                                   │
│  3. Returns result via stdout                                │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    │ HTTPS Request
                    │
┌───────────────────▼───────────────────────────────────────────┐
│              Sui GraphQL API (External)                       │
│         https://graphql.testnet.sui.io/graphql               │
│                                                               │
│  - Processes GraphQL queries                                 │
│  - Returns blockchain data                                   │
└───────────────────────────────────────────────────────────────┘
```

## Step-by-Step Example

### 1. Claude Desktop Starts Your Server

When Claude Desktop launches, it reads your config:

```json
{
  "mcpServers": {
    "sui-graphql": {
      "command": "node",
      "args": ["/path/to/dist/index.js"]
    }
  }
}
```

It spawns the process:
```bash
node /path/to/dist/index.js
```

### 2. Server Announces Its Tools

The server immediately tells Claude what tools it has:

```json
{
  "tools": [
    {
      "name": "sui_get_checkpoint",
      "description": "Fetch a checkpoint...",
      "inputSchema": { ... }
    },
    ...
  ]
}
```

### 3. User Asks Claude Something

User: *"What's the latest Sui checkpoint?"*

### 4. Claude Calls the Tool

Claude Desktop sends to the MCP server's stdin:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "sui_get_checkpoint",
    "arguments": {}
  }
}
```

### 5. Server Executes

The server:
1. Parses the request
2. Makes a GraphQL query to Sui
3. Gets the response
4. Formats it

### 6. Server Responds

Writes to stdout:

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"checkpoint\": {\"sequenceNumber\": 12345, ...}}"
      }
    ]
  }
}
```

### 7. Claude Shows Result

Claude formats and presents the data to you.

## Key Concepts

### stdin/stdout Communication

MCP servers use **standard input/output** for communication:

- **stdin (standard input)**: Claude writes requests here
- **stdout (standard output)**: Your server writes responses here
- **stderr (standard error)**: Your server writes logs here (optional)

This is the same way command-line tools work!

### Process Lifecycle

```
Claude Desktop Starts
  ↓
Spawns MCP Server Process
  ↓
Server runs in background
  ↓
Receives requests via stdin
  ↓
Sends responses via stdout
  ↓
Claude Desktop Closes → Server terminates
```

### Why No Docker?

Docker is useful for:
- Web servers that need to listen on ports
- Services accessed by multiple clients
- Complex deployment environments

MCP servers are:
- Single-process, single-user
- Only accessed by Claude Desktop on your machine
- Communication via stdin/stdout (not network)

**Result**: Docker adds unnecessary complexity!

## Debugging

### Check if Server is Running

When Claude Desktop is open, check if your MCP server is running:

```bash
ps aux | grep "sui-graphql-mcp"
```

You should see something like:
```
node /path/to/sui-graphql-mcp/dist/index.js
```

### View Server Logs

The server logs to stderr. Claude Desktop captures these. On macOS, you can view them:

```bash
# Check Claude Desktop logs
tail -f ~/Library/Logs/Claude/mcp*.log
```

### Manual Testing

You can test your MCP server manually:

```bash
# Start the server
node dist/index.js

# In the terminal, type (then press Enter):
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}

# Then type:
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

Or use the provided test script:
```bash
node test.js
```

## Common Questions

### Q: Do I need to keep a terminal open?
**A**: No! Claude Desktop manages the process automatically.

### Q: Can I run multiple MCP servers?
**A**: Yes! Add multiple entries to your Claude Desktop config. Each runs as a separate process.

### Q: What if the server crashes?
**A**: Claude Desktop will show an error. Check the logs. You may need to restart Claude Desktop.

### Q: Can other applications use my MCP server?
**A**: Not by default - it's designed for Claude Desktop only. But you could adapt the code to run as a web server if needed.

### Q: How do I update the server?
**A**:
1. Make changes to `src/index.ts`
2. Run `npm run build`
3. Restart Claude Desktop

### Q: Does it use my internet connection?
**A**: Yes, to make requests to the Sui GraphQL API. The MCP protocol itself is local-only.

## Security

### Local-Only by Design

- MCP servers run on **your machine**
- Communication is via **stdin/stdout** (no network ports)
- Only **Claude Desktop** can interact with them
- No exposure to the internet

### Outbound Requests

Your Sui GraphQL MCP server makes **HTTPS requests** to:
- `graphql.testnet.sui.io` (or mainnet/devnet)

These are standard, secure HTTPS connections.

## Performance

### Startup Time

- MCP servers start when Claude Desktop launches
- Usually takes <1 second
- Stays running until Claude Desktop closes

### Request Latency

Typical flow:
1. Claude → MCP Server: <1ms (local)
2. MCP Server → Sui API: 100-500ms (network)
3. MCP Server → Claude: <1ms (local)

**Total**: Mostly limited by Sui API response time.

## Advanced: Multiple Networks

You can run multiple instances for different networks:

```json
{
  "mcpServers": {
    "sui-testnet": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "SUI_GRAPHQL_URL": "https://graphql.testnet.sui.io/graphql"
      }
    },
    "sui-mainnet": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "SUI_GRAPHQL_URL": "https://graphql.mainnet.sui.io/graphql"
      }
    }
  }
}
```

Claude will have access to tools from both servers!

## Comparison: MCP Server vs Traditional Server

### Traditional Web Server (Docker)
```
┌──────────┐     HTTP      ┌──────────┐
│  Client  │ ──────────────→│  Docker  │
│ (Browser)│ ←──────────────│Container │
└──────────┘   Port 8080    └──────────┘
- Needs Docker
- Exposes network port
- Multiple clients
- Complex deployment
```

### MCP Server (No Docker)
```
┌────────────┐   stdin/stdout   ┌──────────┐
│   Claude   │ ─────────────────→│  Node.js │
│  Desktop   │ ←─────────────────│ Process  │
└────────────┘                   └──────────┘
- Just Node.js
- No network ports
- Single client (Claude)
- Simple: npm run build
```

## Summary

MCP servers are **lightweight, local processes** that:
- ✅ Run directly on your machine (no containers)
- ✅ Communicate via stdin/stdout (no network ports)
- ✅ Are managed by Claude Desktop (no manual startup)
- ✅ Extend Claude with custom capabilities
- ✅ Are simple to develop and deploy

For the Sui GraphQL MCP server specifically:
1. It's a Node.js process
2. Claude Desktop starts it automatically
3. It translates Claude's requests into Sui GraphQL queries
4. It returns blockchain data to Claude
5. No Docker, no web server, no complexity!
