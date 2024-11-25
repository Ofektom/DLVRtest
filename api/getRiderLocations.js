// api/getRiderLocations.js
import cors from 'cors';
import { db } from './config/firebase.js';
import { getRiderLocation } from './utils/location.js';

// Enable CORS middleware
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

  const { companyId, riderNumbers } = req.body;

  if (!companyId || !riderNumbers?.length) {
    return res.status(400).json({
      success: false,
      message: 'Company ID and rider numbers are required'
    });
  }

  try {
    const locations = await Promise.all(
      riderNumbers.map(async (number) => {
        const location = await getRiderLocation(number);
        return {
          riderNumber: number,
          location,
          timestamp: new Date().toISOString()
        };
      })
    );

    // Update locations in Firestore
    const companyRef = db.collection('logistics_companies').doc(companyId);
    await companyRef.update({
      riderLocations: locations.reduce((acc, { riderNumber, location, timestamp }) => ({
        ...acc,
        [riderNumber]: { ...location, lastUpdated: timestamp }
      }), {}),
      lastUpdated: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Error fetching rider locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching rider locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}