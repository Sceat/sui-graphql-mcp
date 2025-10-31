# Quick Start Guide

Get up and running with Sui GraphQL MCP in 5 minutes.

## 1. Install

```bash
git clone https://github.com/YOUR_USERNAME/sui-graphql-mcp.git
cd sui-graphql-mcp
npm install
npm run build
```

## 2. Test

```bash
node test.js
```

Expected output:
```
✅ MCP Server is working!
Found 16 tools:
...
```

## 3. Get Your Path

```bash
pwd
```

Copy the output - you'll need it for the config.

## 4. Configure Claude Code

Edit your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this (replace the path with yours from step 3):

```json
{
  "mcpServers": {
    "sui-graphql": {
      "command": "node",
      "args": ["/YOUR/PATH/FROM/STEP3/dist/index.js"],
      "env": {
        "SUI_GRAPHQL_URL": "https://graphql.testnet.sui.io/graphql"
      }
    }
  }
}
```

## 5. Restart Claude Code

Completely quit and restart Claude Code.

## 6. Test in Claude

Ask Claude:
```
What tools do you have for Sui blockchain?
```

Then try:
```
What's the latest checkpoint on Sui testnet?
```

## Network Switching

### To use Mainnet instead:
```json
"SUI_GRAPHQL_URL": "https://graphql.mainnet.sui.io/graphql"
```

### To use Devnet:
```json
"SUI_GRAPHQL_URL": "https://graphql.devnet.sui.io/graphql"
```

Remember to restart Claude Code after changing the config.

## Common Issues

**"Server not found"**
- Check the path in your config is absolute and correct
- Make sure `dist/index.js` exists (run `npm run build`)

**"Connection refused"**
- Test the endpoint: `curl -X POST https://graphql.testnet.sui.io/graphql -H "Content-Type: application/json" -d '{"query":"{ chainIdentifier }"}'`

**"Wrong network"**
- Verify `SUI_GRAPHQL_URL` in your config
- Restart Claude Code

## Example Queries

Once set up, you can ask Claude:

- "What's the chain identifier?"
- "Show me the balance of address 0x5"
- "Get the latest epoch information"
- "List recent transactions"
- "What is the SUI coin metadata?"

That's it! Check [README.md](README.md) for full documentation.
