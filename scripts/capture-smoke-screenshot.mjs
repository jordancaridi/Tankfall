import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const resolveArtifactDir = () => {
  const tag = process.env.GITHUB_SHA?.slice(0, 7) ?? new Date().toISOString().replace(/[:.]/g, '-');
  return path.join('artifacts', 'screenshots', 'smoke', tag);
};

const waitForServer = async (url, timeoutMs = 120000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Server did not become ready at ${url}`);
};

const run = async () => {
  const server = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '4173'], {
    stdio: 'inherit',
    shell: true
  });

  try {
    await waitForServer('http://127.0.0.1:4173');

    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto('http://127.0.0.1:4173/?testMode=1&seed=123');
    await page.waitForFunction(() => window.__GAME_READY__ === true);

    const artifactDir = resolveArtifactDir();
    if (!existsSync(artifactDir)) {
      await mkdir(artifactDir, { recursive: true });
    }

    const output = path.join(artifactDir, 'game.png');
    await page.screenshot({ path: output, fullPage: true });
    await browser.close();
    console.log(`Screenshot saved: ${output}`);
  } finally {
    server.kill('SIGTERM');
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
