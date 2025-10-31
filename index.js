#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "graphql-request";

// Configuration
const SUI_GRAPHQL_URL = process.env.SUI_GRAPHQL_URL || "https://graphql.testnet.sui.io/graphql";
const NETWORK = SUI_GRAPHQL_URL.includes('mainnet') ? 'Mainnet' : SUI_GRAPHQL_URL.includes('devnet') ? 'Devnet' : 'Testnet';
const MAX_RESPONSE_CHARS = 80000; // ~20,000 tokens (4 chars per token)
const TRUNCATION_WARNING = "\n\n[Response truncated due to size limits. Use pagination (first/last), filters, or request fewer fields to get complete results.]";

// Client and cache
const client = new GraphQLClient(SUI_GRAPHQL_URL);
let cachedSchema = null;

// Define tools
const TOOLS = [
  {
    name: "sui_graphql_query",
    description: `Execute GraphQL queries against the Sui ${NETWORK} blockchain.

**WORKFLOW:**
1. **FIRST TIME ONLY**: Call \`sui_get_schema\` to understand available queries and fields
2. **THEN**: Construct and execute your GraphQL queries based on the schema

**Core Queries:**
- \`address(address: String!)\` - Get account info, balances, objects, transactions
- \`object(address: String!)\` - Fetch object details with version/checkpoint support
- \`transaction(digest: String!)\` - Get transaction details and effects
- \`checkpoint(sequenceNumber: Int)\` - Get checkpoint data (omit for latest)
- \`epoch(epochId: Int)\` - Get epoch information (omit for latest)
- \`coinMetadata(coinType: String!)\` - Get coin metadata (name, symbol, decimals)
- \`events(filter: EventFilter)\` - Query emitted events
- \`transactions(filter: TransactionFilter)\` - Query transactions
- \`chainIdentifier\` - Get network chain ID
- \`simulateTransaction(transaction: JSON!)\` - Dry-run a transaction without executing it

**Transaction Simulation:**
The \`simulateTransaction\` query accepts a JSON transaction matching the [Sui gRPC API schema](https://docs.sui.io/references/fullnode-protocol#sui-rpc-v2-Transaction).
The JSON format allows for partial transaction specification where certain fields can be automatically resolved by the server.

Alternatively, for already serialized transactions, you can pass BCS-encoded data:
\`{"bcs": {"value": "<base64>"}}\`

Unlike \`executeTransaction\`, this does not require signatures since the transaction is not committed to the blockchain. This allows for previewing transaction effects, estimating gas costs, and testing transaction logic without spending gas or requiring valid signatures.

Example simulation query:
\`\`\`graphql
query SimulateTransaction($tx: JSON!) {
  simulateTransaction(transaction: $tx) {
    effects {
      status
      gasEffects {
        gasSummary {
          computationCost
          storageCost
          storageRebate
          nonRefundableStorageFee
        }
      }
    }
    error
  }
}
\`\`\`

**Transaction Execution:**
Use the \`executeTransaction\` mutation for on-chain execution. This requires:
- \`transactionDataBcs\`: Serialized unsigned transaction data (Base64-encoded BCS)
- \`signatures\`: Array of cryptographic signatures

Transaction data can be generated using Sui CLI:
\`sui client call --serialize-unsigned-transaction\`

Signatures are generated using:
\`sui keytool sign --data <tx-data>\`

**CRITICAL - Response Size Limits:**
Responses are limited to ~20,000 tokens. To avoid truncation:
- **ALWAYS use pagination** for list queries: \`first: 5-10\` (start small!)
- **Request only needed fields** - avoid large nested objects like \`contents\` unless necessary
- **Use filters** to narrow results
- Large responses will be automatically truncated with a warning

**Examples:**
\`\`\`graphql
# Get latest checkpoint
{ checkpoint { sequenceNumber timestamp networkTotalTransactions } }

# Get address balance
{ address(address: "0x5") { balance(coinType: "0x2::sui::SUI") { totalBalance } } }

# Query recent transactions (ALWAYS use first/last limits!)
{ transactions(first: 5) { nodes { digest sender { address } } } }

# Get object (be careful with contents field - can be large!)
{ object(address: "0x5") { version digest } }
\`\`\``,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "GraphQL query string",
        },
        variables: {
          type: "object",
          description: "Optional query variables as JSON object",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "sui_get_schema",
    description: `Get the Sui GraphQL schema to understand all available queries and their arguments.

**When to use:**
- **First time querying** - Call this BEFORE making any queries to understand available fields
- When you need to know what arguments a query accepts
- When exploring new query types

Returns schema introspection including:
- All query operations and their arguments
- Argument types and whether they're required

**Note:** Set includeDescriptions to true for detailed field documentation (significantly increases response size).`,
    inputSchema: {
      type: "object",
      properties: {
        includeDescriptions: {
          type: "boolean",
          description: "Include field descriptions (default: false). Warning: enabling this significantly increases response size.",
        },
      },
    },
  },
];

// Create server
const server = new Server(
  {
    name: "sui-graphql-mcp",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to format and truncate responses
function formatResponse(data) {
  const response = JSON.stringify(data);
  return response.length > MAX_RESPONSE_CHARS
    ? response.substring(0, MAX_RESPONSE_CHARS) + TRUNCATION_WARNING
    : response;
}

// Tool handlers
const handlers = {
  sui_graphql_query: async ({ query, variables }) => {
    const data = await client.request(query, variables);
    return formatResponse(data);
  },

  sui_get_schema: async (args) => {
    const includeDesc = args?.includeDescriptions === true;

    if (cachedSchema && !includeDesc) {
      return formatResponse(cachedSchema);
    }

    const schemaQuery = `
      query GetSchema {
        __schema {
          queryType {
            name
            ${includeDesc ? "description" : ""}
            fields {
              name
              ${includeDesc ? "description" : ""}
              args {
                name
                ${includeDesc ? "description" : ""}
                type { name kind }
              }
              type { name kind }
            }
          }
        }
      }
    `;

    const schema = await client.request(schemaQuery);
    if (!includeDesc) cachedSchema = schema;

    return formatResponse(schema);
  }
};

// Request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const handler = handlers[name];
    if (!handler) throw new Error(`Unknown tool: ${name}`);

    const text = await handler(args);
    return { content: [{ type: "text", text }] };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error?.message ?? String(error)}` }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Sui GraphQL MCP server running on ${NETWORK}`);
  console.error(`Endpoint: ${SUI_GRAPHQL_URL}`);
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
