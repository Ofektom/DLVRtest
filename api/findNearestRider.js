// api/findNearestRider.js
import admin from 'firebase-admin';
import cors from 'cors';
import axios from 'axios';
//import { configDotenv } from 'dotenv';
import dotenv from 'dotenv';

//configDotenv.config();
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL
};

// Initialize Firebase only once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const db = admin.firestore();

// Create axios instance for OpenCellID
const opencellIdAxios = axios.create({
  baseURL: 'https://opencellid.org/api',
  headers: {
    'Authorization': `Bearer ${process.env.OPENCELLID_API_KEY}`,
    'Accept': 'application/json',
    'User-Agent': 'DLVApp/1.0'
  }
});

// Function to get mock location
function getMockLocation() {
  const baseLatitude = 6.5244; // Lagos
  const baseLongitude = 3.3792;
  
  return {
    latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
    longitude: baseLongitude + (Math.random() - 0.5) * 0.1
  };
}

// Function to get rider location
async function getRiderLocation(riderNumber) {
  try {
    const response = await opencellIdAxios.get('/cell', {
      params: {
        mcc: 621, // Nigeria
        format: 'json',
        msisdn: riderNumber
      }
    });

    if (response.data?.lat && response.data?.lon) {
      return {
        latitude: response.data.lat,
        longitude: response.data.lon
      };
    }
    return getMockLocation();
  } catch (error) {
    console.error(`OpenCellID API error for ${riderNumber}:, error.message`);
    return getMockLocation();
  }
}

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// API handler
export default async function handler(req, res) {
  // Enable CORS
  await new Promise((resolve, reject) => {
    cors({ origin: true })(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const { pickup, dropoff, description, companyId } = req.body;

  // Validate input
  if (!pickup?.latitude || !pickup?.longitude || !dropoff?.latitude || !dropoff?.longitude || !companyId) {
    return res.status(400).json({
      success: false,
      message: 'Pickup location, dropoff location, and companyId are required.'
    });
  }

  try {
    // Get company and available riders
    const companyDoc = await db.collection('logistics_companies').doc(companyId).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    const riderNumbers = companyDoc.data().riderNumbers || [];
    
    if (!riderNumbers.length) {
      return res.status(404).json({
        success: false,
        message: 'No riders found for this company.'
      });
    }

    // Check for busy riders
    const activeDeliveriesSnapshot = await db.collection('deliveries')
      .where('companyId', '==', companyId)
      .where('status', 'in', ['assigned', 'in_progress'])
      .get();

    const busyRiders = new Set();
    activeDeliveriesSnapshot.forEach(doc => {
      busyRiders.add(doc.data().assignedRider);
    });

    const availableRiders = riderNumbers.filter(number => !busyRiders.has(number));

    if (!availableRiders.length) {
      return res.status(404).json({
        success: false,
        message: 'No available riders at the moment.'
      });
    }

    // Get locations for available riders
    const ridersWithLocations = await Promise.all(
      availableRiders.map(async (number) => {
        const location = await getRiderLocation(number);
        return { riderNumber: number, location };
      })
    );

    // Find nearest rider
    let nearestRider = null;
    let minDistance = Number.MAX_SAFE_INTEGER;
    const MAX_DISTANCE = 20; // 20km radius

    for (const rider of ridersWithLocations) {
      const distance = calculateDistance(
        pickup.latitude,
        pickup.longitude,
        rider.location.latitude,
        rider.location.longitude
      );

      if (distance < minDistance && distance <= MAX_DISTANCE) {
        nearestRider = {
          riderNumber: rider.riderNumber,
          location: rider.location,
          distance
        };
        minDistance = distance;
      }
    }

    if (!nearestRider) {
      return res.status(404).json({
        success: false,
        message: 'No riders available within acceptable distance.'
      });
    }

    // Create delivery record
    const deliveryRef = await db.collection('deliveries').add({
      dropoff,
      pickup,
      description,
      companyId,
      riderNumber: nearestRider.riderNumber,
      riderLocation: nearestRider.location,
      distance: nearestRider.distance,
      status: 'assigned',
      assignedRider: nearestRider.riderNumber,
      estimatedDuration: Math.round((nearestRider.distance / 30) * 60), // 30km/h average speed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      deliveryId: deliveryRef.id,
      rider: {
        number: nearestRider.riderNumber,
        distance: nearestRider.distance,
        location: nearestRider.location,
        estimatedDuration: Math.round((nearestRider.distance / 30) * 60)
      }
    });

  } catch (error) {
    console.error('Error finding nearest dispatch rider:', error);
    return res.status(500).json({
      success: false,
      message: 'Error finding nearest dispatch rider.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}