const { exec } = require('child_process');

exec('npx tsc --noEmit --skipLibCheck --incremental false', { timeout: 10000 }, (error, stdout, stderr) => {
  if (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      console.log('❌ TypeScript check timed out (taking too long)');
    } else {
      console.log('❌ TypeScript compilation errors found:');
      console.log(stderr || stdout);
    }
  } else {
    console.log('✅ TypeScript compilation successful!');
  }
});