#!/usr/bin/env node
// bundle.js — run before pkg to inline HTML into server.bundle.js
// pkg can then bundle server.bundle.js with zero file dependencies.
'use strict';
const fs   = require('fs');
const path = require('path');

const displayHtml    = fs.readFileSync(path.join(__dirname, 'public', 'display.html'),    'utf8');
const controllerHtml = fs.readFileSync(path.join(__dirname, 'public', 'controller.html'), 'utf8');

// JSON.stringify produces a safe JS string literal (escapes backticks, backslashes, etc.)
const injection = `
// ── Inlined HTML (injected by bundle.js at build time) ───────────────
const DISPLAY_HTML    = ${JSON.stringify(displayHtml)};
const CONTROLLER_HTML = ${JSON.stringify(controllerHtml)};
`;

let src = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

// Replace the two readFileSync lines with the inlined constants
src = src.replace(
  /\/\/ These require\(\) calls.*?\nconst DISPLAY_HTML.*?\nconst CONTROLLER_HTML.*?\n/s,
  injection
);

fs.writeFileSync(path.join(__dirname, 'server.bundle.js'), src);
console.log('server.bundle.js written — HTML inlined, ready for pkg');