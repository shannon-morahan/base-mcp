# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Remote MCP (Model Context Protocol) Server implementation for Cloudflare Workers with OAuth login capability. The server exposes an API that allows tools (like the MCP Inspector or Claude) to connect to it and access the defined tools (currently a simple 'add' function).

## Commands

### Development

```bash
# Install dependencies
npm install

# Run development server locally
npm run dev
# or
npm run start

# Generate TypeScript types for Cloudflare Workers
npm run cf-typegen

# Format code
npm run format

# Lint code and fix issues
npm run lint:fix

# Deploy to Cloudflare
npm run deploy
```

### Cloudflare Setup

```bash
# Create KV namespace for OAuth
npx wrangler kv namespace create OAUTH_KV

# Update wrangler.jsonc with the KV namespace ID
# Then deploy
npm run deploy
```

## Architecture

### Core Components

1. **MCP Server (src/index.ts)**
   - Defines a Durable Object class `MyMCP` extending `McpAgent`
   - Implements a simple "add" tool using MCP protocol
   - Uses OAuth for authentication

2. **Web Application (src/app.ts)**
   - Hono-based web server handling the UI and OAuth flow
   - Provides routes for authorization and login

3. **Utilities (src/utils.ts)**
   - Helper functions for rendering HTML templates
   - OAuth-related functionality

### Authentication Flow

1. Client connects to the MCP server at `/sse`
2. OAuth flow redirects to `/authorize` for authentication
3. User approves the request at `/approve`
4. Client is redirected back with token to access the MCP server

## Testing

### Connect with MCP Inspector

```bash
# Install and run MCP inspector
npx @modelcontextprotocol/inspector@latest

# Configure inspector:
# - Transport Type: SSE
# - URL: http://localhost:8787/sse (local) or https://your-worker.workers.dev/sse (deployed)
```

### Connect with Claude Desktop

Update Claude Desktop configuration:

```json
{
  "mcpServers": {
    "math": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

### Direct Testing

```bash
# Test direct connection to MCP server
npx mcp-remote http://localhost:8787/sse

# If authentication issues persist, clear auth cache
rm -rf ~/.mcp-auth
```

## Deployment

The project is deployed as a Cloudflare Worker with Durable Objects and KV storage.

```bash
# Deploy to Cloudflare
npm run deploy
```