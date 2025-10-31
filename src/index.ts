#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "graphql-request";

// Default to Sui testnet, but allow configuration via environment variable
const SUI_GRAPHQL_URL = process.env.SUI_GRAPHQL_URL || "https://graphql.testnet.sui.io/graphql";

// Initialize GraphQL client
const client = new GraphQLClient(SUI_GRAPHQL_URL);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "sui_get_address",
    description: "Look up an account by its Sui address. Returns address details including owned objects, balances, and transactions.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The Sui address to look up (32-byte hex string with 0x prefix)",
        },
        rootVersion: {
          type: "number",
          description: "Optional: For nested dynamic field accesses, fetch at or before this version",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "sui_get_object",
    description: "Fetch an object by its address. Can fetch at specific versions or checkpoints.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The object's address (32-byte hex string with 0x prefix)",
        },
        version: {
          type: "number",
          description: "Optional: Fetch the object at this exact version",
        },
        rootVersion: {
          type: "number",
          description: "Optional: Fetch at latest version at or before this version",
        },
        atCheckpoint: {
          type: "number",
          description: "Optional: Fetch at the latest version as of this checkpoint",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "sui_get_transaction",
    description: "Fetch a transaction by its digest.",
    inputSchema: {
      type: "object",
      properties: {
        digest: {
          type: "string",
          description: "The transaction digest (Base58-encoded hash)",
        },
      },
      required: ["digest"],
    },
  },
  {
    name: "sui_get_checkpoint",
    description: "Fetch a checkpoint by its sequence number, or the latest checkpoint if not specified.",
    inputSchema: {
      type: "object",
      properties: {
        sequenceNumber: {
          type: "number",
          description: "Optional: The checkpoint sequence number. If omitted, returns latest checkpoint.",
        },
      },
    },
  },
  {
    name: "sui_get_epoch",
    description: "Fetch an epoch by its ID, or the latest epoch if not specified.",
    inputSchema: {
      type: "object",
      properties: {
        epochId: {
          type: "number",
          description: "Optional: The epoch ID. If omitted, returns latest epoch.",
        },
      },
    },
  },
  {
    name: "sui_get_coin_metadata",
    description: "Fetch metadata for a coin type (name, symbol, decimals, etc).",
    inputSchema: {
      type: "object",
      properties: {
        coinType: {
          type: "string",
          description: "The coin type (e.g., '0x2::sui::SUI')",
        },
      },
      required: ["coinType"],
    },
  },
  {
    name: "sui_get_balance",
    description: "Get the balance for a specific coin type owned by an address.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The owner's Sui address",
        },
        coinType: {
          type: "string",
          description: "The coin type (e.g., '0x2::sui::SUI')",
        },
      },
      required: ["address", "coinType"],
    },
  },
  {
    name: "sui_get_balances",
    description: "Get all balances owned by an address, grouped by coin type.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The owner's Sui address",
        },
        first: {
          type: "number",
          description: "Optional: Number of results to return (for pagination)",
        },
        after: {
          type: "string",
          description: "Optional: Cursor for pagination",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "sui_query_objects",
    description: "Query objects owned by an address, optionally filtered by type.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The owner's Sui address",
        },
        first: {
          type: "number",
          description: "Optional: Number of results to return (for pagination)",
        },
        after: {
          type: "string",
          description: "Optional: Cursor for pagination",
        },
        filter: {
          type: "object",
          description: "Optional: Filter criteria (e.g., { type: '0x2::coin::Coin' })",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "sui_query_transactions",
    description: "Query transactions, optionally filtered. Can be scoped to an address or network-wide.",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Optional: Address to scope the query to (defaults to SENT relation if provided)",
        },
        first: {
          type: "number",
          description: "Optional: Number of results to return (for pagination)",
        },
        after: {
          type: "string",
          description: "Optional: Cursor for pagination",
        },
        filter: {
          type: "object",
          description: "Optional: Filter criteria",
        },
      },
    },
  },
  {
    name: "sui_query_events",
    description: "Query events emitted in the network, optionally filtered.",
    inputSchema: {
      type: "object",
      properties: {
        first: {
          type: "number",
          description: "Optional: Number of results to return (for pagination)",
        },
        after: {
          type: "string",
          description: "Optional: Cursor for pagination",
        },
        filter: {
          type: "object",
          description: "Optional: Event filter criteria",
        },
      },
    },
  },
  {
    name: "sui_simulate_transaction",
    description: "Simulate a transaction to preview its effects without executing it on chain.",
    inputSchema: {
      type: "object",
      properties: {
        transaction: {
          type: "object",
          description: "Transaction data in JSON format or BCS-encoded { bcs: { value: '<base64>' } }",
        },
      },
      required: ["transaction"],
    },
  },
  {
    name: "sui_get_chain_identifier",
    description: "Get the chain identifier (first 4 bytes of genesis checkpoint digest, hex-encoded).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "sui_get_type",
    description: "Fetch a structured representation of a concrete type, including its layout information.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "The type string (e.g., '0x2::coin::Coin<0x2::sui::SUI>')",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "sui_graphql_query",
    description: "Execute a custom GraphQL query against the Sui GraphQL endpoint. Use this for advanced queries not covered by other tools.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The GraphQL query string",
        },
        variables: {
          type: "object",
          description: "Optional: Variables for the GraphQL query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "sui_get_schema",
    description: "Get the GraphQL schema introspection to explore all available types and queries.",
    inputSchema: {
      type: "object",
      properties: {
        includeDescription: {
          type: "boolean",
          description: "Whether to include descriptions in the schema output (default: true)",
        },
      },
    },
  },
];

// Create server instance
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

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handler for tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "sui_get_address": {
        const query = `
          query GetAddress($address: SuiAddress!, $rootVersion: UInt53) {
            address(address: $address, rootVersion: $rootVersion) {
              address
              balance(coinType: "0x2::sui::SUI") {
                totalBalance
              }
              objects(first: 10) {
                nodes {
                  address
                  version
                  digest
                }
              }
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_object": {
        const query = `
          query GetObject($address: SuiAddress!, $version: UInt53, $rootVersion: UInt53, $atCheckpoint: UInt53) {
            object(address: $address, version: $version, rootVersion: $rootVersion, atCheckpoint: $atCheckpoint) {
              address
              version
              digest
              owner {
                __typename
                ... on AddressOwner {
                  address {
                    address
                  }
                }
                ... on Immutable {
                  _
                }
                ... on Parent {
                  parent {
                    address
                  }
                }
                ... on Shared {
                  initialSharedVersion
                }
              }
              contents {
                type {
                  repr
                }
                json
              }
              moveObjectBcs
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_transaction": {
        const query = `
          query GetTransaction($digest: String!) {
            transaction(digest: $digest) {
              digest
              sender {
                address
              }
              gasInput {
                gasSponsor {
                  address
                }
                gasPrice
                gasBudget
              }
              kind {
                __typename
              }
              signatures
              effects {
                status
                errors
                timestamp
                checkpoint {
                  sequenceNumber
                }
                gasEffects {
                  gasObject {
                    address
                  }
                  gasSummary {
                    computationCost
                    storageCost
                    storageRebate
                    nonRefundableStorageFee
                  }
                }
              }
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_checkpoint": {
        const query = args?.sequenceNumber
          ? `
              query GetCheckpoint($sequenceNumber: UInt53!) {
                checkpoint(sequenceNumber: $sequenceNumber) {
                  sequenceNumber
                  digest
                  timestamp
                  epoch {
                    epochId
                  }
                  networkTotalTransactions
                  rollingGasSummary {
                    computationCost
                    storageCost
                    storageRebate
                  }
                }
              }
            `
          : `
              query GetLatestCheckpoint {
                checkpoint {
                  sequenceNumber
                  digest
                  timestamp
                  epoch {
                    epochId
                  }
                  networkTotalTransactions
                  rollingGasSummary {
                    computationCost
                    storageCost
                    storageRebate
                  }
                }
              }
            `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_epoch": {
        const query = args?.epochId
          ? `
              query GetEpoch($epochId: UInt53!) {
                epoch(epochId: $epochId) {
                  epochId
                  protocolConfigs {
                    protocolVersion
                  }
                  startTimestamp
                  endTimestamp
                  totalGasFees
                  totalStakeRewards
                  fundSize
                  referenceGasPrice
                }
              }
            `
          : `
              query GetLatestEpoch {
                epoch {
                  epochId
                  protocolConfigs {
                    protocolVersion
                  }
                  startTimestamp
                  endTimestamp
                  totalGasFees
                  totalStakeRewards
                  fundSize
                  referenceGasPrice
                }
              }
            `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_coin_metadata": {
        const query = `
          query GetCoinMetadata($coinType: String!) {
            coinMetadata(coinType: $coinType) {
              decimals
              name
              description
              iconUrl
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_balance": {
        const query = `
          query GetBalance($address: SuiAddress!, $coinType: String!) {
            address(address: $address) {
              balance(coinType: $coinType) {
                coinType {
                  repr
                }
                totalBalance
              }
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_balances": {
        const query = `
          query GetBalances($address: SuiAddress!, $first: Int, $after: String) {
            address(address: $address) {
              balances(first: $first, after: $after) {
                edges {
                  node {
                    coinType {
                      repr
                    }
                    totalBalance
                  }
                  cursor
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_query_objects": {
        const query = `
          query QueryObjects($address: SuiAddress!, $first: Int, $after: String, $filter: ObjectFilter) {
            address(address: $address) {
              objects(first: $first, after: $after, filter: $filter) {
                edges {
                  node {
                    address
                    version
                    digest
                    contents {
                      type {
                        repr
                      }
                      json
                    }
                  }
                  cursor
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_query_transactions": {
        const query = args?.address
          ? `
              query QueryTransactionsByAddress($address: SuiAddress!, $first: Int, $after: String, $filter: TransactionFilter) {
                address(address: $address) {
                  transactions(first: $first, after: $after, filter: $filter) {
                    edges {
                      node {
                        digest
                        sender {
                          address
                        }
                        effects {
                          status
                          timestamp
                        }
                      }
                      cursor
                    }
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                  }
                }
              }
            `
          : `
              query QueryTransactions($first: Int, $after: String, $filter: TransactionFilter) {
                transactions(first: $first, after: $after, filter: $filter) {
                  edges {
                    node {
                      digest
                      sender {
                        address
                      }
                      effects {
                        status
                        timestamp
                      }
                    }
                    cursor
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_query_events": {
        const query = `
          query QueryEvents($first: Int, $after: String, $filter: EventFilter) {
            events(first: $first, after: $after, filter: $filter) {
              edges {
                node {
                  sendingModule {
                    package {
                      address
                    }
                    name
                  }
                  type {
                    repr
                  }
                  sender {
                    address
                  }
                  timestamp
                  json
                }
                cursor
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_simulate_transaction": {
        const query = `
          query SimulateTransaction($transaction: JSON!) {
            simulateTransaction(transaction: $transaction) {
              effects {
                status
                errors
                gasEffects {
                  gasSummary {
                    computationCost
                    storageCost
                    storageRebate
                    nonRefundableStorageFee
                  }
                }
                balanceChanges {
                  edges {
                    node {
                      owner {
                        address
                      }
                      amount
                      coinType {
                        repr
                      }
                    }
                  }
                }
                objectChanges {
                  edges {
                    node {
                      address
                      idCreated
                      idDeleted
                    }
                  }
                }
              }
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_chain_identifier": {
        const query = `
          query GetChainIdentifier {
            chainIdentifier
          }
        `;
        const data = await client.request(query);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_type": {
        const query = `
          query GetType($type: String!) {
            type(type: $type) {
              repr
              signature
              layout
            }
          }
        `;
        const data = await client.request(query, args);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_graphql_query": {
        const { query, variables } = args as { query: string; variables?: Record<string, unknown> };
        const data = await client.request(query, variables);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "sui_get_schema": {
        const includeDesc = args?.includeDescription !== false;
        const query = `
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
                      }
                    }
                  }
                  type {
                    name
                    kind
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
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        `;
        const data = await client.request(query);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Sui GraphQL MCP server running on ${SUI_GRAPHQL_URL}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
