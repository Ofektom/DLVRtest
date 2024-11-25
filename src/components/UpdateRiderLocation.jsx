// import { useState, useEffect } from "react";
// import { db } from "../config/firebase";
// import { doc, updateDoc } from "firebase/firestore";
// import PropTypes from 'prop-types'; 

// const UpdateRiderLocation = ({ companyId, riderPhoneNumber }) => {
//   const [location, setLocation] = useState({ latitude: null, longitude: null });
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!companyId || !riderPhoneNumber) return;
//     const fetchRiderLocation = async () => {
//       setLoading(true);
//       try {
//         const companyRef = doc(db, "logistics_companies", companyId);
//         // Fetch rider data by phone number
//         const companyDoc = await companyRef.get();
//         if (companyDoc.exists()) {
//           const rider = companyDoc.data().riders.find(
//             (rider) => rider.phoneNumber === riderPhoneNumber
//           );
//           if (rider) {
//             setLocation(rider.location);
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching rider location: ", error);
//       }
//       setLoading(false);
//     };
//     fetchRiderLocation();
//   }, [companyId, riderPhoneNumber]);

//   const updateRiderLocation = async () => {
//     setLoading(true);
//     try {
//       const companyRef = doc(db, "logistics_companies", companyId);
//       await updateDoc(companyRef, {
//         riders: [
//           {
//             phoneNumber: riderPhoneNumber,
//             location,
//           },
//         ],
//       });
//       alert("Rider location updated successfully!");
//     } catch (error) {
//       console.error("Error updating rider location: ", error);
//     }
//     setLoading(false);
//   };

//   return (
//     <div>
//       <h2>Update Rider Location</h2>
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <>
//           <div>
//             <label>Latitude:</label>
//             <input
//               type="number"
//               value={location.latitude || ""}
//               onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
//             />
//           </div>
//           <div>
//             <label>Longitude:</label>
//             <input
//               type="number"
//               value={location.longitude || ""}
//               onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
//             />
//           </div>
//           <button onClick={updateRiderLocation}>Update Location</button>
//         </>
//       )}
//     </div>
//   );
// };


// // PropTypes Validation
// UpdateRiderLocation.propTypes = {
//   companyId: PropTypes.string.isRequired,
//   riderPhoneNumber: PropTypes.string.isRequired
// };

// export default UpdateRiderLocation;


// src/components/UpdateRiderLocation.jsx
import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import PropTypes from 'prop-types';

const UpdateRiderLocation = ({ companyId, riderPhoneNumber }) => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId || !riderPhoneNumber) return;

    const fetchRiderLocation = async () => {
      setLoading(true);
      try {
        const companyRef = doc(db, "logistics_companies", companyId);
        const companyDoc = await getDoc(companyRef);
        
        if (companyDoc.exists()) {
          const riderLocations = companyDoc.data().riderLocations || {};
          if (riderLocations[riderPhoneNumber]) {
            setLocation(riderLocations[riderPhoneNumber]);
          }
        }
      } catch (error) {
        console.error("Error fetching rider location: ", error);
        setError("Failed to fetch rider location");
      } finally {
        setLoading(false);
      }
    };

    fetchRiderLocation();
  }, [companyId, riderPhoneNumber]);

  const updateRiderLocation = async () => {
    if (!location.latitude || !location.longitude) {
      setError("Please enter both latitude and longitude");
      return;
    }

    setLoading(true);
    try {
      const companyRef = doc(db, "logistics_companies", companyId);
      
      // Update rider location in the riderLocations map
      await updateDoc(companyRef, {
        [riderLocations.${riderPhoneNumber}]: location,
        updatedAt: new Date().toISOString()
      });

      // Also update the location in your backend
      const response = await fetch('/api/updateRiderLocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          riderNumber: riderPhoneNumber,
          location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location in backend');
      }

      alert("Rider location updated successfully!");
    } catch (error) {
      console.error("Error updating rider location: ", error);
      setError("Failed to update rider location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Update Rider Location</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude:</label>
            <input
              type="number"
              step="any"
              value={location.latitude || ""}
              onChange={(e) => setLocation({ ...location, latitude: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude:</label>
            <input
              type="number"
              step="any"
              value={location.longitude || ""}
              onChange={(e) => setLocation({ ...location, longitude: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={updateRiderLocation}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update Location
          </button>
        </div>
      )}
    </div>
  );
};

UpdateRiderLocation.propTypes = {
  companyId: PropTypes.string.isRequired,
  riderPhoneNumber: PropTypes.string.isRequired
};

export default UpdateRiderLocation;
