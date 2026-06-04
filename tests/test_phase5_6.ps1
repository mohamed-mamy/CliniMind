$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3001/v1"

Write-Host "1. Logging in as director..."
$loginBody = @{
    username = "admin"
    password = "adminpassword"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.data.accessToken
Write-Host "Token obtained: $token"

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "2. Creating a patient..."
$patientBody = @{
    fullName = "Test Patient"
    ageCategory = "adulte"
    gender = "M"
    phonePrimary = "12345678"
} | ConvertTo-Json

try {
    $patientRes = Invoke-RestMethod -Uri "$baseUrl/patients" -Method Post -Body $patientBody -ContentType "application/json" -Headers $headers
    $patientId = $patientRes.data.patient._id
    if (-not $patientId) {
        $patientId = $patientRes.data._id
    }
} catch {
    # If duplicate phone, try to find the patient
    Write-Host "Duplicate phone, fetching existing patient..."
    $patients = Invoke-RestMethod -Uri "$baseUrl/patients" -Method Get -Headers $headers
    $patientId = $patients.data[0]._id
    if (-not $patientId) {
        $patientId = $patients.data.patients[0]._id
    }
}
Write-Host "Patient ID: $patientId"

Write-Host "3. Creating a Prescription..."
$prescriptionBody = @{
    patientId = $patientId
    notes = "Take with water"
    drugs = @(
        @{
            drugName = "Paracétamol 500mg"
            dosage = "1 comprimé 3x par jour"
            duration = 5
            instructions = "Après les repas"
        }
    )
} | ConvertTo-Json -Depth 5

$prescriptionRes = Invoke-RestMethod -Uri "$baseUrl/prescriptions" -Method Post -Body $prescriptionBody -ContentType "application/json" -Headers $headers
$prescriptionId = $prescriptionRes.data._id
Write-Host "Prescription created with ID: $prescriptionId"

Write-Host "4. Generating Prescription PDF..."
$pdfPath = "prescription_test.pdf"
Invoke-RestMethod -Uri "$baseUrl/prescriptions/$prescriptionId/pdf" -Method Get -Headers $headers -OutFile $pdfPath
Write-Host "PDF generated: $pdfPath"

Write-Host "5. Creating a Lab Request..."
$labRequestBody = @{
    patientId = $patientId
    tests = @("Glycémie à jeun")
    priority = "urgent"
} | ConvertTo-Json -Depth 5

$labReqRes = Invoke-RestMethod -Uri "$baseUrl/lab/requests" -Method Post -Body $labRequestBody -ContentType "application/json" -Headers $headers
$labRequestId = $labReqRes.data._id
Write-Host "Lab Request created with ID: $labRequestId"

# We must be a lab_technician to enter results. Let's temporarily change the role in the test or create one.
$rand = Get-Random
$labUsername = "labtech$rand"

Write-Host "Creating a lab technician ($labUsername)..."
$labTechBody = @{
    username = $labUsername
    password = "labpassword"
    fullName = "Lab Technician"
    email = "labtech$rand@clinimind.com"
    role = "lab_technician"
    isActive = $true
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Body $labTechBody -ContentType "application/json" -Headers $headers
} catch {
    Write-Host "Lab tech might already exist."
}

Write-Host "Logging in as lab technician..."
$labLoginBody = @{
    username = $labUsername
    password = "labpassword"
} | ConvertTo-Json

$labLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $labLoginBody -ContentType "application/json"
$labToken = $labLoginRes.data.accessToken
$labHeaders = @{
    Authorization = "Bearer $labToken"
}

Write-Host "6. Entering Lab Results..."
$resultsBody = @{
    results = @(
        @{
            testName = "Glycémie à jeun"
            resultText = "1.20"
            resultNumeric = 1.20
            unit = "g/L"
            normalRange = "0.70-1.10"
        }
    )
} | ConvertTo-Json -Depth 5

$resultRes = Invoke-RestMethod -Uri "$baseUrl/lab/requests/$labRequestId/results" -Method Put -Body $resultsBody -ContentType "application/json" -Headers $labHeaders
Write-Host "Results entered successfully. Is Critical? $($resultRes.data.labRequest.isCritical)"

Write-Host "7. Fetching Critical Results (as director)..."
$criticalRes = Invoke-RestMethod -Uri "$baseUrl/lab/results/critical" -Method Get -Headers $headers
Write-Host "Critical Results found: $($criticalRes.data.Count)"

Write-Host "All integration tests passed successfully!"
