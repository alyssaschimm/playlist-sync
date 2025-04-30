// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  define: {
    'process.env': {}
  }
});

// .env (create this file in the root of your project)
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
REACT_APP_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
REACT_APP_REDIRECT_URI=http://localhost:3000/callback/spotify
REACT_APP_APPLE_DEVELOPER_TOKEN=your_apple_developer_token

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

// .gitignore
node_modules
dist
dist-ssr
*.local
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```