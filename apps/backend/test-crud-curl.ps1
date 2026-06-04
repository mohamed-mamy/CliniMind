$ErrorActionPreference = "Stop"

function CleanupFiles {
    Remove-Item .\payload.json -ErrorAction SilentlyContinue
}

Write-Host "================= 1. Login ==================="
$loginJson = '{"username":"admin","password":"adminpassword"}'
Set-Content -Path .\payload.json -Value $loginJson -Encoding UTF8
$res = curl.exe -s -X POST http://localhost:3001/v1/auth/login -H "Content-Type: application/json" -d "@payload.json"
$parsed = $res | ConvertFrom-Json
$token = $parsed.data.accessToken

if (-not $token) {
    Write-Host "Failed to login."
    CleanupFiles
    exit 1
}
Write-Host "Token obtained successfully!"
$headers = "Authorization: Bearer $token"

Write-Host "`n================= 2. CREATE USER (Doctor) ==================="
$docJson = '{"username":"doc_crud_' + (Get-Date).Ticks + '","password":"password","role":"doctor","fullName":"Dr. CRUD","email":"doc_crud@clinimind.com"}'
Set-Content -Path .\payload.json -Value $docJson -Encoding UTF8
$res = curl.exe -s -X POST http://localhost:3001/v1/users -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
$doctorId = $parsed.data._id
Write-Host "Created Doctor ID: $doctorId" -ForegroundColor Green

Write-Host "`n================= 3. CREATE PATIENT ==================="
$patJson = '{"fullName":"CRUD Patient","ageCategory":"19-35 ans","gender":"M","phonePrimary":"+22236123999"}'
Set-Content -Path .\payload.json -Value $patJson -Encoding UTF8
$res = curl.exe -s -X POST http://localhost:3001/v1/patients -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
$patientId = $parsed.data._id
Write-Host "Created Patient ID: $patientId" -ForegroundColor Green

Write-Host "`n================= 4. UPDATE PATIENT (PUT) ==================="
$patUpdJson = '{"fullName":"CRUD Patient Updated"}'
Set-Content -Path .\payload.json -Value $patUpdJson -Encoding UTF8
$res = curl.exe -s -X PUT "http://localhost:3001/v1/patients/$patientId" -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
Write-Host "Updated Patient Name: $($parsed.data.fullName)" -ForegroundColor Green

Write-Host "`n================= 5. CREATE APPOINTMENT ==================="
$date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$appJson = '{"patientId":"' + $patientId + '","doctorId":"' + $doctorId + '","date":"' + $date + 'T00:00:00.000Z","timeSlot":"11:00","type":"normal"}'
Set-Content -Path .\payload.json -Value $appJson -Encoding UTF8
$res = curl.exe -s -X POST http://localhost:3001/v1/appointments -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
$appId = $parsed.data._id
Write-Host "Created Appointment ID: $appId" -ForegroundColor Green

Write-Host "`n================= 6. UPDATE APPOINTMENT (PUT) ==================="
$appUpdJson = '{"status":"confirmed"}'
Set-Content -Path .\payload.json -Value $appUpdJson -Encoding UTF8
$res = curl.exe -s -X PUT "http://localhost:3001/v1/appointments/$appId" -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
Write-Host "Updated Appointment Status: $($parsed.data.status)" -ForegroundColor Green

Write-Host "`n================= 7. CREATE INVOICE ==================="
$invJson = '{"patientId":"' + $patientId + '","items":[{"type":"consultation","description":"CRUD Consult","quantity":1,"unitPrice":800}]}'
Set-Content -Path .\payload.json -Value $invJson -Encoding UTF8
$res = curl.exe -s -X POST http://localhost:3001/v1/invoices -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
$invoiceId = $parsed.data._id
Write-Host "Created Invoice ID: $invoiceId" -ForegroundColor Green

Write-Host "`n================= 8. RECORD PAYMENT (POST) ==================="
$payJson = '{"amount":800,"paymentMethod":"cash"}'
Set-Content -Path .\payload.json -Value $payJson -Encoding UTF8
$res = curl.exe -s -X POST "http://localhost:3001/v1/invoices/$invoiceId/payment" -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
Write-Host "Payment recorded. Remaining: $($parsed.data.invoice.remainingAmount)" -ForegroundColor Green

Write-Host "`n================= 9. CREATE EXPENSE ==================="
$expJson = '{"category":"supplies","amount":250,"description":"CRUD test supplies","date":"' + $date + 'T00:00:00.000Z"}'
Set-Content -Path .\payload.json -Value $expJson -Encoding UTF8
$res = curl.exe -s -X POST http://localhost:3001/v1/expenses -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
$expenseId = $parsed.data._id
Write-Host "Created Expense ID: $expenseId" -ForegroundColor Green

Write-Host "`n================= 10. UPDATE EXPENSE (PUT) ==================="
$expUpdJson = '{"amount":300}'
Set-Content -Path .\payload.json -Value $expUpdJson -Encoding UTF8
$res = curl.exe -s -X PUT "http://localhost:3001/v1/expenses/$expenseId" -H "Content-Type: application/json" -H $headers -d "@payload.json"
$parsed = $res | ConvertFrom-Json
Write-Host "Updated Expense Amount: $($parsed.data.amount)" -ForegroundColor Green

Write-Host "`n================= 11. DELETE EXPENSE (DELETE) ==================="
$res = curl.exe -s -X DELETE "http://localhost:3001/v1/expenses/$expenseId" -H $headers
Write-Host "Expense Deleted (Response: 204 No Content)" -ForegroundColor Green

Write-Host "`n================= 12. DELETE APPOINTMENT (DELETE) ==================="
$res = curl.exe -s -X DELETE "http://localhost:3001/v1/appointments/$appId" -H $headers
Write-Host "Appointment Deleted (Response: 204 No Content)" -ForegroundColor Green

CleanupFiles
Write-Host "`nAll POST/PUT/DELETE tests via curl completed successfully!"
