import { useState, useEffect, useRef } from "react";
import { db } from "../config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const RegisterAndMap = () => {
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    whatsapp_number: "",
    latitude: "",
    longitude: "",
  });
  const [errors, setErrors] = useState({});
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      const snapshot = await getDocs(collection(db, "logistics_companies"));
      setCompanies(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
        componentRestrictions: { country: "us" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const location = place.geometry.location;
          setFormData({
            ...formData,
            latitude: location.lat(),
            longitude: location.lng(),
          });
        }
      });
    }
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Company name is required";
    if (!formData.whatsapp_number) newErrors.whatsapp_number = "Whatsapp number is required";
    if (!formData.latitude || !formData.longitude) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const location = { latitude: formData.latitude, longitude: formData.longitude };
      await addDoc(collection(db, "logistics_companies"), { ...formData, location });
      alert("Company registered successfully!");
      setFormData({ name: "", whatsapp_number: "", latitude: "", longitude: "" });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleBooking = (company) => {
    fetch("https://<your-function-url>/findNearestRider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company.location),
    })
      .then((response) => response.json())
      .then((data) => alert(`Nearest Rider: ${data.nearestRider.name}`))
      .catch((error) => console.error("Error booking rider:", error));
  };

  return (
    <div className="flex h-screen">
      {/* Form Section */}
      <div className="w-1/3 p-4 bg-gray-100">
        <h1 className="text-lg font-bold mb-4">Register Logistics Company</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Company Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            {errors.name && <span className="text-red-500">{errors.name}</span>}
          </div>
          <div>
            <label className="block mb-1">Whatsapp Number</label>
            <input
              type="text"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              className="w-full p-2 border rounded"
            />
            {errors.whatsapp_number && <span className="text-red-500">{errors.whatsapp_number}</span>}
          </div>
          <div>
            <label className="block mb-1">Location</label>
            <input
              ref={autocompleteRef}
              className="w-full p-2 border rounded"
              placeholder="Search location"
            />
            {errors.location && <span className="text-red-500">{errors.location}</span>}
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Register
          </button>
        </form>
      </div>

      {/* Map Section */}
      <div className="w-2/3">
        <MapContainer center={[0, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {companies.map((company) => (
            <Marker
              key={company.id}
              position={[company.location.latitude, company.location.longitude]}
            >
              <Popup>
                <p className="font-bold">{company.name}</p>
                <p>Whatsapp: {company.whatsapp_number}</p>
                <button
                  onClick={() => handleBooking(company)}
                  className="bg-blue-500 text-white p-1 rounded mt-2"
                >
                  Book Now
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default RegisterAndMap;
