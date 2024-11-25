// // dev.js
// import app from './api/index.js';

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`API server running on http://localhost:${PORT}`);
// });

// dev.js
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import app from './api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: resolve(__dirname, '.env.local') });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Environment:', {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    PRIVATE_KEY_EXISTS: !!process.env.FIREBASE_PRIVATE_KEY
  });
});