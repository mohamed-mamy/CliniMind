// Phase 3 & 4 — Comprehensive curl test script
// Run: node test-phase3-4.js

const BASE = 'http://localhost:3001/v1';

async function request(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  let data, text;
  
  if (res.headers.get('content-type') === 'application/pdf') {
    return { status: res.status, data: 'PDF Data' };
  }
  
  text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function run() {
  let passed = 0;
  let failed = 0;
  const results = [];

  function check(name, condition, detail) {
    if (condition) {
      passed++;
      results.push(`✅ ${name}`);
    } else {
      failed++;
      results.push(`❌ ${name}: ${detail}`);
    }
  }

  // 1. Login as director
  console.log('\n=== Step 1: Login as director ===');
  const loginRes = await request('POST', '/auth/login', { username: 'admin', password: 'adminpassword' });
  check('Login returns 200', loginRes.status === 200, `Got ${loginRes.status}`);
  const token = loginRes.data?.data?.accessToken;
  const directorId = loginRes.data?.data?.user?._id;
  check('Login returns accessToken', !!token, 'No token');

  // 2. Prepare mock patient and doctor
  console.log('\n=== Step 2: Prepare patient and doctor ===');
  const patientRes = await request('POST', '/patients', {
    fullName: 'Test Patient', ageCategory: '19-35 ans', gender: 'M', phonePrimary: '+22236123400'
  }, token);
  const patientId = patientRes.data?.data?._id;
  check('Patient created', !!patientId, 'Could not create patient');

  // Create a doctor user
  const doctorRes = await request('POST', '/users', {
    username: `doctor_${Date.now()}`,
    password: 'password123',
    fullName: 'Dr. Test',
    email: `drtest${Date.now()}@example.com`,
    role: 'doctor'
  }, token);
  const doctorId = doctorRes.data?.data?._id;
  check('Doctor created', !!doctorId, `Could not create doctor, got ${JSON.stringify(doctorRes.data)}`);

  // --- PHASE 3: APPOINTMENTS ---
  console.log('\n=== PHASE 3: APPOINTMENTS ===');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(10, 0, 0, 0);

  // POST /appointments
  console.log('\n=== Step 3: POST /appointments ===');
  const apptRes = await request('POST', '/appointments', {
    patientId,
    doctorId,
    date: tomorrow.toISOString(),
    timeSlot: '10:00'
  }, token);
  if(apptRes.status !== 201) console.log(apptRes.data);
  check('Create appointment returns 201', apptRes.status === 201, `Got ${apptRes.status}`);
  const appointmentId = apptRes.data?.data?._id;
  check('Appointment created', !!appointmentId, 'No appointment ID');

  // Conflict test
  console.log('\n=== Step 4: POST /appointments (Conflict) ===');
  const conflictRes = await request('POST', '/appointments', {
    patientId,
    doctorId,
    date: tomorrow.toISOString(),
    timeSlot: '10:00'
  }, token);
  check('Conflict returns 409', conflictRes.status === 409, `Got ${conflictRes.status}`);
  check('Error code is CONFLICT', conflictRes.data?.error?.code === 'CONFLICT', `Got ${conflictRes.data?.error?.code}`);

  // Available slots
  console.log('\n=== Step 5: GET /appointments/available-slots ===');
  const slotsRes = await request('GET', `/appointments/available-slots?doctorId=${doctorId}&date=${tomorrow.toISOString()}`, null, token);
  check('Available slots returns 200', slotsRes.status === 200, `Got ${slotsRes.status}`);
  check('Slot 10:00 is not in available slots', !slotsRes.data?.data?.availableSlots?.includes('10:00'), '10:00 should be booked');

  // Status update
  console.log('\n=== Step 6: PUT /appointments/:id/status ===');
  const statusRes = await request('PUT', `/appointments/${appointmentId}/status`, { status: 'confirmed' }, token);
  check('Status update returns 200', statusRes.status === 200, `Got ${statusRes.status}`);
  check('Status is confirmed', statusRes.data?.data?.status === 'confirmed', `Got ${statusRes.data?.data?.status}`);

  // --- PHASE 4: BILLING ---
  console.log('\n=== PHASE 4: BILLING ===');

  // POST /invoices
  console.log('\n=== Step 7: POST /invoices ===');
  const invoiceRes = await request('POST', '/invoices', {
    patientId,
    items: [
      { type: 'consultation', description: 'General checkup', quantity: 1, unitPrice: 500 },
      { type: 'lab_test', description: 'Blood test', quantity: 1, unitPrice: 1000 }
    ],
    discountType: 'fixed',
    discountValue: 100
  }, token);
  if(invoiceRes.status !== 201) console.log(invoiceRes.data);
  check('Create invoice returns 201', invoiceRes.status === 201, `Got ${invoiceRes.status}`);
  const invoiceId = invoiceRes.data?.data?._id;
  check('Invoice totalAmount is 1400', invoiceRes.data?.data?.totalAmount === 1400, `Got ${invoiceRes.data?.data?.totalAmount}`);
  check('Invoice remainingAmount is 1400', invoiceRes.data?.data?.remainingAmount === 1400, `Got ${invoiceRes.data?.data?.remainingAmount}`);

  // POST /invoices/:id/payment (Partial)
  console.log('\n=== Step 8: POST /invoices/:id/payment (Partial) ===');
  const pay1Res = await request('POST', `/invoices/${invoiceId}/payment`, {
    amount: 1000,
    paymentMethod: 'cash'
  }, token);
  check('Partial payment returns 200', pay1Res.status === 200, `Got ${pay1Res.status}`);
  check('Status is partial', pay1Res.data?.data?.invoice?.status === 'partial', `Got ${pay1Res.data?.data?.invoice?.status}`);
  check('Remaining amount is 400', pay1Res.data?.data?.remainingAmount === 400, `Got ${pay1Res.data?.data?.remainingAmount}`);

  // POST /invoices/:id/payment (Full)
  console.log('\n=== Step 9: POST /invoices/:id/payment (Full) ===');
  const pay2Res = await request('POST', `/invoices/${invoiceId}/payment`, {
    amount: 400,
    paymentMethod: 'card'
  }, token);
  check('Full payment returns 200', pay2Res.status === 200, `Got ${pay2Res.status}`);
  check('Status is paid', pay2Res.data?.data?.invoice?.status === 'paid', `Got ${pay2Res.data?.data?.invoice?.status}`);

  // Invalid state: Overpay or pay already paid invoice
  console.log('\n=== Step 10: POST /invoices/:id/payment (Already paid) ===');
  const pay3Res = await request('POST', `/invoices/${invoiceId}/payment`, {
    amount: 100,
    paymentMethod: 'cash'
  }, token);
  check('Overpayment returns 409', pay3Res.status === 409, `Got ${pay3Res.status}`);

  // GET /invoices/:id/pdf
  console.log('\n=== Step 11: GET /invoices/:id/pdf ===');
  const pdfRes = await request('GET', `/invoices/${invoiceId}/pdf`, null, token);
  check('PDF returns 200', pdfRes.status === 200, `Got ${pdfRes.status}`);
  check('Data is PDF', pdfRes.data === 'PDF Data', `Got ${pdfRes.data}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  results.forEach(r => console.log(r));
  console.log('='.repeat(50));
}

run().catch(err => { console.error('Test script error:', err); process.exit(1); });
