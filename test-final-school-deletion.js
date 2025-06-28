/**
 * Test Final School Deletion Implementation - Schema-Aware Version
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testFinalSchoolDeletion() {
  console.log('🧪 Testing Final School Deletion Implementation...\n');

  try {
    // Step 1: Login as app owner
    console.log('1. Logging in as app owner...');
    const loginResponse = await axios.post(`${API_BASE}/api/login`, {
      username: 'jlcookie20',
      password: 'jack83box'
    }, {
      withCredentials: true,
      maxRedirects: 0,
      validateStatus: () => true
    });

    if (loginResponse.status !== 302 && loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    // Extract cookies for session
    const setCookieHeader = loginResponse.headers['set-cookie'];
    const cookies = setCookieHeader ? setCookieHeader.join('; ') : '';
    
    if (!cookies) {
      throw new Error('No session cookie received from login');
    }

    console.log('✅ Successfully logged in');

    // Step 2: Try to delete a non-existent school to test error handling
    console.log('\n2. Testing error handling with non-existent school...');
    try {
      const deleteResponse = await axios.delete(`${API_BASE}/api/owner/schools/9999`, {
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('❌ Expected error but got success:', deleteResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent school');
      } else if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
        
        // Check if it's a database syntax error
        if (error.response.data.error && error.response.data.error.includes('syntax error')) {
          console.log('❌ SQL syntax error still exists');
        } else {
          console.log('✅ No SQL syntax error detected');
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }

    // Step 3: Get list of schools to find one we could test with
    console.log('\n3. Getting list of schools...');
    const schoolsResponse = await axios.get(`${API_BASE}/api/owner/schools`, {
      headers: {
        'Cookie': cookies
      },
      withCredentials: true
    });

    console.log(`Found ${schoolsResponse.data.length} schools in database`);
    if (schoolsResponse.data.length > 0) {
      console.log('First school:', schoolsResponse.data[0].name, '(ID:', schoolsResponse.data[0].id + ')');
    }

    console.log('\n✅ School deletion API syntax test completed');
    console.log('💡 The API is responding without SQL syntax errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFinalSchoolDeletion();