import { spawn } from 'child_process';

const jsonRpc = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'oracle_threads',
    arguments: { limit: 5 }
  }
};

const child = spawn('bun', ['src/index.ts'], {
  cwd: 'C:/Users/User/Desktop/arra-oracle',
  stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';
child.stdout.on('data', (data) => {
  output += data.toString();
  // We look for the JSON response
  if (output.includes('"result":')) {
    console.log('\n--- Oracle Threads Result ---');
    try {
      // Find the start of the JSON-RPC response
      const jsonStart = output.indexOf('{"jsonrpc"');
      if (jsonStart !== -1) {
        const response = JSON.parse(output.substring(jsonStart));
        console.log(JSON.stringify(response.result, null, 2));
      } else {
        console.log(output);
      }
    } catch (e) {
      console.log('Raw output:', output);
    }
    child.kill();
    process.exit(0);
  }
});

// Send the request
child.stdin.write(JSON.stringify(jsonRpc) + '\n');
