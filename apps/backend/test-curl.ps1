$loginJson = '{"username":"admin","password":"adminpassword"}'
Set-Content -Path .\login.json -Value $loginJson -Encoding UTF8

$response = curl.exe -s -X POST http://localhost:3001/v1/auth/login -H "Content-Type: application/json" -d "@login.json"

$jsonObject = $response | ConvertFrom-Json
$token = $jsonObject.data.accessToken

if (-not $token) {
    Write-Host "Failed to get token! Response was:"
    Write-Host $response
    exit 1
}

Write-Host "Token obtained: $($token.Substring(0, 20))..."
Write-Host ""
Write-Host "================= 1. GET /v1/settings ================="
curl.exe -s -X GET http://localhost:3001/v1/settings -H "Authorization: Bearer $token"
Write-Host ""
Write-Host ""

$putJson = '{"clinicName":"CliniMind PRO Curl Test"}'
Set-Content -Path .\put.json -Value $putJson -Encoding UTF8

Write-Host "================= 2. PUT /v1/settings ================="
curl.exe -s -X PUT http://localhost:3001/v1/settings -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@put.json"
Write-Host ""
Write-Host ""

Write-Host "================= 3. GET /v1/dashboard/director ================="
curl.exe -s -X GET http://localhost:3001/v1/dashboard/director -H "Authorization: Bearer $token"
Write-Host ""
Write-Host ""

Write-Host "================= 4. GET /v1/notifications ================="
curl.exe -s -X GET http://localhost:3001/v1/notifications -H "Authorization: Bearer $token"
Write-Host ""
Write-Host ""

Remove-Item .\login.json
Remove-Item .\put.json
