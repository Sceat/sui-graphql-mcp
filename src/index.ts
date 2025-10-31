#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "graphql-request";

// Default to Sui testnet, can be configured via environment variable
// Only mainnet and testnet are available (devnet GraphQL not supported)
const SUI_GRAPHQL_URL = process.env.SUI_GRAPHQL_URL || "https://graphql.testnet.sui.io/graphql";
const NETWORK = SUI_GRAPHQL_URL.includes('mainnet') ? 'Mainnet' : 'Testnet';

// Initialize GraphQL client
const client = new GraphQLClient(SUI_GRAPHQL_URL);

// Cache schema for performance
let cachedSchema: any = null;

// MCP token limits (Claude Code has a 25,000 token limit for tool responses)
const MAX_RESPONSE_CHARS = 80000; // ~20,000 tokens (4 chars per token estimate)
const TRUNCATION_WARNING = "\n\n[Response truncated due to size limits. Use pagination (first/last), filters, or request fewer fields to get complete results.]";

// Define tools
const TOOLS: Tool[] = [
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
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to format and truncate responses
function formatResponse(data: any): string {
  // Use compact JSON (no indentation) to save tokens
  let response = JSON.stringify(data);

  // Check if response exceeds limit
  if (response.length > MAX_RESPONSE_CHARS) {
    // Truncate and add warning
    response = response.substring(0, MAX_RESPONSE_CHARS) + TRUNCATION_WARNING;
  }

  return response;
}

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "sui_graphql_query": {
        const { query, variables } = args as { query: string; variables?: Record<string, unknown> };
        const data = await client.request(query, variables);
        return {
          content: [{ type: "text", text: formatResponse(data) }],
        };
      }

      case "sui_get_schema": {
        const includeDesc = args?.includeDescriptions === true;

        if (cachedSchema && !includeDesc) {
          return {
            content: [{ type: "text", text: formatResponse(cachedSchema) }],
          };
        }

        // Simplified schema query - just query fields without full type introspection
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
                    type {
                      name
                      kind
                    }
                  }
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        `;

        const schema: any = await client.request(schemaQuery);

        // Cache only the non-descriptive version
        if (!includeDesc) {
          cachedSchema = schema;
        }

        return {
          content: [{ type: "text", text: formatResponse(schema) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
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

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
