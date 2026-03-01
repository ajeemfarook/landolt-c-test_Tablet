const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');
const fs      = require('fs');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// ── Static + JSON middleware ─────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Session log storage ──────────────────────────────────────────────────────
const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

app.post('/api/save-session', (req, res) => {
  const session  = req.body;
  const filename = `session_${Date.now()}.json`;
  fs.writeFileSync(path.join(LOGS_DIR, filename), JSON.stringify(session, null, 2));
  console.log(`📝  Session saved → logs/${filename}`);
  res.json({ ok: true, filename });
});

app.get('/api/sessions', (req, res) => {
  try {
    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, f)));
        return { filename: f, ...data };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Page routes ──────────────────────────────────────────────────────────────
app.get('/',           (req, res) => res.sendFile(path.join(__dirname, 'public', 'display.html')));
app.get('/controller', (req, res) => res.sendFile(path.join(__dirname, 'public', 'controller.html')));

// ── Socket rooms ─────────────────────────────────────────────────────────────
const displays     = new Set();   // socket IDs registered as display
const controllers  = new Set();   // socket IDs registered as controller

function notifyControllers() {
  controllers.forEach(id =>
    io.to(id).emit('status', { displays: displays.size })
  );
}

io.on('connection', (socket) => {
  console.log(`🔌  Connected: ${socket.id}`);

  // Devices self-identify on connect
  socket.on('register', (role) => {
    if (role === 'display') {
      displays.add(socket.id);
      console.log(`📺  Display registered (${displays.size} active)`);
      notifyControllers();
    } else if (role === 'controller') {
      controllers.add(socket.id);
      console.log(`🎮  Controller registered`);
      // Tell this controller how many displays are live right now
      socket.emit('status', { displays: displays.size });
    }
  });

  // Controller → Display(s): typed command objects
  socket.on('command', (data) => {
    if (!controllers.has(socket.id)) return;   // only controllers may send commands
    console.log(`📡  Command [${data.type}]:`, JSON.stringify(data));
    displays.forEach(id => io.to(id).emit('command', data));
  });

  socket.on('disconnect', () => {
    const wasDisplay    = displays.delete(socket.id);
    const wasController = controllers.delete(socket.id);
    console.log(`🔌  Disconnected: ${socket.id}${wasDisplay ? ' (display)' : ''}${wasController ? ' (controller)' : ''}`);
    notifyControllers();
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀  Server running on http://localhost:${PORT}`);
  console.log(`   Display    →  http://localhost:${PORT}/`);
  console.log(`   Controller →  http://localhost:${PORT}/controller\n`);
});
