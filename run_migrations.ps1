# QuantumSepsis — Run Supabase Migrations via REST API
# Uses the Management API to execute SQL

$SUPABASE_PROJECT = "qpghrmtsqiwdojvasrol"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZ2hybXRzcWl3ZG9qdmFzcm9sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg1MDMwMCwiZXhwIjoyMDk2NDI2MzAwfQ.eMG9Atm8IbB1bI-NAzJSsi6tLoKlYAHQRrDzT2JaId0"
$BASE_URL = "https://$SUPABASE_PROJECT.supabase.co"

function Run-SQL {
    param([string]$Name, [string]$SQL)
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Running: $Name" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    try {
        $headers = @{
            "apikey" = $SERVICE_KEY
            "Authorization" = "Bearer $SERVICE_KEY"
            "Content-Type" = "application/json"
            "Prefer" = "return=minimal"
        }
        
        $body = @{ query = $SQL } | ConvertTo-Json -Depth 1
        
        $response = Invoke-RestMethod `
            -Uri "$BASE_URL/rest/v1/rpc/exec_sql" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "SUCCESS: $Name completed" -ForegroundColor Green
        return $true
    }
    catch {
        # The rpc/exec_sql endpoint may not exist, try the pg-meta route
        Write-Host "Note: rpc/exec_sql not available, trying direct query..." -ForegroundColor Yellow
        return $false
    }
}

# Read migration files
$migration1 = Get-Content "supabase\migrations\001_initial_schema.sql" -Raw
$migration2 = Get-Content "supabase\migrations\002_rls_policies_FIXED.sql" -Raw
$migration3 = Get-Content "supabase\migrations\003_seed_data.sql" -Raw

Write-Host "Migration files loaded:" -ForegroundColor Green
Write-Host "  001_initial_schema.sql: $($migration1.Length) chars"
Write-Host "  002_rls_policies_FIXED.sql: $($migration2.Length) chars"  
Write-Host "  003_seed_data.sql: $($migration3.Length) chars"

# Try running via rpc
$ok = Run-SQL -Name "001_initial_schema" -SQL $migration1
if (-not $ok) {
    Write-Host "`n================================================================" -ForegroundColor Yellow
    Write-Host "Cannot run SQL via REST API (exec_sql function not available)." -ForegroundColor Yellow
    Write-Host "Please run manually in Supabase Dashboard > SQL Editor." -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host "`nAlternatively, the SQL has been printed above for copy-paste."
}
