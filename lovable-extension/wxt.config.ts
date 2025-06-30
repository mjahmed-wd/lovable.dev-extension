import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: {
    disabled: true, // Disable auto-opening browser to use existing Chrome instance
  },
  manifest: {
    name: 'Lovable Development Assistant',
    description: 'A comprehensive development tool with feature tracking, testing, documentation, and expert hiring',
    version: '1.0.0',
    permissions: ['activeTab', 'sidePanel', 'scripting'],
    action: {},
    side_panel: {
      default_path: 'sidepanel.html'
    }
  }
});
