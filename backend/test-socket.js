cat > (test - socket.js) << 'EOF';
const { io } = require('socket.io-client');

const socket = io('http://127.0.0.1:3000', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('✅ Conectado local a NestJS:', socket.id);
  socket.close();
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.error('❌ Falla la conexión local:', err.message);
  process.exit(1);
});
EOF;
