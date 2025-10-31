# Sui GraphQL MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

A Model Context Protocol (MCP) server that provides comprehensive access to the Sui blockchain via its GraphQL API. This enables Claude to interact with Sui blockchain data including transactions, objects, balances, and more.

## Features

- **16 Specialized Tools** for Sui blockchain queries
- **Multi-Network Support**: Testnet, Mainnet, Devnet, or custom endpoints
- **Complete GraphQL Coverage**: Objects, transactions, balances, events, and more
- **Easy Installation**: One-line setup with Claude Code or manual install

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sui-graphql-mcp.git
cd sui-graphql-mcp

# Install dependencies
npm install

# Build
npm run build

# Test (optional)
node test.js
```

### Configuration for Claude Code

Add to your Claude Code MCP settings file:

**macOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sui-graphql": {
      "command": "node",
      "args": ["ABSOLUTE_PATH_TO_PROJECT/dist/index.js"],
      "env": {
        "SUI_GRAPHQL_URL": "https://graphql.testnet.sui.io/graphql"
      }
    }
  }
}
```

**Important**: Replace `ABSOLUTE_PATH_TO_PROJECT` with the full path to your installation directory.

Then restart Claude Code.

### Network Configuration

Change networks by updating the `SUI_GRAPHQL_URL` environment variable:

```json
{
  "env": {
    "SUI_GRAPHQL_URL": "https://graphql.mainnet.sui.io/graphql"  // Mainnet
    // or "https://graphql.testnet.sui.io/graphql"  // Testnet (default)
    // or "https://graphql.devnet.sui.io/graphql"   // Devnet
  }
}
```

## Available Tools

The MCP server provides 16 tools for interacting with Sui:

| Tool | Description |
|------|-------------|
| `sui_get_address` | Look up account information by address |
| `sui_get_object` | Fetch blockchain objects with version support |
| `sui_get_transaction` | Get transaction details and effects |
| `sui_get_checkpoint` | Query checkpoint information |
| `sui_get_epoch` | Get epoch data |
| `sui_get_coin_metadata` | Fetch coin metadata (name, symbol, decimals) |
| `sui_get_balance` | Get balance for specific coin type |
| `sui_get_balances` | Get all balances for an address |
| `sui_query_objects` | Query and filter objects |
| `sui_query_transactions` | Query transactions with filters |
| `sui_query_events` | Query blockchain events |
| `sui_simulate_transaction` | Simulate transactions without executing |
| `sui_get_chain_identifier` | Get network chain identifier |
| `sui_get_type` | Get type structure and layout |
| `sui_graphql_query` | Execute custom GraphQL queries |
| `sui_get_schema` | Get full GraphQL schema |

## Usage Examples

After configuration, you can ask Claude Code:

```
"What's the latest checkpoint on Sui testnet?"
"Show me the balance of address 0x5"
"Get details for transaction <digest>"
"List objects owned by address 0x1234..."
"What is the SUI coin metadata?"
```

Claude will automatically use the appropriate tools to fetch the data.

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Testing
```bash
node test.js
```

## Network Endpoints

- **Testnet**: `https://graphql.testnet.sui.io/graphql` (default)
- **Mainnet**: `https://graphql.mainnet.sui.io/graphql`
- **Devnet**: `https://graphql.devnet.sui.io/graphql`

## Documentation

- **[EXAMPLES.md](EXAMPLES.md)** - Practical usage examples
- **[INSTALLATION.md](INSTALLATION.md)** - Detailed installation guide
- **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)** - Technical architecture

## Architecture

Built with:
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **graphql-request** - Lightweight GraphQL client
- **TypeScript** - Type-safe implementation

The server runs as a local Node.js process that communicates with Claude via stdin/stdout. No Docker or complex infrastructure required.

## Troubleshooting

### "Server not found" error
- Verify the path in your config is absolute and correct
- Check that `dist/index.js` exists (run `npm run build`)
- Restart Claude Code completely

### "Connection refused" error
- Test the Sui endpoint: `curl -X POST https://graphql.testnet.sui.io/graphql -H "Content-Type: application/json" -d '{"query":"{ chainIdentifier }"}'`
- Check your network connection
- Try a different network endpoint

### Wrong network data
- Verify the `SUI_GRAPHQL_URL` in your config
- Restart Claude Code after changing configuration

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

MIT - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/sui-graphql-mcp/issues)
- **Sui Documentation**: [docs.sui.io](https://docs.sui.io)
- **MCP Documentation**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
