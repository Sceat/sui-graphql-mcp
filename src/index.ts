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

// Define tools
const TOOLS: Tool[] = [
  {
    name: "sui_graphql_query",
    description: `Execute GraphQL queries against the Sui ${NETWORK} blockchain.

This is the primary tool for querying Sui blockchain data. The Sui GraphQL API provides access to:

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

**Pagination:** Most list queries support \`first\`, \`after\`, \`last\`, \`before\` for cursor-based pagination.

**Examples:**
\`\`\`graphql
# Get latest checkpoint
{ checkpoint { sequenceNumber timestamp networkTotalTransactions } }

# Get address balance
{ address(address: "0x5") { balance(coinType: "0x2::sui::SUI") { totalBalance } } }

# Query recent transactions
{ transactions(first: 5) { nodes { digest sender { address } } } }

# Get object
{ object(address: "0x5") { version contents { json } } }
\`\`\`

Use \`sui_get_schema\` to explore all available fields and types.`,
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
    description: `Get the complete Sui GraphQL schema to understand all available queries and types.

Returns full schema introspection including:
- Query operations and their arguments
- Object types and fields
- Input types for filters
- Field descriptions

Use this to explore what data is available and construct precise queries.`,
    inputSchema: {
      type: "object",
      properties: {
        includeDescriptions: {
          type: "boolean",
          description: "Include field descriptions (default: true)",
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
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_schema": {
        if (cachedSchema) {
          return {
            content: [{ type: "text", text: JSON.stringify(cachedSchema, null, 2) }],
          };
        }

        const includeDesc = args?.includeDescriptions !== false;
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
                      ofType {
                        name
                        kind
                        ofType {
                          name
                          kind
                        }
                      }
                    }
                  }
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
              }
              types {
                name
                ${includeDesc ? "description" : ""}
                kind
                fields {
                  name
                  ${includeDesc ? "description" : ""}
                  args {
                    name
                    type {
                      name
                      kind
                    }
                  }
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
                inputFields {
                  name
                  ${includeDesc ? "description" : ""}
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
              }
            }
          }
        `;

        const schema = await client.request(schemaQuery);
        cachedSchema = schema;
        return {
          content: [{ type: "text", text: JSON.stringify(schema, null, 2) }],
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
