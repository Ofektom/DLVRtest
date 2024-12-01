import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Log environment variables (excluding sensitive data)
console.log('Environment Variables Check:', {
  PROJECT_ID: process.env.PROJECT_ID ? 'Present' : 'Missing',
  CLIENT_EMAIL: process.env.CLIENT_EMAIL ? 'Present' : 'Missing',
  PRIVATE_KEY: process.env.PRIVATE_KEY ? 'Present' : 'Missing',
  OPENCELLID_API_KEY: process.env.OPENCELLID_API_KEY ? 'Present' : 'Missing'
});

const app = express();

// Enable CORS and JSON parsing
app.use(cors({ 
  origin: true,
  methods: ['POST', 'GET', 'PUT', 'DELETE'],
  credentials: true
 }));
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.PROJECT_ID,
  private_key: process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.CLIENT_EMAIL
};

// Debug: Log service account (excluding private key)
console.log('Service Account:', {
  type: serviceAccount.type,
  project_id: serviceAccount.project_id,
  client_email: serviceAccount.client_email,
  private_key: serviceAccount.private_key ? 'Present' : 'Missing'
});

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    process.exit(1); // Exit if Firebase fails to initialize
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

console.log('OpenCellId API details', opencellIdAxios);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
        key: process.env.OPENCELLID_API_KEY,
        mcc: 621,
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
    console.error(`OpenCellID API error for ${riderNumber}:`, error.message);
    return getMockLocation();
  }
}

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Find nearest rider endpoint
app.post('/api/findNearestRider', async (req, res) => {
  console.log('Received request:', req.body);

  const { pickup, dropoff, description, companyId } = req.body;

  // Validate input
  if (!pickup?.latitude || !pickup?.longitude || !companyId) {
    return res.status(400).json({
      success: false,
      message: 'Pickup location and companyId are required.'
    });
  }

  try {
    // Get company document and rider numbers
    const companyDoc = await db.collection('logistics_companies').doc(companyId).get();

    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    const riderNumbers = companyDoc.data().riderNumbers || [];
    console.log('Found rider numbers:', riderNumbers);

    if (!riderNumbers.length) {
      return res.status(404).json({
        success: false,
        message: 'No riders found for this company.'
      });
    }

    // Get locations for each rider
    const ridersWithLocations = await Promise.all(
      riderNumbers.map(async (number) => {
        // Fetch rider details from the 'riders' collection
        const riderDoc = await db.collection('riders').doc(number).get();
    
        let rider;
        if (riderDoc.exists) {
          rider = riderDoc.data(); // Use existing rider data
        } else {
          // Create a new rider document with basic information
          rider = { name: 'Unknown Rider', phoneNumber: number };
          await db.collection('riders').doc(number).set(rider);
          console.log(`Created new rider document for number: ${number}`);
        }
    
        // Get the rider's location
        const location = await getRiderLocation(number);
    
        return { location, name: rider.name, phoneNumber: rider.phoneNumber };
      })
    );
    
    console.log('Riders with locations:', ridersWithLocations);

    // Handle single rider case
    if (ridersWithLocations.length === 1) {
      const [rider] = ridersWithLocations;

      return res.status(200).json({
        success: true,
        rider: {
          name: rider.name,
          phoneNumber: rider.phoneNumber,
          location: rider.location,
          distance: calculateDistance(
            pickup.latitude,
            pickup.longitude,
            rider.location.latitude,
            rider.location.longitude
          ),
        },
      });
    }


    // Find the nearest rider
    let nearestRider = null;
    let minDistance = Number.MAX_SAFE_INTEGER;

    for (const rider of ridersWithLocations) {
      const distance = calculateDistance(
        pickup.latitude,
        pickup.longitude,
        rider.location.latitude,
        rider.location.longitude
      );


      if (distance < minDistance) {
        nearestRider = {
          ...rider,
          distance
        };
        minDistance = distance;
      }
    }

    if (!nearestRider) {
      return res.status(404).json({
        success: false,
        message: 'No available riders found.'
      });
    }

     // Create delivery record
     const deliveryRef = await db.collection('deliveries').add({
      dropoff,
      description,
      pickup,
      riderName: nearestRider.name,
      riderNumber: nearestRider.phoneNumber,
      riderLocation: nearestRider.location,
      companyId,
      distance: nearestRider.distance,
      status: 'assigned',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Created delivery:', deliveryRef.id);


    return res.status(200).json({
      success: true,
      deliveryId: deliveryRef.id,
      rider: {
        name: nearestRider.name,
        phoneNumber: nearestRider.phoneNumber,
        location: nearestRider.location,
        distance: nearestRider.distance
      }
    });

  } catch (error) {
    console.error('Error finding nearest rider:', error);
    return res.status(500).json({
      success: false,
      message: 'Error finding nearest dispatch rider.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default app;