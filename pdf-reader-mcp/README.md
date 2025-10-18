# Carlo Career MCP Server

A Model Context Protocol (MCP) server that provides Claude with access to Carlo's career documents and job search capabilities in Zurich.

## Features

✅ **PDF Document Access**
- List all career PDFs
- Read PDF contents
- Extract PDF metadata
- Search PDFs by filename

✅ **Intelligent Q&A**
- Answer questions about career documents
- Search across all PDFs for relevant information

✅ **Job Search Integration**
- Search jobs in Zurich via Adzuna API
- Pre-configured with API credentials
- Returns job title, company, salary, and links

## Quick Start

### 1. Install Dependencies

```bash
cd C:\Carlo\projects\carlo-career-mcp\pdf-reader-mcp
npm install
```

### 2. Build the Project

```bash
npm run build
```

You should see output like:
```
> carlo-career-mcp@1.0.0 build
> tsc
```

### 3. Test the Server

```bash
node build/index.js
```

You should see:
```
Carlo Career MCP Server starting...
Watching directory: C:\Carlo\Curriculum
Adzuna API configured for job search in Zurich
Carlo Career MCP Server running
```

Press Ctrl+C to stop.

## Configure with Claude Desktop

### Option 1: Manual Config (Recommended)

1. Open Claude Desktop
2. Go to **Settings → Developer → Edit Config**
3. Add this configuration:

```json
{
  "mcpServers": {
    "carlo-career": {
      "command": "node",
      "args": [
        "C:\\Carlo\\projects\\carlo-career-mcp\\pdf-reader-mcp\\build\\index.js"
      ]
    }
  }
}
```

4. **Restart Claude Desktop**

### Option 2: With Custom Directory

If your PDFs are in a different location:

```json
{
  "mcpServers": {
    "carlo-career": {
      "command": "node",
      "args": [
        "C:\\Carlo\\projects\\carlo-career-mcp\\pdf-reader-mcp\\build\\index.js",
        "D:\\MyCareerDocs"
      ]
    }
  }
}
```

## Available Tools

Once configured, ask Claude:

### 📄 Document Access
- "List all my career PDFs"
- "Read my resume.pdf"
- "What PDFs contain 'project management'?"
- "Show me metadata for my CV"

### 💬 Q&A
- "What experience do I have with Python?"
- "Tell me about my education background"
- "What projects have I worked on?"

### 💼 Job Search
- "Search for data scientist jobs in Zurich"
- "Find software engineer positions in Zurich"
- "Show me project manager jobs in Switzerland"

## Building as MCPB Bundle

To create a distributable `.mcpb` file:

### 1. Install MCPB Tool

```bash
npm install -g @anthropic-ai/mcpb
```

### 2. Initialize and Pack

```bash
cd C:\Carlo\projects\carlo-career-mcp\pdf-reader-mcp
mcpb init
mcpb pack
```

This will create `carlo-career-mcp.mcpb` file.

### 3. Install in Claude Desktop

1. Go to **Settings → Extensions**
2. Click "Install from file"
3. Select the `.mcpb` file
4. Configure the PDF directory path if needed
5. Restart Claude Desktop

## Troubleshooting

### "Cannot find module" errors

Make sure you've run:
```bash
npm install
npm run build
```

### Server not appearing in Claude

1. Check Claude Desktop logs: **Help → Show Logs**
2. Verify the path in `claude_desktop_config.json` is absolute
3. Make sure Node.js is installed: `node --version` (needs v18+)
4. Restart Claude Desktop after config changes

### PDFs not found

1. Verify the directory exists: `C:\Carlo\Curriculum`
2. Check file permissions
3. Ensure PDFs have `.pdf` extension

### Job search not working

The Adzuna API is pre-configured with credentials. If you get errors:
- Check your internet connection
- The API has rate limits (try again in a minute)
- Contact support if persistently failing

## Technical Details

- **Protocol**: MCP stdio-based
- **Runtime**: Node.js 18+
- **PDF Library**: pdf-parse
- **Job API**: Adzuna (Switzerland)
- **API Credentials**: Pre-configured (no setup needed)

## Project Structure

```
pdf-reader-mcp/
├── src/
│   └── index.ts          # Main server code
├── build/                # Compiled JavaScript (after npm run build)
│   └── index.js
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── manifest.json         # MCPB metadata
└── README.md            # This file
```

## Development

### Watch Mode

For development with auto-rebuild:

```bash
# Terminal 1: Watch TypeScript
tsc --watch

# Terminal 2: Run server
node build/index.js
```

### Add More Features

The server is extensible. You can add:
- Course recommendations
- LinkedIn scraping
- Resume analysis
- Interview preparation

## License

MIT

## Support

For issues or questions:
- Check logs in Claude Desktop
- Review this README
- Verify all paths are correct
