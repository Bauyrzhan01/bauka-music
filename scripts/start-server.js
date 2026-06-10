const { execSync } = require('child_process');
const path = require('path');

const PORT = 3001;

function killProcessOnPort(port) {
  if (process.platform !== 'win32') return;

  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: 'utf8',
    });
    const pids = new Set();

    output
      .trim()
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && pid !== '0') pids.add(pid);
      });

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[server] Остановлен старый процесс на порту ${port} (PID ${pid})`);
      } catch {
        // already stopped
      }
    });
  } catch {
    // port is free
  }
}

killProcessOnPort(PORT);
require(path.join(__dirname, '..', 'server', 'index.js'));
