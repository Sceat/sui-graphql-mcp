#!/bin/bash

# Sui GraphQL MCP Server Installation Script

set -e

echo "🚀 Installing Sui GraphQL MCP Server..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building..."
npm run build

# Test
echo "🧪 Testing..."
if node test.js > /dev/null 2>&1; then
    echo "✅ MCP server test passed"
else
    echo "⚠️  Test failed, but continuing..."
fi

echo ""
echo "✅ Installation complete!"
echo ""

# Get absolute path
INSTALL_PATH=$(pwd)

# Detect OS and set config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
else
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
fi

echo "📝 Configuration Instructions:"
echo ""
echo "Add this to your Claude Code config:"
echo "$CONFIG_PATH"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"sui-graphql\": {"
echo "      \"command\": \"node\","
echo "      \"args\": [\"$INSTALL_PATH/dist/index.js\"],"
echo "      \"env\": {"
echo "        \"SUI_GRAPHQL_URL\": \"https://graphql.testnet.sui.io/graphql\""
echo "      }"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "Then restart Claude Code."
echo ""
echo "📚 Documentation:"
echo "  - README.md for overview"
echo "  - INSTALLATION.md for detailed instructions"
echo "  - EXAMPLES.md for usage examples"
echo ""
echo "🎉 Happy querying the Sui blockchain!"
