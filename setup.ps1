# [Oracle System] Unified PowerShell Setup Protocol
# Version: 1.0.3-win (ASCII-Only for compatibility)

$ErrorActionPreference = "Stop"
Write-Host "`n[Oracle System] Starting Unified Setup Protocol...`n"

# 1. Environment & Path Setup
$BASE_DIR = Get-Location
$APPDATA_ROAMING = $env:APPDATA
$USER_PROFILE = $env:USERPROFILE

# 2. Runtime Checks
Write-Host "[Runtime] Checking dependencies..."
if (!(Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Error "Bun not found. Please install it from https://bun.sh/"
}
Write-Host "Bun is available."

# 3. Subsystem Setup (Dependencies & DB)
$folders = @("apollo-oracle", "arra-oracle", "pulse-cli", "oracle-skills-cli")
foreach ($f in $folders) {
    if (Test-Path "$BASE_DIR\$f") {
        Write-Host "`n[Setup] Processing $f..."
        Set-Location "$BASE_DIR\$f"
        
        if (Test-Path "package.json") {
            Write-Host "[Bun] Installing dependencies for $f..."
            bun install
            
            if ($f -eq "arra-oracle") {
                Write-Host "[DB] Initializing Database for Arra..."
                bunx drizzle-kit push
                
                Write-Host "[Indexer] Indexing initial knowledge base..."
                bun run index
            }
        }
        Set-Location "$BASE_DIR"
    }
}

# 4. MCP Registration (Gemini & Claude)
Write-Host "`n[Config] Registering MCP Servers..."

$INDEX_PATH = Join-Path $BASE_DIR "arra-oracle\src\index.ts"
$INDEX_ESCAPED = $INDEX_PATH.Replace("\", "\\")

# A. Gemini CLI Registration
$GEMINI_CONFIG_PATH = Join-Path $USER_PROFILE ".gemini\config.json"
if (Test-Path $GEMINI_CONFIG_PATH) {
    Write-Host "[Gemini] Linking Arra Oracle MCP to Gemini CLI..."
    $geminiConfig = Get-Content $GEMINI_CONFIG_PATH -Raw | ConvertFrom-Json
    
    if ($null -eq $geminiConfig.mcpServers) {
        $geminiConfig | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value @{}
    }
    
    $geminiConfig.mcpServers | Add-Member -MemberType NoteProperty -Name "arra" -Value @{
        command = "bun"
        args = @($INDEX_ESCAPED)
    } -Force
    
    $geminiConfig | ConvertTo-Json -Depth 10 | Set-Content $GEMINI_CONFIG_PATH
    Write-Host "[Gemini] MCP Registered."
}

# B. Claude Desktop Registration
$CLAUDE_CONFIG_DIR = Join-Path $APPDATA_ROAMING "Claude"
$CLAUDE_CONFIG_PATH = Join-Path $CLAUDE_CONFIG_DIR "claude_desktop_config.json"

if (Test-Path $CLAUDE_CONFIG_DIR) {
    Write-Host "[Claude] Linking Arra Oracle MCP to Claude Desktop..."
    if (Test-Path $CLAUDE_CONFIG_PATH) {
        $claudeConfig = Get-Content $CLAUDE_CONFIG_PATH -Raw | ConvertFrom-Json
    } else {
        $claudeConfig = [PSCustomObject]@{ mcpServers = [PSCustomObject]@{} }
    }
    
    if ($null -eq $claudeConfig.mcpServers) {
        $claudeConfig | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value @{}
    }
    
    $claudeConfig.mcpServers | Add-Member -MemberType NoteProperty -Name "arra" -Value @{
        command = "bun"
        args = @($INDEX_ESCAPED)
    } -Force
    
    $claudeConfig | ConvertTo-Json -Depth 10 | Set-Content $CLAUDE_CONFIG_PATH
    Write-Host "[Claude] MCP Registered."
}

# 5. Skills Initialization
Write-Host "`n[Skills] Initializing Oracle Skills..."
if (!(Test-Path "$USER_PROFILE\.oracle-skills")) {
    New-Item -ItemType Directory -Path "$USER_PROFILE\.oracle-skills" -Force | Out-Null
}
Write-Host "[Skills] Initialized."

Write-Host "`n[Oracle System] Setup Complete! Everything is ready.`n"
Write-Host "You can now use '/about-oracle' or '/speak' in your AI agent."
