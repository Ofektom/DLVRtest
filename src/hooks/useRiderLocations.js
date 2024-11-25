// 


// src/hooks/useRiderLocations.js
import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";

const useRiderLocations = (companyId) => {
  const [ridersNumbers, setRiderNumbers] = useState([]);
  const [riderLocations, setRiderLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch rider phone numbers from Firebase
  useEffect(() => {
    const fetchRiderNumbers = async () => {
      try {
        const companyRef = doc(db, "logistics_companies", companyId);
        const companyDoc = await getDoc(companyRef);
        if (companyDoc.exists()) {
          setRiderNumbers(companyDoc.data().riderNumbers || []);
        } else {
          console.error("No such company found");
        }
      } catch (err) {
        console.error("Error fetching rider numbers: ", err);
        setError("Failed to fetch rider numbers.");
      }
    };

    if (companyId) {
      fetchRiderNumbers();
    }
  }, [companyId]);

  // Fetch locations through your backend API
  useEffect(() => {
    const fetchRiderLocations = async () => {
      if (!ridersNumbers.length || !companyId) return;
  
      setLoading(true);
      setError(null);
  
      try {
        const response = await fetch('/api/getRiderLocations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId,
            riderNumbers: ridersNumbers
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rider locations');
        }

        const data = await response.json();
        if (data.success) {
          setRiderLocations(data.locations);
        } else {
          throw new Error(data.message || 'Failed to fetch locations');
        }
      } catch (err) {
        console.error("Error fetching rider locations: ", err);
        setError(err.message || "Failed to fetch rider locations.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchRiderLocations();
  }, [ridersNumbers, companyId]);

  return { ridersNumbers, riderLocations, loading, error };
};

export default useRiderLocations;