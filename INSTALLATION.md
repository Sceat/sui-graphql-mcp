# Installation Guide

## Prerequisites

- Node.js 18 or higher
- Claude Code installed
- Git (for cloning)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/sui-graphql-mcp.git
cd sui-graphql-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Test (Optional but Recommended)

```bash
node test.js
```

You should see:
```
✅ MCP Server is working!
Found 16 tools:
...
```

### 5. Configure Claude Code

Get the absolute path to your installation:

```bash
pwd
# Copy this path
```

Edit your Claude Code configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "sui-graphql": {
      "command": "node",
      "args": ["/absolute/path/to/sui-graphql-mcp/dist/index.js"],
      "env": {
        "SUI_GRAPHQL_URL": "https://graphql.testnet.sui.io/graphql"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/sui-graphql-mcp` with your actual path from step 5.

### 6. Restart Claude Code

Completely quit and restart Claude Code to load the MCP server.

## Network Configuration

### Testnet (Default)
```json
"SUI_GRAPHQL_URL": "https://graphql.testnet.sui.io/graphql"
```

### Mainnet
```json
"SUI_GRAPHQL_URL": "https://graphql.mainnet.sui.io/graphql"
```

### Devnet
```json
"SUI_GRAPHQL_URL": "https://graphql.devnet.sui.io/graphql"
```

### Custom Endpoint
```json
"SUI_GRAPHQL_URL": "https://your-custom-endpoint.com/graphql"
```

## Verification

After restarting Claude Code, test with:

```
Ask Claude: "What tools do you have for Sui blockchain?"
```

Claude should list 16 Sui GraphQL tools.

Then try:
```
Ask Claude: "What's the latest checkpoint on Sui testnet?"
```

## Troubleshooting

### Node.js Not Found
Install Node.js from [nodejs.org](https://nodejs.org/) (version 18 or higher).

### Build Fails
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Server Not Loading in Claude
1. Check the path in your config is absolute and correct
2. Verify `dist/index.js` exists
3. Restart Claude Code completely (quit, don't just reload)
4. Check Claude Code logs for errors

### Wrong Network
1. Update `SUI_GRAPHQL_URL` in your config
2. Save the file
3. Restart Claude Code

## Updating

To update to the latest version:

```bash
cd sui-graphql-mcp
git pull
npm install
npm run build
# Restart Claude Code
```

## Uninstalling

1. Remove the `sui-graphql` entry from your Claude Code config
2. Restart Claude Code
3. Delete the installation directory:
   ```bash
   rm -rf sui-graphql-mcp
   ```
