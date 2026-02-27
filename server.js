const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/controller', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'controller.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

io.on('connection', (socket) => {
  console.log('✅ Device connected');
  socket.on('control', (data) => {
    console.log('Command received:', data);
    io.emit('control', data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`Controller → http://localhost:${PORT}/controller`);
  console.log(`Display    → http://localhost:${PORT}`);
});