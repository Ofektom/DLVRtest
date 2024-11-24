import { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";

const OPENCELLID_API_URL = "https://opencellid.org/api";
const OPENCELLID_API_KEY = import.meta.env.VITE_OPENCELLID_API_KEY;

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

    fetchRiderNumbers();
  }, [companyId]);

  // Fetch real-time locations of riders using OpenCellID
  useEffect(() => {
    const fetchRiderLocations = async () => {
      if (!ridersNumbers.length) return;
  
      setLoading(true);
      setError(null);
  
      try {
        const locationPromises = ridersNumbers.map((number) =>
          axios.get(`${OPENCELLID_API_URL}/get?key=${OPENCELLID_API_KEY}&msisdn=${number}`)
        );
        const locationResponses = await Promise.all(locationPromises);
        const locations = locationResponses.map((response) => response.data.location);
        setRiderLocations(locations);
      } catch (err) {
        console.error("Error fetching rider locations: ", err);
        setError("Failed to fetch rider locations.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchRiderLocations();
  }, [ridersNumbers]);

  return { ridersNumbers, riderLocations, loading, error };
};

export default useRiderLocations;
