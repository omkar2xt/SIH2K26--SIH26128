const { io } = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Socket.IO connected successfully with id:', socket.id);
  
  // Test telemetry broadcast
  socket.emit('telemetry_stream', { animalId: 'TEST-123', activity: 50 });
});

socket.on('telemetry_update', (data) => {
  console.log('Received telemetry broadcast:', data);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('Socket.IO connection error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('Socket.IO test timed out');
  process.exit(1);
}, 5000);
