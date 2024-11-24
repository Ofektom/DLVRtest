// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
// import express from 'express';
// import cors from 'cors';

// // Initialize Firebase Admin SDK
// admin.initializeApp();
// const db = admin.firestore();

// // Create the Express app
// const app = express();

// // Enable CORS for all origins
// app.use(cors({ origin: true }));

// // Function to find the nearest rider
// app.post('/findNearestRider', async (req, res) => {
//   const { pickup, dropoff, description, companyId, ridersNumbers, riderLocations } = req.body; // Get pickup, dropoff, description, companyId, ridersNumbers, and riderLocations from the request body

//   // Validate the input
//   if (!pickup || !pickup.latitude || !pickup.longitude || !companyId || !ridersNumbers || !riderLocations) {
//     return res.status(400).json({ message: 'Pickup location (latitude, longitude), companyId, ridersNumbers, and riderLocations are required.' });
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
//       return res.status(400).json({ message: 'Riders numbers and rider locations arrays must have the same length.' });
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

//       localStorage.setItem('dropoff', JSON.stringify(dropoff));
//       localStorage.setItem('description', JSON.stringify(description));   

//       // If this rider is closer, update nearestRider
//       if (distance < minDistance) {
//         nearestRider = { riderNumber, riderLocation, distance };
//         minDistance = distance;
//       }
//     }

//     // Respond with the nearest rider's phone number
//     if (nearestRider) {
//       return res.status(200).json({ nearestRider: nearestRider.riderNumber });
//     } else {
//       return res.status(404).json({ message: 'No available riders within range.' });
//     }
//   } catch (error) {
//     console.error('Error finding nearest dispatch rider:', error);
//     return res.status(500).json({ message: 'Error finding nearest dispatch rider.' });
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

// // Export the app to Firebase Functions
// export const api = functions.https.onRequest(app);
