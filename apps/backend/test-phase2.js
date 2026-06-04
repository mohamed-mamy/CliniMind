// Phase 2 — Comprehensive curl test script
// Run: node test-phase2.js

const BASE = 'http://localhost:3001/v1';

async function request(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
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
  check('Login returns accessToken', !!token, 'No token');

  // 2. POST /patients — Create patient
  console.log('\n=== Step 2: POST /patients ===');
  const createRes = await request('POST', '/patients', {
    fullName: 'Ahmed Mohamed',
    ageCategory: '19-35 ans',
    gender: 'M',
    phonePrimary: '+22236123456',
    email: 'ahmed@test.com',
    allergies: [{ type: 'medication', description: 'Penicillin' }],
    chronicDiseases: ['diabetes']
  }, token);
  console.log('Create response:', JSON.stringify(createRes.data, null, 2));
  check('Create patient returns 201', createRes.status === 201, `Got ${createRes.status}`);
  check('Response has success:true', createRes.data?.success === true, `Got ${createRes.data?.success}`);
  check('Response has { success, data, error, meta }', 
    'success' in createRes.data && 'data' in createRes.data && 'error' in createRes.data && 'meta' in createRes.data,
    `Missing envelope fields`);
  check('Patient has fileNumber', !!createRes.data?.data?.fileNumber, 'No fileNumber');
  check('Patient has createdBy', !!createRes.data?.data?.createdBy, 'No createdBy');
  const patientId = createRes.data?.data?._id;

  // 3. POST /patients — Validation error (missing required fields)
  console.log('\n=== Step 3: Validation error test ===');
  const validationRes = await request('POST', '/patients', { fullName: 'X' }, token);
  console.log('Validation response:', JSON.stringify(validationRes.data, null, 2));
  check('Validation returns 400', validationRes.status === 400, `Got ${validationRes.status}`);
  check('Validation returns VALIDATION_ERROR', validationRes.data?.error?.code === 'VALIDATION_ERROR', `Got ${validationRes.data?.error?.code}`);
  check('Validation has error.fields', !!validationRes.data?.error?.fields, 'No fields');

  // 4. GET /patients — List
  console.log('\n=== Step 4: GET /patients ===');
  const listRes = await request('GET', '/patients', null, token);
  console.log('List response:', JSON.stringify(listRes.data, null, 2));
  check('List returns 200', listRes.status === 200, `Got ${listRes.status}`);
  check('List has meta (page, limit, total)', 
    listRes.data?.meta?.page && listRes.data?.meta?.limit && listRes.data?.meta?.total !== undefined,
    `Got meta: ${JSON.stringify(listRes.data?.meta)}`);
  check('List data is array', Array.isArray(listRes.data?.data), 'Not array');

  // 5. GET /patients/:id — Single
  console.log('\n=== Step 5: GET /patients/:id ===');
  const getRes = await request('GET', `/patients/${patientId}`, null, token);
  console.log('Get response:', JSON.stringify(getRes.data, null, 2));
  check('Get patient returns 200', getRes.status === 200, `Got ${getRes.status}`);
  check('Get patient returns correct id', getRes.data?.data?._id === patientId, 'Wrong id');

  // 6. GET /patients/:id — Not found
  console.log('\n=== Step 6: GET /patients/:id — NOT_FOUND ===');
  const notFoundRes = await request('GET', '/patients/65f2a1b3c4d5e6f7a8b9c0d1', null, token);
  console.log('NotFound response:', JSON.stringify(notFoundRes.data, null, 2));
  check('Not found returns 404', notFoundRes.status === 404, `Got ${notFoundRes.status}`);
  check('Not found returns NOT_FOUND code', notFoundRes.data?.error?.code === 'NOT_FOUND', `Got ${notFoundRes.data?.error?.code}`);

  // 7. PUT /patients/:id — Update
  console.log('\n=== Step 7: PUT /patients/:id ===');
  const updateRes = await request('PUT', `/patients/${patientId}`, { fullName: 'Ahmed Mohamed Updated', bloodType: 'A+' }, token);
  console.log('Update response:', JSON.stringify(updateRes.data, null, 2));
  check('Update returns 200', updateRes.status === 200, `Got ${updateRes.status}`);
  check('Update reflects new name', updateRes.data?.data?.fullName === 'Ahmed Mohamed Updated', `Got ${updateRes.data?.data?.fullName}`);

  // 8. PUT /patients/:id/medical-history — Update medical history
  console.log('\n=== Step 8: PUT /patients/:id/medical-history ===');
  const medHistRes = await request('PUT', `/patients/${patientId}/medical-history`, {
    surgeries: ['Appendectomy 2020'],
    currentTreatments: ['Metformin 500mg'],
    familyHistory: 'Diabetes in family',
    confidentialNotes: 'Patient has anxiety disorder'
  }, token);
  console.log('Medical history update response:', JSON.stringify(medHistRes.data, null, 2));
  check('Medical history update returns 200', medHistRes.status === 200, `Got ${medHistRes.status}`);
  check('Medical history has surgeries', Array.isArray(medHistRes.data?.data?.surgeries), 'No surgeries');

  // 9. GET /patients/:id/medical-history
  console.log('\n=== Step 9: GET /patients/:id/medical-history ===');
  const getMedRes = await request('GET', `/patients/${patientId}/medical-history`, null, token);
  console.log('Get medical history response:', JSON.stringify(getMedRes.data, null, 2));
  check('Get medical history returns 200', getMedRes.status === 200, `Got ${getMedRes.status}`);
  check('Medical history has confidentialNotes', !!getMedRes.data?.data?.confidentialNotes, 'No confidentialNotes (director should see them)');

  // 10. GET /patients/:id/history
  console.log('\n=== Step 10: GET /patients/:id/history ===');
  const historyRes = await request('GET', `/patients/${patientId}/history`, null, token);
  console.log('History response:', JSON.stringify(historyRes.data, null, 2));
  check('History returns 200', historyRes.status === 200, `Got ${historyRes.status}`);
  check('History has patient', !!historyRes.data?.data?.patient, 'No patient');
  check('History has appointments array', Array.isArray(historyRes.data?.data?.appointments), 'No appointments');
  check('History has prescriptions array', Array.isArray(historyRes.data?.data?.prescriptions), 'No prescriptions');
  check('History has labRequests array', Array.isArray(historyRes.data?.data?.labRequests), 'No labRequests');
  check('History has invoices array', Array.isArray(historyRes.data?.data?.invoices), 'No invoices');

  // 11. GET /patients — Search
  console.log('\n=== Step 11: GET /patients?search=Ahmed ===');
  const searchRes = await request('GET', '/patients?search=Ahmed', null, token);
  check('Search returns results', searchRes.data?.meta?.total > 0, `Total: ${searchRes.data?.meta?.total}`);

  // 12. DELETE /patients/:id — Delete
  console.log('\n=== Step 12: DELETE /patients/:id ===');
  const deleteRes = await request('DELETE', `/patients/${patientId}`, null, token);
  check('Delete returns 204', deleteRes.status === 204, `Got ${deleteRes.status}`);

  // 13. GET /patients/:id — Verify deleted
  console.log('\n=== Step 13: Verify deleted ===');
  const verifyRes = await request('GET', `/patients/${patientId}`, null, token);
  check('Deleted patient returns 404', verifyRes.status === 404, `Got ${verifyRes.status}`);

  // 14. No token test
  console.log('\n=== Step 14: No token test ===');
  const noTokenRes = await request('GET', '/patients');
  check('No token returns 401', noTokenRes.status === 401, `Got ${noTokenRes.status}`);
  check('No token returns AUTH_REQUIRED', noTokenRes.data?.error?.code === 'AUTH_REQUIRED', `Got ${noTokenRes.data?.error?.code}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  results.forEach(r => console.log(r));
  console.log('='.repeat(50));
}

run().catch(err => { console.error('Test script error:', err); process.exit(1); });
