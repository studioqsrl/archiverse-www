#!/bin/bash

# Script to reset Auth0 tenant configuration using Auth0 Deploy CLI
# This script requires the Auth0 Deploy CLI to be installed

# Exit on error
set -e

echo "🔄 Starting Auth0 tenant reset process..."

# Check required dependencies
check_dependencies() {
    local missing_deps=0

    if ! command -v a0deploy &> /dev/null; then
        echo "❌ Auth0 Deploy CLI is not installed. Please install it first:"
        echo "npm install -g auth0-deploy-cli"
        missing_deps=1
    fi

    if ! command -v jq &> /dev/null; then
        echo "❌ jq is not installed. Please install it first:"
        echo "On macOS: brew install jq"
        echo "On Linux: sudo apt-get install jq"
        echo "On Windows: scoop install jq"
        missing_deps=1
    fi

    if [ $missing_deps -eq 1 ]; then
        exit 1
    fi
}

# Check dependencies
check_dependencies

# Function to setup config file
setup_config() {
    echo "🔑 Setting up Auth0 Deploy CLI configuration..."
    echo
    echo "You'll need to provide the following information:"
    echo "1. Your Auth0 domain (e.g., your-tenant.auth0.com)"
    echo "2. A non-interactive client ID with proper permissions"
    echo "3. The client secret"
    echo
    echo "To create a non-interactive client:"
    echo "1. Go to Applications > Applications in your Auth0 dashboard"
    echo "2. Create a new Machine to Machine Application"
    echo "3. Select the Auth0 Management API"
    echo "4. Select all permissions"
    echo

    read -p "Enter your Auth0 domain: " AUTH0_DOMAIN
    read -p "Enter your client ID: " AUTH0_CLIENT_ID
    read -s -p "Enter your client secret: " AUTH0_CLIENT_SECRET
    echo # New line after password input

    # Create config.json with provided values
    cat > "${SCRIPT_DIR}/config.json" << EOF
{
  "AUTH0_DOMAIN": "${AUTH0_DOMAIN}",
  "AUTH0_CLIENT_ID": "${AUTH0_CLIENT_ID}",
  "AUTH0_CLIENT_SECRET": "${AUTH0_CLIENT_SECRET}",
  "AUTH0_ALLOW_DELETE": true
}
EOF
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create empty tenant directory structure
echo "Creating empty tenant configuration..."
mkdir -p "${SCRIPT_DIR}/tenant"
mkdir -p "${SCRIPT_DIR}/tenant/database-connections"
mkdir -p "${SCRIPT_DIR}/tenant/clients"
mkdir -p "${SCRIPT_DIR}/tenant/resource-servers"
mkdir -p "${SCRIPT_DIR}/tenant/rules"
mkdir -p "${SCRIPT_DIR}/tenant/hooks"
mkdir -p "${SCRIPT_DIR}/tenant/actions"
mkdir -p "${SCRIPT_DIR}/tenant/pages"

# Create tenant settings
cat > "${SCRIPT_DIR}/tenant/tenant.json" << 'EOF'
{
  "friendly_name": "My Auth0 Tenant",
  "picture_url": "",
  "support_email": "",
  "support_url": ""
}
EOF

# Create default database connection
cat > "${SCRIPT_DIR}/tenant/database-connections/Username-Password-Authentication.json" << 'EOF'
{
  "name": "Username-Password-Authentication",
  "strategy": "auth0",
  "enabled_clients": []
}
EOF

# Confirm before proceeding
echo
echo "⚠️  WARNING: This script will reset your Auth0 tenant configuration."
echo "This includes deleting all custom clients, APIs, connections, rules, and hooks."
echo "This action cannot be undone."
echo
read -p "Are you sure you want to proceed? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Operation cancelled."
    rm "${SCRIPT_DIR}/tenant.json"
    exit 0
fi

echo "🗑️  Deploying empty configuration..."


# Function to validate config
validate_config() {
    local config_file="$1"
    # Check if all required fields are non-empty
    if jq -e '.AUTH0_DOMAIN != "" and .AUTH0_CLIENT_ID != "" and .AUTH0_CLIENT_SECRET != ""' "$config_file" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Check and setup config
CONFIG_PATH="${SCRIPT_DIR}/config.json"
if [ -f "$CONFIG_PATH" ] && [ -s "$CONFIG_PATH" ]; then
    echo "Found existing config.json"
    if validate_config "$CONFIG_PATH"; then
        echo "✅ Using existing Auth0 credentials"
    else
        echo "❌ Existing config.json is invalid or incomplete"
        setup_config
    fi
else
    echo "No valid config.json found"
    setup_config
fi

# Delete existing roles
echo "🗑️  Deleting existing roles..."
auth0 roles list --json | jq -r '.[].id' | while read -r role_id; do
    auth0 roles delete "$role_id" --no-input
done

# Deploy empty configuration to reset tenant
echo "🔄 Deploying empty configuration to Auth0..."
a0deploy import --input_file "${SCRIPT_DIR}/tenant" --config_file "${SCRIPT_DIR}/config.json"

# Clean up
rm -r "${SCRIPT_DIR}/tenant"

echo "✅ Auth0 tenant reset complete!"
echo "Note: Default application and database connection were preserved."
