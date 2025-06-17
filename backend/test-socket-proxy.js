// test-socket-proxy.js
const { io } = require('socket.io-client');

const socket = io('https://193.146.34.10', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 5000,
  secure: true,
});

socket.on('connect', () => {
  console.log('✅ Conectado a través de Nginx:', socket.id);
  socket.close();
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.error('❌ Error proxy de conexión:', err.message);
  process.exit(1);
});
