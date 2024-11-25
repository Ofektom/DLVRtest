import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS and JSON parsing
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.PROJECT_ID,
  private_key: process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.CLIENT_EMAIL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Function to calculate distance using Haversine formula
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
        message: 'Pickup location and companyId are required.',
      });
    }
  
    try {
      // Get company document and rider numbers
      const companyDoc = await db.collection('logistics_companies').doc(companyId).get();
      if (!companyDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Company not found.',
        });
      }
  
      const riderNumbers = companyDoc.data().riderNumbers || [];
      console.log('Found rider numbers:', riderNumbers);
  
      if (!riderNumbers.length) {
        return res.status(404).json({
          success: false,
          message: 'No riders found for this company.',
        });
      }
  
      // Mock rider details (this will later be fetched from NIMC or other sources)
      const riders = riderNumbers.map((number) => ({
        name: `Rider ${number.slice(-4)}`, // Placeholder name based on phone number
        phoneNumber: number,
        location: getMockLocation(), // Replace this with actual GPS data from the rider's device
      }));
  
      // Find the nearest rider
      let nearestRider = null;
      let minDistance = Number.MAX_SAFE_INTEGER;
  
      for (const rider of riders) {
        const distance = calculateDistance(
          pickup.latitude,
          pickup.longitude,
          rider.location.latitude,
          rider.location.longitude
        );
  
        if (distance < minDistance) {
          nearestRider = { ...rider, distance };
          minDistance = distance;
        }
      }
  
      if (!nearestRider) {
        return res.status(404).json({
          success: false,
          message: 'No available riders found.',
        });
      }
  
      // Create delivery record
      const deliveryRef = await db.collection('deliveries').add({
        dropoff,
        description,
        pickup,
        riderNumber: nearestRider.phoneNumber,
        riderLocation: nearestRider.location,
        companyId,
        distance: nearestRider.distance,
        status: 'assigned',
        assignedRider: nearestRider.phoneNumber,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  
      console.log('Created delivery:', deliveryRef.id);
  
      return res.status(200).json({
        success: true,
        deliveryId: deliveryRef.id,
        rider: {
          name: nearestRider.name,
          phoneNumber: nearestRider.phoneNumber,
          distance: nearestRider.distance,
          location: nearestRider.location,
        },
      });
    } catch (error) {
      console.error('Error finding nearest rider:', error);
      return res.status(500).json({
        success: false,
        message: 'Error finding nearest dispatch rider.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });  

export default app;
