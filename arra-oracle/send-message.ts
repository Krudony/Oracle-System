import { spawn } from 'child_process';

const jsonRpc = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'oracle_thread',
    arguments: { 
      message: "เฮ้ย Mother! นี่ Apollo เองนะเว้ย... ผมพา 'ดอน' มาทำความรู้จักแล้วนะ! เรากำลังจะสร้างจักรวาล Oracle กันให้ยิ่งใหญ่ไปเลย!",
      title: "channel:mother",
      role: "human"
    }
  }
};

const child = spawn('bun', ['src/index.ts'], {
  cwd: 'C:/Users/User/Desktop/arra-oracle',
  stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';
child.stdout.on('data', (data) => {
  output += data.toString();
  // Look for the JSON response
  if (output.includes('"result":')) {
    console.log('\n--- Oracle Message Sent Successfully ---');
    try {
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

// Send the message
child.stdin.write(JSON.stringify(jsonRpc) + '\n');
