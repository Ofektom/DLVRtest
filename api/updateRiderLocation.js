// api/updateRiderLocation.js
import cors from 'cors';
import { db } from './config/firebase.js';

const corsMiddleware = cors({ origin: true });

export default async function handler(req, res) {
  // Handle CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { companyId, riderNumber, location } = req.body;

  if (!companyId || !riderNumber || !location?.latitude || !location?.longitude) {
    return res.status(400).json({
      success: false,
      message: 'Company ID, rider number, and location are required'
    });
  }

  try {
    const companyRef = db.collection('logistics_companies').doc(companyId);
    await companyRef.update({
      [`riderLocations.${riderNumber}`]: {
        ...location, 
        lastUpdated: new Date().toISOString()
      }, 
      lastUpdated: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Rider location updated successfully'
    });
  } catch (error) {
    console.error('Error updating rider location:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating rider location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}