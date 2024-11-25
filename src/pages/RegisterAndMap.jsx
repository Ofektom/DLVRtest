import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { db } from "../config/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icon
const customMarkerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const RegisterAndMap = () => {
  const [companies, setCompanies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [riderNumbers, setRiderNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(""); 
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const snapshot = await getDocs(collection(db, "logistics_companies"));
        const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error fetching companies: ", error);
      }
    };
    fetchCompanies();
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching location data: ", error);
    }
  };

  const handleLocationSelect = (location) => {
    setValue("latitude", location.lat);
    setValue("longitude", location.lon);
    setSuggestions([]);
  };

  const addRiderNumber = () => {
    if (currentNumber) {
      setRiderNumbers((prev) => [...prev, currentNumber]);
      setCurrentNumber(""); // Reset the input
    }
  };

  const removeRiderNumber = (index) => {
    setRiderNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const onRegisterSubmit = async (data) => {
    try {
      const location = { latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude) };
      const newCompany = { ...data, location, riderNumbers };
      await addDoc(collection(db, "logistics_companies"), newCompany);
      alert("Company registered successfully!");
      reset();
      setRiderNumbers([]);
      setCompanies((prev) => [...prev, newCompany]);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };


  const handleOrderSubmit = async (e, companyId) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const pickup = formData.get("pickup");
    const dropoff = formData.get("dropoff");
    const description = formData.get("description");

    // Fetch latitude and longitude based on the pickup location
    const pickupLocation = await getLocationCoordinates(pickup);

    try {
      const response = await fetch("http://localhost:3000/api/findNearestRider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: pickupLocation,
          dropoff,
          description,
          companyId,
        }),
      });
      const riders = await response.json();
      setAvailableRiders(riders);
    } catch (error) {
      console.error("Error fetching available riders: ", error);
    }
  };
  
  const getLocationCoordinates = async (pickupLocation) => {
    // Use a geocoding service to get coordinates (e.g., OpenStreetMap Nominatim API)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${pickupLocation}&format=json&addressdetails=1&limit=1`
    );
    const data = await response.json();
    return {
      latitude: data[0]?.lat,
      longitude: data[0]?.lon,
    };
  };

  return (
    <div className="flex h-screen">
      {/* Registration Form */}
      <div className="w-1/3 p-4 bg-gray-100">
        <h1 className="text-lg font-bold mb-4">Register Company</h1>
        <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1">Company Name</label>
            <input {...register("name", { required: true })} className="w-full p-2 border rounded" />
            {errors.name && <span className="text-red-500">Company name is required</span>}
          </div>
          <div>
            <label className="block mb-1">Whatsapp Number</label>
            <input {...register("whatsapp_number", { required: true })} className="w-full p-2 border rounded" />
            {errors.whatsapp_number && <span className="text-red-500">Whatsapp number is required</span>}
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input {...register("email", { required: true })} className="w-full p-2 border rounded" />
            {errors.email && <span className="text-red-500">Email is required</span>}
          </div>
          <div>
            <label className="block mb-1">Location</label>
            <input
              onChange={(e) => fetchSuggestions(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Search location"
            />
            {suggestions.length > 0 && (
              <ul className="border p-2 mt-2 bg-white rounded shadow">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="cursor-pointer hover:bg-gray-200 p-1"
                    onClick={() => handleLocationSelect(suggestion)}
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input {...register("latitude", { required: true })} hidden />
          <input {...register("longitude", { required: true })} hidden />
          <div>
            <label className="block mb-1">Add Phone Number of Riders</label>
            <div className="flex items-center">
              <PhoneInput
                defaultCountry="NG"
                value={currentNumber}
                onChange={setCurrentNumber}
                className="w-full p-2 border rounded mr-2"
              />
              <button type="button" onClick={addRiderNumber} className="bg-blue-500 text-white p-2 rounded">Add</button>
            </div>
            <ul className="mt-2">
              {riderNumbers.map((number, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-200 p-2 rounded mb-1">
                  {number}
                  <button type="button" onClick={() => removeRiderNumber(index)} className="text-red-500">Remove</button>
                </li>
              ))}
            </ul>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Register</button>
        </form>
      </div>

      {/* Map */}
      <div className="w-2/3">
        <MapContainer center={[0, 0]} zoom={4} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {companies.map((company) => (
            <Marker
              key={company.id}
              position={[company.location.latitude, company.location.longitude]}
              icon={customMarkerIcon}
            >
              <Popup>
                <div>
                  <p><strong>{company.name}</strong></p>
                  <p>Whatsapp: {company.whatsapp_number}</p>
                  <p>Email: {company.email}</p>
                  <form onSubmit={(e) => handleOrderSubmit(e, company.id)}>
                    <input type="text" name="pickup" placeholder="Pickup point" className="w-full p-2 border rounded mb-2" />
                    <input type="text" name="dropoff" placeholder="Dropoff point" className="w-full p-2 border rounded mb-2" />
                    <textarea name="description" placeholder="Description" className="w-full p-2 border rounded mb-2"></textarea>
                    <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Submit</button>
                  </form>
                  {availableRiders.length > 0 && (
                    <div>
                      <h4>Available Riders</h4>
                      <ul>
                        {availableRiders.map((rider, index) => (
                          <li key={index}>{rider.name} - {rider.distance} km away</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default RegisterAndMap;
