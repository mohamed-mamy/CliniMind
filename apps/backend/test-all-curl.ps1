$ErrorActionPreference = "Stop"

# 1. Login to get token
Write-Host "================= 1. Login ==================="
$loginJson = '{"username":"admin","password":"adminpassword"}'
Set-Content -Path .\login.json -Value $loginJson -Encoding UTF8

$response = curl.exe -s -X POST http://localhost:3001/v1/auth/login -H "Content-Type: application/json" -d "@login.json"
$jsonObject = $response | ConvertFrom-Json
$token = $jsonObject.data.accessToken

if (-not $token) {
    Write-Host "Failed to get token! Response was:"
    Write-Host $response
    Remove-Item .\login.json
    exit 1
}

Write-Host "Token obtained successfully!"
Write-Host ""

$headers = "Authorization: Bearer $token"

# List of endpoints to test
$endpoints = @(
    "/v1/users",
    "/v1/patients",
    "/v1/appointments",
    "/v1/invoices",
    "/v1/lab/requests",
    "/v1/expenses",
    "/v1/reports/financial",
    "/v1/notifications",
    "/v1/settings",
    "/v1/dashboard/director",
    "/v1/audit-logs"
)

$i = 2
foreach ($endpoint in $endpoints) {
    Write-Host "================= $i. GET $endpoint ==================="
    $res = curl.exe -s -X GET "http://localhost:3001$endpoint" -H $headers
    
    # Try to parse and pretty print, otherwise just print
    try {
        $parsed = $res | ConvertFrom-Json
        # Check if it was a success based on typical CliniMind response structure
        if ($parsed.success -eq $true) {
            Write-Host "SUCCESS!" -ForegroundColor Green
        } else {
            Write-Host "WARNING/ERROR: success flag was not true or missing." -ForegroundColor Yellow
        }
        $parsed | ConvertTo-Json -Depth 2
    } catch {
        Write-Host "Failed to parse JSON. Raw response:"
        Write-Host $res
    }
    
    Write-Host ""
    $i++
}

# Cleanup
Remove-Item .\login.json
Write-Host "All GET requests completed!"
