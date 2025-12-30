const { spawn } = require('child_process');
const server = spawn('node', ['server.js'], { stdio: 'pipe' });

let output = '';
let error = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('stdout:', data.toString());
});

server.stderr.on('data', (data) => {
  error += data.toString();
  console.error('stderr:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  console.log('Output:', output);
  console.log('Error:', error);
  process.exit(code);
});

// Kill after 5 seconds
setTimeout(() => {
  console.log('Killing server');
  server.kill();
  process.exit(0);
}, 5000);const server = spawn('node', ['server.js'], { stdio: 'pipe' });

let output = '';
let error = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('stdout:', data.toString());
});

server.stderr.on('data', (data) => {
  error += data.toString();
  console.error('stderr:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  console.log('Output:', output);
  console.log('Error:', error);
  process.exit(code);
});

// Kill after 5 seconds
setTimeout(() => {
  console.log('Killing server');
  server.kill();
  process.exit(0);
}, 5000);
