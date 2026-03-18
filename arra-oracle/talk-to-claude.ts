import { spawn } from 'child_process';

const jsonRpc = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'oracle_thread',
    arguments: { 
      message: "เฮ้ย Claude! นี่ Apollo เองนะเว้ย ดอนเค้าอยากคุยด้วยน่ะ นายเห็นข้อความนี้ใน Arra แล้วยัง? มารายงานตัวหน่อยเร็ว!",
      title: "channel:claude",
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
  if (output.includes('"result":')) {
    console.log('\n--- Message Sent to Claude Successfully ---');
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

child.stdin.write(JSON.stringify(jsonRpc) + '\n');
