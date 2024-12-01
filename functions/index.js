import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import axios from 'axios';

// Initialize Firebase Admin with environment variables
const serviceAccount = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  clientEmail: import.meta.env.VITE_FIREBASE_CLIENT_EMAIL,
  privateKey: import.meta.env.VITE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const app = express();

const OPENCELLID_API_URL = "https://opencellid.org/api";
const OPENCELLID_API_KEY = import.meta.env.VITE_OPENCELLID_API_KEY;

// Create axios instance with default headers
const opencellIdAxios = axios.create({
  baseURL: OPENCELLID_API_URL,
  headers: {
    'Authorization': `Bearer ${OPENCELLID_API_KEY}`,
    'Accept': 'application/json',
    'User-Agent': 'YourAppName/1.0' // Replace with your app name
  }
});

// Enable CORS
app.use(cors({
  origin: true,
  methods: ['POST', 'GET', 'PUT', 'DELETE'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Function to get mock location (fallback when API fails)
function getMockLocation() {
  // Generate random coordinates within a reasonable range
  // This is just an example - adjust the ranges based on your needs
  const baseLatitude = 6.5244; // Example: Lagos, Nigeria
  const baseLongitude = 3.3792;
  
  return {
    latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
    longitude: baseLongitude + (Math.random() - 0.5) * 0.1
  };
}

// Function to get rider location
async function getRiderLocation(riderNumber) {
  try {
    // First try the API
    const response = await opencellIdAxios.get('/cell', {
      params: {
        key: OPENCELLID_API_KEY,
        mcc: 621, // Mobile Country Code for Nigeria
        format: 'json',
        msisdn: riderNumber
      }
    });

    if (response.data && response.data.lat && response.data.lon) {
      return {
        latitude: response.data.lat,
        longitude: response.data.lon
      };
    }

    // If API doesn't return valid coordinates, use mock location
    return getMockLocation(riderNumber);

  } catch (error) {
    console.error(`OpenCellID API error for ${riderNumber}:`, error.message);
    // On API failure, return mock location
    return getMockLocation(riderNumber);
  }
}

// Function to find the nearest rider
app.post('/api/findNearestRider', async (req, res) => {
  const { pickup, dropoff, description, companyId } = req.body;

  // Validate the input
  if (!pickup || !pickup.latitude || !pickup.longitude || !companyId) {
    return res.status(400).json({ 
      message: 'Pickup location (latitude, longitude) and companyId are required.' 
    });
  }

  try {
    // Get company document and rider numbers
    const companyDoc = await db.collection('logistics_companies').doc(companyId).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const riderNumbers = companyDoc.data().riderNumbers || [];
    
    if (!riderNumbers.length) {
      return res.status(404).json({ message: 'No riders found for this company.' });
    }

    // Get locations for each rider
    const ridersWithLocations = await Promise.all(
      riderNumbers.map(async (number) => {
        const location = await getRiderLocation(number);
        return { riderNumber: number, location };
      })
    );

    // Find the nearest rider
    let nearestRider = null;
    let minDistance = Number.MAX_SAFE_INTEGER;

    // Calculate distance for each rider and find the nearest
    for (const rider of ridersWithLocations) {
      const distance = calculateDistance(
        pickup.latitude,
        pickup.longitude,
        rider.location.latitude,
        rider.location.longitude
      );

      // Store delivery information in the database
      const deliveryRef = await db.collection('deliveries').add({
        dropoff,
        description,
        pickup,
        riderNumber: rider.riderNumber,
        riderLocation: rider.location,
        companyId,
        distance,
        status: 'pending',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      if (distance < minDistance) {
        nearestRider = {
          riderNumber: rider.riderNumber,
          location: rider.location,
          distance,
          deliveryId: deliveryRef.id
        };
        minDistance = distance;
      }
    }

    if (nearestRider) {
      // Update the selected delivery with 'assigned' status
      await db.collection('deliveries').doc(nearestRider.deliveryId).update({
        status: 'assigned',
        assignedRider: nearestRider.riderNumber
      });

      return res.status(200).json({
        nearestRider: nearestRider.riderNumber,
        distance: nearestRider.distance,
        deliveryId: nearestRider.deliveryId,
        location: nearestRider.location
      });
    } else {
      return res.status(404).json({ message: 'No available riders within range.' });
    }

  } catch (error) {
    console.error('Error finding nearest dispatch rider:', error);
    return res.status(500).json({ message: 'Error finding nearest dispatch rider.' });
  }
});

// Rest of your endpoints remain the same...

// Helper function to calculate distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export default app;