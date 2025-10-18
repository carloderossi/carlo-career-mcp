@echo off
echo ========================================
echo Carlo Career MCP - Build and Test
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.

echo Step 2: Building TypeScript...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your MCP server is ready!
echo.
echo Next steps:
echo 1. Configure Claude Desktop with this path:
echo    C:\Carlo\projects\carlo-career-mcp\pdf-reader-mcp\build\index.js
echo.
echo 2. Add to claude_desktop_config.json:
echo {
echo   "mcpServers": {
echo     "carlo-career": {
echo       "command": "node",
echo       "args": ["C:\\Carlo\\projects\\carlo-career-mcp\\pdf-reader-mcp\\build\\index.js"]
echo     }
echo   }
echo }
echo.
echo 3. Restart Claude Desktop
echo.
echo ========================================
echo.
echo Press any key to test the server...
pause >nul

echo.
echo Testing server (Press Ctrl+C to stop)...
node build\index.js
