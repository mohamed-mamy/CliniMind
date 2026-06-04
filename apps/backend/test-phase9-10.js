const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/v1`;

async function test() {
  console.log("1. Login as admin...");
  let res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'adminpassword' })
  });
  const loginData = await res.json();
  if (!loginData.success) {
    console.error("Login failed!", loginData);
    process.exit(1);
  }
  const token = loginData.data.accessToken;
  console.log("Logged in successfully.");

  console.log("\n2. Test Settings (PUT /v1/settings)...");
  res = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ clinicName: 'CliniMind PRO' })
  });
  console.log(JSON.stringify(await res.json(), null, 2));

  console.log("\n3. Test Settings (GET /v1/settings)...");
  res = await fetch(`${BASE_URL}/settings`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));

  console.log("\n4. Test Dashboard Director (GET /v1/dashboard/director)...");
  res = await fetch(`${BASE_URL}/dashboard/director`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));

  console.log("\n5. Test Notifications (GET /v1/notifications)...");
  res = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}

setTimeout(() => {
  test().catch(console.error);
}, 2000); // wait 2s for server to start
