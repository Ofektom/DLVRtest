// api/config/env.js
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV, process.cwd(), '');

export const config = {
  firebase: { 
    type: "service_account",
    project_id: env.PROJECT_ID || process.env.PROJECT_ID,
    private_key_id: env.PRIVATE_KEY_ID || process.env.PRIVATE_KEY_ID,
    private_key: (env.PRIVATE_KEY || process.env.PRIVATE_KEY)?.replace(/\\n/g, '\n'),
    client_email: env.CLIENT_EMAIL || process.env.CLIENT_EMAIL,
    client_id: env.CLIENT_ID || process.env.CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: env.CLIENT_CERT_URL || process.env.CLIENT_CERT_URL
  },
  opencellid: {
    apiKey: env.API_KEY || process.env.API_KEY,
    baseUrl: "https://opencellid.org/api"
  }
};