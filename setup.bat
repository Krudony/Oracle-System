@echo off
setlocal enabledelayedexpansion

echo 🌌 [Oracle System] Starting Unified Setup Protocol...
echo.

:: Get current directory (Absolute Path)
set "BASE_DIR=%~dp0"

:: 1. Check for Bun
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ [Error] Bun runtime not found. Please install it from https://bun.sh/
    pause
    exit /b 1
)
echo ✅ [Runtime] Bun is available.
echo.

:: 2. Check for Claude CLI
where claude >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  [Warning] Claude CLI not found.
    echo    Run: npm install -g @anthropic-ai/claude-code
) else (
    echo ✅ [Auth] Claude CLI is available.
)
echo.

:: 3. Generate Machine-Specific MCP Config
echo 🛠️  [Config] Generating dynamic MCP configuration...
set "MCP_FILE=%BASE_DIR%arra-oracle-mcp.json"
set "INDEX_PATH=%BASE_DIR%arra-oracle\src\index.ts"
set "INDEX_PATH=%INDEX_PATH:\=\\%"

echo { > "%MCP_FILE%"
echo   "mcpServers": { >> "%MCP_FILE%"
echo     "arra": { >> "%MCP_FILE%"
echo       "command": "bun", >> "%MCP_FILE%"
echo       "args": [ >> "%MCP_FILE%"
echo         "%INDEX_PATH%" >> "%MCP_FILE%"
echo       ] >> "%MCP_FILE%"
echo     } >> "%MCP_FILE%"
echo   } >> "%MCP_FILE%"
echo } >> "%MCP_FILE%"
echo ✅ [Config] Generated: %MCP_FILE%
echo.

:: 4. Setup Subsystems
set "folders=apollo-oracle arra-oracle pulse-cli oracle-skills-cli"
for %%f in (%folders%) do (
    if exist "%BASE_DIR%%%f" (
        echo 🚀 [Setup] Processing %%f...
        cd /d "%BASE_DIR%%%f"
        if exist "package.json" (
            echo 📦 [Bun] Installing dependencies for %%f...
            call bun install
            if "%%f"=="arra-oracle" (
                echo 🗄️  [DB] Initializing Database for Arra...
                call bunx drizzle-kit push
            )
        )
        cd /d "%BASE_DIR%"
        echo.
    )
)

:: 5. Done
echo ✨ [Oracle System] Setup Complete! Everything is ready.
echo.
pause
