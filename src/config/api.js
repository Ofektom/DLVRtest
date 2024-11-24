const API_URL = import.meta.env
  ? '' // Empty string for production (same domain)
  : 'http://localhost:3000';

export const findNearestRider = async (data) => {
  try {
    const response = await fetch(`${API_URL}/api/findNearestRider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error finding nearest rider:', error);
    throw error;
  }
};