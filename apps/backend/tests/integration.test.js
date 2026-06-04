const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const app = require('../src/app');
const { initSocket } = require('../src/socket');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}/v1`;

// Models to clean and setup
const User = require('../src/modules/user/user.model');
const Patient = require('../src/modules/patient/patient.model');
const Appointment = require('../src/modules/appointment/appointment.model');
const Invoice = require('../src/modules/billing/invoice.model');
const InvoiceItem = require('../src/modules/billing/invoiceItem.model');
const LabRequest = require('../src/modules/lab/labRequest.model');
const AuditLog = require('../src/modules/audit/audit.model');
const Setting = require('../src/modules/setting/setting.model');
const Counter = require('../src/models/counter.model');

// Helper to make API requests
const apiRequest = async (method, route, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${route}`, options);
  if (res.status === 204) {
    return { status: 204 };
  }
  const data = await res.json();
  return { status: res.status, ...data };
};

// Main test function
async function runTests() {
  let server;
  try {
    // 1. Establish Database Connection (Safely targeting test db)
    const originalUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinimind';
    const testUri = originalUri.includes('?') 
      ? originalUri.replace(/\/clinimind(\?)/, '/clinimind_test$1')
      : originalUri.replace(/\/clinimind$/, '/clinimind_test');

    console.log(`[Test] Connecting to MongoDB test database: ${testUri}`);
    await mongoose.connect(testUri);
    console.log('[Test] Connected.');

    // 2. Wipe Test Database Collections
    console.log('[Test] Cleaning test database...');
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Invoice.deleteMany({}),
      InvoiceItem.deleteMany({}),
      LabRequest.deleteMany({}),
      AuditLog.deleteMany({}),
      Setting.deleteMany({}),
      Counter.deleteMany({})
    ]);

    // 3. Seed Database
    console.log('[Test] Seeding initial director user, settings, and doctor...');
    const director = new User({
      username: 'testdirector',
      password: 'dirpassword',
      role: 'director',
      fullName: 'Test Director',
      email: 'director@test.com',
      isActive: true
    });
    await director.save();

    const doctor1 = new User({
      username: 'testdoctor1',
      password: 'docpassword',
      role: 'doctor',
      fullName: 'Test Doctor 1',
      email: 'doctor1@test.com',
      isActive: true
    });
    await doctor1.save();

    const defaultSetting = new Setting({
      clinicName: 'Test Clinic',
      defaultConsultationFee: 500,
      clinicEmail: 'clinic@test.com',
      clinicAddress: '123 Test St',
      clinicPhone: '+22236123456'
    });
    await defaultSetting.save();

    // 4. Start ephemeral test server
    console.log('[Test] Starting server on port 3002...');
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log('[Test] Server started.');

    // --- Scenario 1: Core Flow (Auth, Patient, Appointment, Invoice, Audit Logs) ---
    console.log('\n--- SCENARIO 1: Core Billing and Audit Flow ---');

    // A. Login as Director
    console.log('A1. Logging in as Director...');
    const dirLogin = await apiRequest('POST', '/auth/login', {
      username: 'testdirector',
      password: 'dirpassword'
    });
    if (dirLogin.status !== 200 || !dirLogin.success) {
      throw new Error(`Director login failed: ${JSON.stringify(dirLogin)}`);
    }
    const dirToken = dirLogin.data.accessToken;
    console.log('A1. Success.');

    // B. Director creates Receptionist user
    console.log('B1. Creating Receptionist user...');
    const createRecept = await apiRequest('POST', '/users', {
      username: 'testrecept',
      password: 'receptpassword',
      role: 'receptionist',
      fullName: 'Test Receptionist',
      email: 'recept@test.com'
    }, dirToken);
    if (createRecept.status !== 201 || !createRecept.success) {
      throw new Error(`Create Receptionist user failed: ${JSON.stringify(createRecept)}`);
    }
    const receptId = createRecept.data._id;
    console.log('B1. Success.');

    // C. Login as Receptionist
    console.log('C1. Logging in as Receptionist...');
    const receptLogin = await apiRequest('POST', '/auth/login', {
      username: 'testrecept',
      password: 'receptpassword'
    });
    if (receptLogin.status !== 200 || !receptLogin.success) {
      throw new Error(`Receptionist login failed: ${JSON.stringify(receptLogin)}`);
    }
    const receptToken = receptLogin.data.accessToken;
    console.log('C1. Success.');

    // D. Receptionist creates Patient
    console.log('D1. Creating Patient...');
    const createPatient = await apiRequest('POST', '/patients', {
      fullName: 'Ahmed Ould Mohamed',
      ageCategory: '19-35 ans',
      gender: 'M',
      phonePrimary: '+22245678901',
      email: 'ahmed@patient.com'
    }, receptToken);
    if (createPatient.status !== 201 || !createPatient.success) {
      throw new Error(`Create Patient failed: ${JSON.stringify(createPatient)}`);
    }
    const patientId = createPatient.data._id;
    console.log(`D1. Success. File number: ${createPatient.data.fileNumber}`);

    // E. Receptionist books Appointment
    console.log('E1. Booking Appointment...');
    const createAppt = await apiRequest('POST', '/appointments', {
      patientId,
      doctorId: doctor1._id, // use the seeded doctor
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z',
      timeSlot: '10:00',
      reason: 'General checkup',
      type: 'normal'
    }, receptToken);
    if (createAppt.status !== 201 || !createAppt.success) {
      throw new Error(`Create Appointment failed: ${JSON.stringify(createAppt)}`);
    }
    console.log('E1. Success.');

    // F. Receptionist creates Invoice
    console.log('F1. Creating Invoice...');
    const createInvoice = await apiRequest('POST', '/invoices', {
      patientId,
      items: [
        {
          type: 'consultation',
          description: 'Consultation Fee',
          quantity: 1,
          unitPrice: 500
        }
      ]
    }, receptToken);
    if (createInvoice.status !== 201 || !createInvoice.success) {
      throw new Error(`Create Invoice failed: ${JSON.stringify(createInvoice)}`);
    }
    const invoiceId = createInvoice.data._id;
    console.log(`F1. Success. Invoice #${createInvoice.data.invoiceNumber}, Status: ${createInvoice.data.status}`);

    // G. Receptionist records Payment
    console.log('G1. Recording Invoice Payment...');
    const recordPayment = await apiRequest('POST', `/invoices/${invoiceId}/payment`, {
      amount: 300,
      paymentMethod: 'cash'
    }, receptToken);
    if (recordPayment.status !== 200 || !recordPayment.success) {
      throw new Error(`Record payment failed: ${JSON.stringify(recordPayment)}`);
    }
    console.log(`G1. Success. Paid: ${recordPayment.data.invoice.paidAmount}, Remaining: ${recordPayment.data.invoice.remainingAmount}, Status: ${recordPayment.data.invoice.status}`);

    // H. Try to Delete/Cancel invoice (Should Fail)
    console.log('H1. Attempting to delete partial invoice (Expects failure)...');
    const deleteInvoiceFail = await apiRequest('DELETE', `/invoices/${invoiceId}`, null, dirToken);
    if (deleteInvoiceFail.status !== 409) {
      throw new Error(`Delete partial invoice was expected to fail with 409 but returned: ${deleteInvoiceFail.status}`);
    }
    console.log('H1. Succeeded in failing (Returned 409 INVALID_STATE).');

    // I. Try to Delete patient (Should Fail due to invoice/appointment)
    console.log('I1. Attempting to delete patient with active records (Expects failure)...');
    const deletePatientFail = await apiRequest('DELETE', `/patients/${patientId}`, null, dirToken);
    if (deletePatientFail.status !== 409) {
      throw new Error(`Delete active patient was expected to fail with 409 but returned: ${deletePatientFail.status}`);
    }
    console.log('I1. Succeeded in failing (Returned 409 INVALID_STATE).');

    // J. Director changes Receptionist role to 'doctor'
    console.log('J1. Modifying user role (Triggers change_role audit log)...');
    const updateRole = await apiRequest('PUT', `/users/${receptId}`, {
      role: 'doctor'
    }, dirToken);
    if (updateRole.status !== 200 || !updateRole.success) {
      throw new Error(`Update user role failed: ${JSON.stringify(updateRole)}`);
    }
    console.log('J1. Success.');

    // K. Director modifies Consultation Fee
    console.log('K1. Modifying Settings consultation fee (Triggers modify_price audit log)...');
    const updateSetting = await apiRequest('PUT', `/settings`, {
      defaultConsultationFee: 600
    }, dirToken);
    if (updateSetting.status !== 200 || !updateSetting.success) {
      throw new Error(`Update Settings failed: ${JSON.stringify(updateSetting)}`);
    }
    console.log('K1. Success.');

    // L. Director queries Audit Logs
    console.log('L1. Fetching Audit Logs...');
    const auditLogs = await apiRequest('GET', '/audit-logs', null, dirToken);
    if (auditLogs.status !== 200 || !auditLogs.success) {
      throw new Error(`Fetch audit logs failed: ${JSON.stringify(auditLogs)}`);
    }
    
    const actions = auditLogs.data.map(log => log.action);
    console.log(`L1. Success. Logged actions: ${actions.join(', ')}`);
    if (!actions.includes('change_role')) {
      throw new Error('change_role action missing from audit logs');
    }
    if (!actions.includes('modify_price')) {
      throw new Error('modify_price action missing from audit logs');
    }

    // --- Scenario 2: Laboratory Critical Results Flow ---
    console.log('\n--- SCENARIO 2: Laboratory Critical Results Flow ---');

    // A. Create Doctor
    console.log('A2. Creating Doctor user...');
    const createDoc = await apiRequest('POST', '/users', {
      username: 'testdoctor2',
      password: 'docpassword',
      role: 'doctor',
      fullName: 'Test Doctor 2',
      email: 'doc2@test.com'
    }, dirToken);
    if (createDoc.status !== 201 || !createDoc.success) {
      throw new Error(`Create Doctor failed: ${JSON.stringify(createDoc)}`);
    }
    const docToken = (await apiRequest('POST', '/auth/login', { username: 'testdoctor2', password: 'docpassword' })).data.accessToken;
    console.log('A2. Success.');

    // B. Create Lab Technician
    console.log('B2. Creating Lab Technician user...');
    const createTech = await apiRequest('POST', '/users', {
      username: 'testtech',
      password: 'techpassword',
      role: 'lab_technician',
      fullName: 'Test Tech',
      email: 'tech@test.com'
    }, dirToken);
    if (createTech.status !== 201 || !createTech.success) {
      throw new Error(`Create Tech failed: ${JSON.stringify(createTech)}`);
    }
    const techToken = (await apiRequest('POST', '/auth/login', { username: 'testtech', password: 'techpassword' })).data.accessToken;
    console.log('B2. Success.');

    // C. Doctor creates Lab Request
    console.log('C2. Creating Lab Request...');
    const createLabReq = await apiRequest('POST', '/lab/requests', {
      patientId,
      tests: ['Glycémie à jeun'],
      priority: 'normal'
    }, docToken);
    if (createLabReq.status !== 201 || !createLabReq.success) {
      throw new Error(`Create Lab Request failed: ${JSON.stringify(createLabReq)}`);
    }
    const labReqId = createLabReq.data._id;
    console.log('C2. Success.');

    // D. Lab Tech gets pending list
    console.log('D2. Checking pending Lab Requests queue...');
    const pendingReqs = await apiRequest('GET', '/lab/requests/pending', null, techToken);
    if (pendingReqs.status !== 200 || !pendingReqs.success) {
      throw new Error(`Get pending lab requests failed: ${JSON.stringify(pendingReqs)}`);
    }
    console.log('D2. Success.');

    // E. Lab Tech enters critical result (Glycémie à jeun = 1.5 g/L, max threshold fallback is 1.10)
    console.log('E2. Entering results triggering critical threshold check...');
    const enterRes = await apiRequest('PUT', `/lab/requests/${labReqId}/results`, {
      results: [
        {
          testName: 'Glycémie à jeun',
          resultText: '1.50',
          resultNumeric: 1.50,
          unit: 'g/L',
          normalRange: '0.70-1.10'
        }
      ]
    }, techToken);
    if (enterRes.status !== 200 || !enterRes.success) {
      throw new Error(`Enter results failed: ${JSON.stringify(enterRes)}`);
    }
    console.log(`E2. Success. LabRequest critical flag: ${enterRes.data.labRequest.isCritical}, Detected tests: ${enterRes.data.criticalResults.join(', ')}`);
    if (!enterRes.data.labRequest.isCritical) {
      throw new Error('Result was expected to trigger critical flag, but it did not.');
    }

    // F. Doctor queries Critical Results
    console.log('F2. Fetching critical lab results...');
    const criticalResults = await apiRequest('GET', '/lab/results/critical', null, docToken);
    if (criticalResults.status !== 200 || !criticalResults.success) {
      throw new Error(`Get critical results failed: ${JSON.stringify(criticalResults)}`);
    }
    console.log(`F2. Success. Found ${criticalResults.data.length} critical results.`);
    if (criticalResults.data.length === 0) {
      throw new Error('No critical results returned from endpoint');
    }

    console.log('\n=======================================');
    console.log(' ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ');
    console.log('=======================================');

  } catch (err) {
    console.error('\n=======================================');
    console.error(' INTEGRATION TEST RUN FAILED! ');
    console.error('=======================================');
    console.error(err);
    process.exit(1);
  } finally {
    // 5. Clean up server and db connection
    if (server) {
      console.log('[Test] Closing server...');
      await new Promise((resolve) => server.close(resolve));
    }
    console.log('[Test] Disconnecting from database...');
    await mongoose.disconnect();
    console.log('[Test] Closed database connection.');
    process.exit(0);
  }
}

runTests();
