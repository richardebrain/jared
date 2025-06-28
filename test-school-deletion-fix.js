/**
 * Test School Deletion API Fixes
 * Tests that the syntax errors are resolved and school deletion works properly
 */

import axios from 'axios';

async function testSchoolDeletion() {
  try {
    console.log('🧪 Testing School Deletion API Fixes...\n');

    // First, login as app owner (jlcookie20)
    console.log('1. Logging in as app owner...');
    const loginResponse = await axios.post('http://localhost:5000/api/login', {
      username: 'jlcookie20',
      password: 'test123'
    }, {
      withCredentials: true
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    console.log('Login response headers:', loginResponse.headers);
    console.log('Set-Cookie header:', loginResponse.headers['set-cookie']);

    // Extract session cookie
    const sessionCookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0];
    if (!sessionCookie) {
      throw new Error('No session cookie received');
    }

    console.log('✅ Login successful');

    // Check if school ID 5 exists first
    console.log('\n2. Checking if school exists...');
    const schoolsResponse = await axios.get('http://localhost:5000/api/owner/schools', {
      headers: {
        'Cookie': sessionCookie
      }
    });

    const schools = schoolsResponse.data;
    const targetSchool = schools.find(s => s.id === 5);
    
    if (!targetSchool) {
      console.log('❌ School ID 5 does not exist. Creating test school first...');
      
      // Create a test school
      const createResponse = await axios.post('http://localhost:5000/api/owner/schools', {
        name: 'Test School for Deletion',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        contactEmail: 'test@school.com'
      }, {
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Test school created:', createResponse.data);
      
      // Use the newly created school ID
      const schoolId = createResponse.data.id;
      
      // Now test deletion
      console.log(`\n3. Testing deletion of school ID ${schoolId}...`);
      const deleteResponse = await axios.delete(`http://localhost:5000/api/owner/schools/${schoolId}`, {
        headers: {
          'Cookie': sessionCookie
        }
      });

      console.log('✅ School deletion successful!');
      console.log('Response:', JSON.stringify(deleteResponse.data, null, 2));
      
    } else {
      console.log(`✅ School ID 5 exists: ${targetSchool.name}`);
      
      // Test deletion
      console.log('\n3. Testing deletion of school ID 5...');
      const deleteResponse = await axios.delete('http://localhost:5000/api/owner/schools/5', {
        headers: {
          'Cookie': sessionCookie
        }
      });

      console.log('✅ School deletion successful!');
      console.log('Response:', JSON.stringify(deleteResponse.data, null, 2));
    }

    console.log('\n🎉 All tests passed! The SQL syntax errors have been fixed.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    
    if (error.message.includes('syntax error')) {
      console.error('\n🔧 SQL syntax error still present - need to investigate further');
    }
  }
}

testSchoolDeletion();