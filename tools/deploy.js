#!/usr/bin/env node
const { spawn } = require('child_process');

if (process.env.CF_PAGES) {
  console.log('Skipping wrangler deploy inside Cloudflare Pages build (CF_PAGES detected).');
  process.exit(0);
}

const project = process.env.CF_PAGES_PROJECT || 'octoberphotobooth';
const args = ['pages','deploy','.', '--project-name', project];

const p = spawn('npx', ['wrangler', ...args], { stdio:'inherit', shell:true });
p.on('exit', (code)=> process.exit(code||0));
