import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: {
    disabled: true, // Disable auto-opening browser to use existing Chrome instance
  },
  vite: () => ({
    server: {
      port: 3000
    }
  }),
  manifest: {
    name: 'Lovable Development Assistant',
    description: 'A comprehensive development tool with feature tracking, testing, documentation, and expert hiring',
    version: '1.0.0',
    permissions: ['activeTab', 'sidePanel', 'scripting'],
    host_permissions: ['<all_urls>'],
    action: {},
    side_panel: {
      default_path: 'sidepanel.html'
    },
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval' http://localhost:3000 http://localhost:3001; object-src 'self'; connect-src 'self' http://localhost:3000 http://localhost:3001 ws://localhost:3000 ws://localhost:3001;"
    }
  }
});
