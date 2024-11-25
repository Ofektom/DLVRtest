// // api/config/firebase.js
// import admin from 'firebase-admin';

// if (!admin.apps.length) {
//   try {
//     admin.initializeApp({
//       credential: admin.credential.cert({
//         type: "service_account",
//         project_id: process.env.PROJECT_ID,
//         private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
//         client_email: process.env.CLIENT_EMAIL,
//       })
//     });
//   } catch (error) {
//     console.error('Firebase admin initialization error:', error);
//   }
// }

// export const db = admin.firestore();


// api/config/firebase.js
import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Log the service account details (except private key) for debugging
    console.error('Service Account Details:', {
      ...serviceAccount,
      private_key: serviceAccount.private_key ? '[PRIVATE_KEY_EXISTS]' : '[PRIVATE_KEY_MISSING]'
    });
    throw error;
  }
}

const db = admin.firestore();

export { db };