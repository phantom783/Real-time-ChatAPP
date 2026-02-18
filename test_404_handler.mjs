import http from 'http';

// Test 404 endpoint
http.get('http://localhost:5000/api/nonexistent', (res) => {
  console.log('✓ 404 handler responded');
  console.log('Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('✗ Request timeout');
  process.exit(1);
}, 5000);
