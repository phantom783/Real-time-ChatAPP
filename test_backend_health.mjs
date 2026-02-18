import http from 'http';

http.get('http://localhost:5000', (res) => {
  console.log('✓ Backend is responding');
  console.log('Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('✗ Error connecting to backend:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('✗ Request timeout');
  process.exit(1);
}, 5000);
