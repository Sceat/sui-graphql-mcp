# Sui GraphQL MCP Server

Query the Sui blockchain directly from Claude using GraphQL.

## Installation

```bash
claude mcp add sui-graphql -- npx -y github:Sceat/sui-graphql-mcp
```

## Usage

Ask Claude to query Sui blockchain data:

```
"What's the latest checkpoint on Sui?"
"Show me the balance of address 0x5"
"Get recent transactions"
"Simulate this transaction"
```

## Network Configuration

Default: **Testnet**

To use other networks, edit your config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "sui-graphql": {
      "env": {
        "SUI_GRAPHQL_URL": "https://graphql.mainnet.sui.io/graphql"
      }
    }
  }
}
```

Available networks:
- **Testnet**: `https://graphql.testnet.sui.io/graphql` (default)
- **Mainnet**: `https://graphql.mainnet.sui.io/graphql`
- **Devnet**: `https://graphql.devnet.sui.io/graphql`

## Local Development

If you want to develop or modify the server:

```bash
git clone https://github.com/Sceat/sui-graphql-mcp.git
cd sui-graphql-mcp
npm install
chmod +x index.js
```

Then add to your Claude Code config:

```json
{
  "mcpServers": {
    "sui-graphql": {
      "command": "node",
      "args": ["/path/to/sui-graphql-mcp/index.js"],
      "env": {
        "SUI_GRAPHQL_URL": "https://graphql.testnet.sui.io/graphql"
      }
    }
  }
}
```

## Requirements

- Node.js 18+
- Claude Code

## License

MIT
