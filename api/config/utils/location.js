// api/utils/location.js
import axios from 'axios';

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
export function getMockLocation() {
  const baseLatitude = 6.5244; // Lagos
  const baseLongitude = 3.3792;
  
  return {
    latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
    longitude: baseLongitude + (Math.random() - 0.5) * 0.1
  };
}

// Function to get rider location
export async function getRiderLocation(riderNumber) {
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
    console.error(`OpenCellID API error for ${riderNumber}:`, error.message);
    return getMockLocation();
  }
}

// Calculate distance using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
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