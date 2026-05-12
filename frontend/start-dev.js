#!/usr/bin/env node
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
require('child_process').spawn('npm', ['run', 'dev'], { 
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true 
});
