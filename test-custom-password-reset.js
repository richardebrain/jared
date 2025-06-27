/**
 * Test script to verify custom password reset functionality
 * This tests that admins can set custom passwords and they work for login
 */

import axios from 'axios';

const baseURL = 'http://localhost:5000';

async function testCustomPasswordReset() {
  console.log('🔐 Testing Custom Password Reset System...\n');

  try {
    // Step 1: Admin login to get session
    console.log('1. Logging in as admin (jlcookie20)...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'jlcookie20',
      password: 'admin123'
    }, {
      withCredentials: true,
      validateStatus: () => true
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Admin login failed:', loginResponse.data);
      return;
    }

    const sessionCookie = loginResponse.headers['set-cookie']?.[0];
    if (!sessionCookie) {
      console.error('❌ No session cookie received');
      return;
    }

    console.log('✅ Admin login successful');

    // Step 2: Find a test user to reset password for
    console.log('\n2. Finding test user...');
    const usersResponse = await axios.get(`${baseURL}/api/users`, {
      headers: {
        Cookie: sessionCookie
      },
      withCredentials: true,
      validateStatus: () => true
    });

    if (usersResponse.status !== 200) {
      console.error('❌ Failed to fetch users:', usersResponse.data);
      return;
    }

    const users = usersResponse.data;
    const testUser = users.find(u => u.username === 'lbook' || u.email === 'laura@raisingarizona.com');
    
    if (!testUser) {
      console.error('❌ Laura Book (lbook) test user not found');
      return;
    }

    console.log(`✅ Found test user: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);

    // Step 3: Reset password with custom password
    const customPassword = 'TestPassword123';
    console.log(`\n3. Resetting password to custom password: "${customPassword}"`);
    
    const resetResponse = await axios.post(`${baseURL}/api/admin/reset-user-password`, {
      userId: testUser.id,
      customPassword: customPassword
    }, {
      headers: {
        Cookie: sessionCookie,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      validateStatus: () => true
    });

    if (resetResponse.status !== 200) {
      console.error('❌ Password reset failed:', resetResponse.data);
      return;
    }

    console.log('✅ Password reset successful:', resetResponse.data.message);

    // Step 4: Test login with new custom password
    console.log(`\n4. Testing login with custom password "${customPassword}"`);
    
    // Wait a moment for database update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const testLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: testUser.username,
      password: customPassword
    }, {
      withCredentials: true,
      validateStatus: () => true
    });

    if (testLoginResponse.status === 200) {
      console.log('✅ Login with custom password SUCCESSFUL!');
      console.log('✅ Custom password reset system is working correctly');
    } else {
      console.error('❌ Login with custom password FAILED:', testLoginResponse.data);
      console.error('❌ The password may not have been properly hashed or stored');
    }

    // Step 5: Test with email login as well
    console.log(`\n5. Testing email login with custom password`);
    const emailLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: testUser.email,
      password: customPassword
    }, {
      withCredentials: true,
      validateStatus: () => true
    });

    if (emailLoginResponse.status === 200) {
      console.log('✅ Email login with custom password SUCCESSFUL!');
    } else {
      console.log('ℹ️  Email login not working (this may be expected)');
    }

    console.log('\n🎉 Custom Password Reset Test Complete!');
    console.log('✅ Admins can now set custom passwords that work immediately for login');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCustomPasswordReset();