import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

// Function to find the nearest rider
export const findNearestRider = onRequest(async (req, res) => {
  const { latitude, longitude } = req.body;

  // Validate the input
  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude are required." });
  }

  try {
    // Query available riders
    const ridersSnapshot = await db
      .collection("dispatch_riders")
      .where("status", "==", "available")
      .get();

    // If no riders found
    if (ridersSnapshot.empty) {
      return res.status(404).json({ message: "No available dispatch riders found." });
    }

    let nearestRider = null;
    let minDistance = Number.MAX_SAFE_INTEGER;

    // Iterate through the available riders
    ridersSnapshot.forEach((doc) => {
      const rider = doc.data();
      const distance = calculateDistance(
        latitude,
        longitude,
        rider.location.latitude,
        rider.location.longitude
      );

      if (distance < minDistance) {
        nearestRider = { id: doc.id, ...rider };
        minDistance = distance;
      }
    });

    // Respond with the nearest rider
    return res.status(200).json({ nearestRider });
  } catch (error) {
    console.error("Error finding nearest dispatch rider:", error);
    return res.status(500).json({ message: "Error finding nearest dispatch rider." });
  }
});

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

// Convert degrees to radians
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}
