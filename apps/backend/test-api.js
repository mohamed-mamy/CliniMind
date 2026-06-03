const http = require('http');

const request = (method, path, data, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

(async () => {
  try {
    // 1. Login as admin
    const loginRes = await request('POST', '/v1/auth/login', { username: 'admin', password: 'adminpassword' });
    console.log('Login:', loginRes);
    const token = loginRes.data.accessToken;

    // 2. Create user (Doctor)
    const docRes = await request('POST', '/v1/users', {
      username: 'testdoc1',
      password: 'docpassword',
      fullName: 'Test Doc',
      email: 'doc@doc.com',
      role: 'doctor'
    }, token);
    console.log('Create Doctor:', docRes);

    // 3. Create user (Director - should fail)
    const dirRes = await request('POST', '/v1/users', {
      username: 'testdir1',
      password: 'dirpassword',
      fullName: 'Test Dir',
      email: 'dir@dir.com',
      role: 'director'
    }, token);
    console.log('Create Director:', dirRes);

  } catch (err) {
    console.error(err);
  }
})();
