// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.findNearestRider = functions.https.onRequest(async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude are required." });
  }

  try {
    const ridersSnapshot = await db.collection("dispatch_riders").where("status", "==", "available").get();
    if (ridersSnapshot.empty) {
      return res.status(404).json({ message: "No available dispatch riders found." });
    }

    let nearestRider = null;
    let minDistance = Number.MAX_SAFE_INTEGER;

    ridersSnapshot.forEach((doc) => {
      const rider = doc.data();
      const distance = calculateDistance(latitude, longitude, rider.location.latitude, rider.location.longitude);
      if (distance < minDistance) {
        nearestRider = { id: doc.id, ...rider };
        minDistance = distance;
      }
    });

    return res.status(200).json({ nearestRider });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error finding nearest dispatch rider." });
  }
});

// Helper function to calculate distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
