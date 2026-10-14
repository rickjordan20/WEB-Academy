const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  projects: [
    { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },
  ],
});
