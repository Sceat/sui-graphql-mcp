# Sui GraphQL MCP Server

Query the Sui blockchain directly from Claude using GraphQL.

## Installation

```bash
claude mcp add sui-graphql https://github.com/Sceat/sui-graphql-mcp.git
```

That's it! Claude Code will automatically install and configure the server.

## Usage

After installation, you can ask Claude things like:

```
"What's the latest checkpoint on Sui?"
"Show me the balance of address 0x5"
"Get transaction details for <digest>"
"Query the 10 most recent transactions"
```

Claude will automatically construct and execute the appropriate GraphQL queries.

## How It Works

This MCP server provides Claude with access to the Sui GraphQL API through two intelligent tools:

### `sui_graphql_query`
Execute any GraphQL query against Sui blockchain. The tool description includes common query patterns and guides Claude to construct proper queries.

### `sui_get_schema`
Get the complete GraphQL schema so Claude understands all available data and fields.

## Network Configuration

By default, connects to **Sui Testnet**. To use **Mainnet**:

```bash
claude mcp update sui-graphql --env SUI_GRAPHQL_URL=https://graphql.mainnet.sui.io/graphql
```

Available networks:
- Testnet: `https://graphql.testnet.sui.io/graphql` (default)
- Mainnet: `https://graphql.mainnet.sui.io/graphql`

## Example Queries

Claude can query:
- **Addresses**: Account info, balances, owned objects
- **Transactions**: Search, filter, analyze transaction data
- **Objects**: Fetch object details with version/checkpoint support
- **Checkpoints**: Network consensus data
- **Epochs**: Epoch information and statistics
- **Events**: Query emitted events with filters
- **Coins**: Metadata, balances, supply
- **Types**: Move type structures and layouts

## Manual Installation

If you prefer manual setup:

```bash
git clone https://github.com/Sceat/sui-graphql-mcp.git
cd sui-graphql-mcp
npm install
npm run build
```

Then add to your Claude Code config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sui-graphql": {
      "command": "node",
      "args": ["/path/to/sui-graphql-mcp/dist/index.js"],
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
