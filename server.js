'use strict';

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');
const fs         = require('fs');
const open       = require('open');   // v8 — CommonJS compatible

// ── pkg-safe paths ───────────────────────────────────────────────────
// pkg only guarantees inclusion of files that are explicitly require()'d.
// We require() the HTML files as text so pkg always bundles them.
// At runtime we serve the string directly — no filesystem access needed.
const IS_PKG = typeof process.pkg !== 'undefined';
const LOGS_DIR = IS_PKG
  ? path.join(path.dirname(process.execPath), 'logs')
  : path.join(__dirname, 'logs');

// These require() calls are what make pkg include the files in the snapshot.
// In dev they just read from disk normally.
const DISPLAY_HTML    = fs.readFileSync(path.join(__dirname, 'public', 'display.html'),    'utf8');
const CONTROLLER_HTML = fs.readFileSync(path.join(__dirname, 'public', 'controller.html'), 'utf8');

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

// ── Express + Socket.IO ──────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.json());
// ── Session API ──────────────────────────────────────────────────────
app.post('/api/save-session', (req, res) => {
  const filename = `session_${Date.now()}.json`;
  fs.writeFileSync(path.join(LOGS_DIR, filename), JSON.stringify(req.body, null, 2));
  console.log(`📝  Session saved → ${filename}`);
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

// ── Page routes ──────────────────────────────────────────────────────
// Serve the pre-loaded HTML strings directly — no filesystem access at request time.
app.get('/',           (_req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(DISPLAY_HTML); });
app.get('/controller', (_req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(CONTROLLER_HTML); });

// ── Socket rooms ─────────────────────────────────────────────────────
const displays    = new Set();
const controllers = new Set();

function notifyControllers() {
  controllers.forEach(id => io.to(id).emit('status', { displays: displays.size }));
}

io.on('connection', (socket) => {
  console.log(`🔌  Connected: ${socket.id}`);

  socket.on('register', (role) => {
    if (role === 'display') {
      displays.add(socket.id);
      console.log(`📺  Display registered (${displays.size} active)`);
      notifyControllers();
    } else if (role === 'controller') {
      controllers.add(socket.id);
      console.log(`🎮  Controller registered`);
      socket.emit('status', { displays: displays.size });
    }
  });

  socket.on('command', (data) => {
    if (!controllers.has(socket.id)) return;
    console.log(`📡  Command [${data.type}]:`, JSON.stringify(data));
    displays.forEach(id => io.to(id).emit('command', data));
  });

  socket.on('slider_position', (data) => {
    if (!controllers.has(socket.id)) return;
    console.log(`🎚️  Slider: ${data.cm} cm`);
    controllers.forEach(id => io.to(id).emit('slider_position', data));
  });

  socket.on('disconnect', () => {
    const d = displays.delete(socket.id);
    const c = controllers.delete(socket.id);
    console.log(`🔌  Disconnected: ${socket.id}${d ? ' (display)' : ''}${c ? ' (controller)' : ''}`);
    notifyControllers();
  });
});

// ── Start ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  const ctrl = `http://localhost:${PORT}/controller`;
  const disp = `http://localhost:${PORT}/`;

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║        Landolt C  —  Vision Test Server          ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🎮 Controller  →  ${ctrl.padEnd(30)}║`);
  console.log(`║  📺 Display     →  ${disp.padEnd(30)}║`);
  console.log('║                                                  ║');
  console.log('║  Press  Ctrl + C  to stop                        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // open v8: open(url) returns a Promise — no callback needed
  setTimeout(() => open(ctrl).catch(() =>
    console.log(`⚠  Could not auto-open browser. Go to: ${ctrl}`)
  ), 800);
});