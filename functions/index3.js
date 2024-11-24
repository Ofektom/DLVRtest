// import express from 'express';
// import admin from 'firebase-admin';
// import cors from 'cors';

// // Initialize Firebase Admin with environment variables
// const serviceAccount = {
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   clientEmail: import.meta.env.VITE_FIREBASE_CLIENT_EMAIL,
//   privateKey: import.meta.env.VITE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
// };


// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
// }

// const db = admin.firestore();
// const app = express();

// // Enable CORS
// app.use(cors({
//   origin: true,
//   methods: ['POST', 'GET', 'PUT', 'DELETE'],
//   credentials: true
// }));

// // Parse JSON bodies
// app.use(express.json());

// // Function to find the nearest rider
// app.post('/api/findNearestRider', async (req, res) => {
//   const { pickup, dropoff, description, companyId, ridersNumbers, riderLocations } = req.body;

//   // Validate the input
//   if (!pickup || !pickup.latitude || !pickup.longitude || !companyId || !ridersNumbers || !riderLocations) {
//     return res.status(400).json({ 
//       message: 'Pickup location (latitude, longitude), companyId, ridersNumbers, and riderLocations are required.' 
//     });
//   }

//   try {
//     // Query the company document by companyId
//     const companyDoc = await db.collection('logistics_companies').doc(companyId).get();
    
//     // If company is not found
//     if (!companyDoc.exists) {
//       return res.status(404).json({ message: 'Company not found.' });
//     }

//     // Validate that the ridersNumbers and riderLocations arrays match
//     if (ridersNumbers.length !== riderLocations.length) {
//       return res.status(400).json({ 
//         message: 'Riders numbers and rider locations arrays must have the same length.' 
//       });
//     }

//     // Iterate through the rider locations and find the nearest rider
//     let nearestRider = null;
//     let minDistance = Number.MAX_SAFE_INTEGER;

//     // Iterate over each rider's location and calculate the distance to the pickup location
//     for (let i = 0; i < ridersNumbers.length; i++) {
//       const riderLocation = riderLocations[i];
//       const riderNumber = ridersNumbers[i];

//       // Calculate the distance from the pickup location to the rider's location
//       const distance = calculateDistance(
//         pickup.latitude,
//         pickup.longitude,
//         riderLocation.latitude,
//         riderLocation.longitude
//       );

//       // Store delivery information in the database
//       const deliveryRef = await db.collection('deliveries').add({
//         dropoff,
//         description,
//         pickup,
//         riderNumber,
//         companyId,
//         distance,
//         status: 'pending',
//         timestamp: admin.firestore.FieldValue.serverTimestamp()
//       });

//       // If this rider is closer, update nearestRider
//       if (distance < minDistance) {
//         nearestRider = { 
//           riderNumber, 
//           riderLocation, 
//           distance,
//           deliveryId: deliveryRef.id 
//         };
//         minDistance = distance;
//       }
//     }

//     // Respond with the nearest rider's information
//     if (nearestRider) {
//       // Update the selected delivery with 'assigned' status
//       await db.collection('deliveries').doc(nearestRider.deliveryId).update({
//         status: 'assigned',
//         assignedRider: nearestRider.riderNumber
//       });

//       return res.status(200).json({ 
//         nearestRider: nearestRider.riderNumber,
//         distance: nearestRider.distance,
//         deliveryId: nearestRider.deliveryId
//       });
//     } else {
//       return res.status(404).json({ message: 'No available riders within range.' });
//     }
//   } catch (error) {
//     console.error('Error finding nearest dispatch rider:', error);
//     return res.status(500).json({ message: 'Error finding nearest dispatch rider.' });
//   }
// });

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ 
//     status: 'ok',
//     timestamp: new Date().toISOString()
//   });
// });

// // Get delivery status
// app.get('/api/delivery/:deliveryId', async (req, res) => {
//   try {
//     const deliveryDoc = await db.collection('deliveries').doc(req.params.deliveryId).get();
    
//     if (!deliveryDoc.exists) {
//       return res.status(404).json({ message: 'Delivery not found.' });
//     }

//     return res.status(200).json(deliveryDoc.data());
//   } catch (error) {
//     console.error('Error getting delivery status:', error);
//     return res.status(500).json({ message: 'Error getting delivery status.' });
//   }
// });

// // Update delivery status
// app.put('/api/delivery/:deliveryId', async (req, res) => {
//   const { status } = req.body;
  
//   if (!status) {
//     return res.status(400).json({ message: 'Status is required.' });
//   }

//   try {
//     await db.collection('deliveries').doc(req.params.deliveryId).update({
//       status,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     });

//     return res.status(200).json({ message: 'Delivery status updated successfully.' });
//   } catch (error) {
//     console.error('Error updating delivery status:', error);
//     return res.status(500).json({ message: 'Error updating delivery status.' });
//   }
// });

// // Helper function to calculate distance (Haversine formula)
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Earth's radius in km
//   const dLat = degreesToRadians(lat2 - lat1);
//   const dLon = degreesToRadians(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(degreesToRadians(lat1)) *
//       Math.cos(degreesToRadians(lat2)) *
//       Math.sin(dLon / 2) ** 2;
//   return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
// }

// // Convert degrees to radians
// function degreesToRadians(degrees) {
//   return degrees * (Math.PI / 180);
// }

// // Export the Express app handler for Vercel
// module.exports = app;