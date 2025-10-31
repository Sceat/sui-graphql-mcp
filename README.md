# Sui GraphQL MCP Server

Query the Sui blockchain directly from Claude using GraphQL.

## Installation

One command - that's it:

```bash
claude mcp add sui-graphql -- npx -y github:Sceat/sui-graphql-mcp
```

**No npm install, no build step, pure JavaScript!**

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

By default, connects to **Sui Testnet**.

To use **Mainnet** or **Devnet**, manually edit your config (`~/.claude.json`) after installation:

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
- **Transaction Simulation**: Dry-run transactions without executing them on-chain

### Transaction Simulation

The server supports transaction dry-run via the `simulateTransaction` query. This allows you to:
- Preview transaction effects before execution
- Estimate gas costs
- Test transaction logic without spending gas
- Validate transactions without requiring signatures

The simulation accepts transactions in JSON format following the [Sui gRPC API schema](https://docs.sui.io/references/fullnode-protocol#sui-rpc-v2-Transaction), with support for partial transaction specification where the server can automatically resolve certain fields.

For more details on building and executing transactions, see the [Sui GraphQL RPC documentation](https://docs.sui.io/guides/developer/advanced/graphql-rpc).

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
