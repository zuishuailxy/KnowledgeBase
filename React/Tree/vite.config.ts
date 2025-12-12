import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins:[react()],
  root: path.resolve(__dirname, 'example'),
  server:{
    port: 3000,
    open: true
  }
});