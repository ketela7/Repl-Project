const { spawn } = require('child_process');

function checkTypeScript() {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsc', '--noEmit'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ timedOut: true, output: 'TypeScript check timed out' });
    }, 15000);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code,
        output: output + errorOutput,
        timedOut: false
      });
    });
  });
}

async function main() {
  console.log('Checking TypeScript compilation...');
  const result = await checkTypeScript();
  
  if (result.timedOut) {
    console.log('⏰ TypeScript check timed out');
    return;
  }

  if (result.code === 0) {
    console.log('✅ TypeScript compilation successful!');
  } else {
    console.log('❌ TypeScript errors found:');
    console.log(result.output);
  }
}

main().catch(console.error);