import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import PropTypes from 'prop-types'; 

const UpdateRiderLocation = ({ companyId, riderPhoneNumber }) => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId || !riderPhoneNumber) return;
    const fetchRiderLocation = async () => {
      setLoading(true);
      try {
        const companyRef = doc(db, "logistics_companies", companyId);
        // Fetch rider data by phone number
        const companyDoc = await companyRef.get();
        if (companyDoc.exists()) {
          const rider = companyDoc.data().riders.find(
            (rider) => rider.phoneNumber === riderPhoneNumber
          );
          if (rider) {
            setLocation(rider.location);
          }
        }
      } catch (error) {
        console.error("Error fetching rider location: ", error);
      }
      setLoading(false);
    };
    fetchRiderLocation();
  }, [companyId, riderPhoneNumber]);

  const updateRiderLocation = async () => {
    setLoading(true);
    try {
      const companyRef = doc(db, "logistics_companies", companyId);
      await updateDoc(companyRef, {
        riders: [
          {
            phoneNumber: riderPhoneNumber,
            location,
          },
        ],
      });
      alert("Rider location updated successfully!");
    } catch (error) {
      console.error("Error updating rider location: ", error);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Update Rider Location</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div>
            <label>Latitude:</label>
            <input
              type="number"
              value={location.latitude || ""}
              onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
            />
          </div>
          <div>
            <label>Longitude:</label>
            <input
              type="number"
              value={location.longitude || ""}
              onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
            />
          </div>
          <button onClick={updateRiderLocation}>Update Location</button>
        </>
      )}
    </div>
  );
};


// PropTypes Validation
UpdateRiderLocation.propTypes = {
  companyId: PropTypes.string.isRequired,
  riderPhoneNumber: PropTypes.string.isRequired
};

export default UpdateRiderLocation;
