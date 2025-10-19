#!/usr/bin/env node
const { spawn } = require('child_process');

const project = process.env.CF_PAGES_PROJECT || 'fletcherphotobooth';
const args = ['pages','deploy','.', '--project-name', project];

const p = spawn('npx', ['wrangler', ...args], { stdio:'inherit', shell:true });
p.on('exit', (code)=> process.exit(code||0));

