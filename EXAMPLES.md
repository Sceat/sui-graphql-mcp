# Sui GraphQL MCP Usage Examples

This document provides practical examples of using the Sui GraphQL MCP server with Claude.

## Setup

After configuring the MCP server in Claude Desktop, you can use natural language to interact with Sui blockchain data.

## Example Queries

### 1. Get Latest Checkpoint

**Request to Claude:**
```
What's the latest checkpoint on Sui testnet?
```

Claude will use `sui_get_checkpoint` without parameters.

**Expected Result:**
- Checkpoint sequence number
- Timestamp
- Network total transactions
- Gas summary

---

### 2. Look Up an Address

**Request to Claude:**
```
Look up the Sui address 0x5
```

Claude will use `sui_get_address` with the address parameter.

**Expected Result:**
- Address details
- SUI balance
- Owned objects (first 10)

---

### 3. Get SUI Balance

**Request to Claude:**
```
What's the SUI balance for address 0x5?
```

Claude will use `sui_get_balance` with:
- address: "0x5"
- coinType: "0x2::sui::SUI"

**Expected Result:**
- Total SUI balance in MIST (1 SUI = 1,000,000,000 MIST)

---

### 4. Get All Balances for an Address

**Request to Claude:**
```
Show me all coin balances for address 0x1234...
```

Claude will use `sui_get_balances`.

**Expected Result:**
- List of all coin types owned
- Balance for each coin type

---

### 5. Query Objects Owned by Address

**Request to Claude:**
```
Show me the first 5 objects owned by address 0x5
```

Claude will use `sui_query_objects` with:
- address: "0x5"
- first: 5

**Expected Result:**
- Object addresses
- Versions
- Types
- Contents (JSON representation)

---

### 6. Get Transaction Details

**Request to Claude:**
```
Get details for transaction <digest>
```

Claude will use `sui_get_transaction` with the digest.

**Expected Result:**
- Transaction sender
- Gas info
- Transaction kind
- Effects (status, timestamp, gas costs)

---

### 7. Query Recent Transactions

**Request to Claude:**
```
Show me the 10 most recent transactions on Sui testnet
```

Claude will use `sui_query_transactions` with:
- first: 10

**Expected Result:**
- List of recent transactions with digests, senders, status

---

### 8. Get Coin Metadata

**Request to Claude:**
```
What are the details of the SUI coin?
```

Claude will use `sui_get_coin_metadata` with:
- coinType: "0x2::sui::SUI"

**Expected Result:**
- Name: "Sui"
- Decimals: 9
- Description
- Icon URL

---

### 9. Query Events

**Request to Claude:**
```
Show me the 5 most recent events on Sui testnet
```

Claude will use `sui_query_events` with:
- first: 5

**Expected Result:**
- Event types
- Emitting modules
- Timestamps
- Event data (JSON)

---

### 10. Get Current Epoch

**Request to Claude:**
```
What epoch is Sui testnet currently in?
```

Claude will use `sui_get_epoch` without parameters.

**Expected Result:**
- Epoch ID
- Protocol version
- Start/end timestamps
- Gas fees and stake rewards
- Reference gas price

---

### 11. Get Chain Identifier

**Request to Claude:**
```
What's the chain identifier for this network?
```

Claude will use `sui_get_chain_identifier`.

**Expected Result:**
- 8-character hex string (first 4 bytes of genesis checkpoint digest)

---

### 12. Get Type Information

**Request to Claude:**
```
Show me the structure of the type 0x2::coin::Coin<0x2::sui::SUI>
```

Claude will use `sui_get_type`.

**Expected Result:**
- Type representation
- Type signature
- Layout information

---

### 13. Simulate Transaction

**Request to Claude:**
```
Simulate this transaction: <transaction JSON>
```

Claude will use `sui_simulate_transaction`.

**Expected Result:**
- Transaction effects
- Gas costs
- Balance changes
- Object changes
- Success/failure status

---

### 14. Explore GraphQL Schema

**Request to Claude:**
```
What operations are available in the Sui GraphQL API?
```

Claude will use `sui_get_schema`.

**Expected Result:**
- Complete schema with all query types
- Available fields and arguments
- Type information

---

### 15. Custom GraphQL Query

**Request to Claude:**
```
Execute this GraphQL query: { chainIdentifier }
```

Claude will use `sui_graphql_query` with:
- query: "{ chainIdentifier }"

**Expected Result:**
- Raw GraphQL response

---

## Advanced Examples

### Filter Objects by Type

**Request:**
```
Show me all Coin objects owned by address 0x5
```

Claude will use `sui_query_objects` with:
- address: "0x5"
- filter: { "type": "0x2::coin::Coin" }

### Query Transactions for Specific Address

**Request:**
```
Show me transactions sent by address 0x1234...
```

Claude will use `sui_query_transactions` with:
- address: "0x1234..."
- This automatically filters to transactions sent by that address

### Pagination

**Request:**
```
Show me the next 10 objects after cursor XYZ for address 0x5
```

Claude will use `sui_query_objects` with:
- address: "0x5"
- first: 10
- after: "XYZ"

---

## Multi-Step Workflows

### Complete Address Analysis

**Request:**
```
Give me a complete analysis of address 0x5: balances, recent transactions, and owned objects
```

Claude will:
1. Use `sui_get_balances` to get all balances
2. Use `sui_query_transactions` to get recent transactions
3. Use `sui_query_objects` to list owned objects

### Transaction Deep Dive

**Request:**
```
Analyze transaction <digest> including all object changes
```

Claude will:
1. Use `sui_get_transaction` to get transaction details
2. Parse the effects to identify changed objects
3. Optionally use `sui_get_object` for each changed object

---

## Tips

1. **Addresses**: All Sui addresses are 32-byte hex strings with `0x` prefix
2. **Pagination**: Use `first` and `after` parameters for large result sets
3. **Coin Types**: Standard format is `package::module::type` (e.g., `0x2::sui::SUI`)
4. **Custom Queries**: Use `sui_graphql_query` for anything not covered by specialized tools
5. **Network Switching**: Set `SUI_GRAPHQL_URL` environment variable to change networks

---

## Common Use Cases

### DeFi Analysis
- Query coin balances across multiple addresses
- Track transaction history for DeFi protocols
- Monitor liquidity pool events

### NFT Operations
- List all NFTs owned by an address
- Track NFT transfer events
- Query NFT metadata

### Development & Debugging
- Simulate transactions before execution
- Inspect object structures
- Debug failed transactions

### Network Monitoring
- Track checkpoint progression
- Monitor epoch changes
- Analyze gas costs and network usage
