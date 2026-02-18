import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

async function testAuthFlow() {
  try {
    console.log('\n========== AUTH FLOW TEST ==========\n');

    // Test 1: Sign up
    console.log('1️⃣ Testing SIGN UP...');
    const signupPayload = {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'Password123'
    };

    let signupRes;
    try {
      signupRes = await axios.post(`${API_URL}/sign-up`, signupPayload, { timeout: 5000 });
      console.log('✓ Sign up successful');
      console.log('User ID:', signupRes.data.userId);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message.includes('already exists')) {
        console.log('⚠️ User already exists, continuing to login test...');
      } else {
        console.error('✗ Sign up failed:', err.response?.data?.message || err.message);
        return;
      }
    }

    // Test 2: Login
    console.log('\n2️⃣ Testing LOGIN...');
    const loginPayload = {
      email: 'test@example.com',
      password: 'Password123'
    };

    console.log('Sending payload:', loginPayload);
    const loginRes = await axios.post(`${API_URL}/login`, loginPayload, { timeout: 5000 });
    console.log('✓ Login successful');
    console.log('Token:', loginRes.data.token.substring(0, 20) + '...');
    console.log('User:', loginRes.data.user);

    console.log('\n========== ALL TESTS PASSED ==========\n');
  } catch (err) {
    console.error('\n✗ Test failed:');
    console.error('Status:', err.response?.status);
    console.error('Message:', err.response?.data?.message || err.message);
    console.error('Full Error:', err.response?.data || err);
  }
}

testAuthFlow();
