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
 const [riderNumbers, setRiderNumbers] = useState([]);
 const [currentNumber, setCurrentNumber] = useState("");
 const [riderPhoneNumber, setRiderPhoneNumber] = useState("");
 const [riderName, setRiderName] = useState("");
 const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();
 const [pickupSuggestions, setPickupSuggestions] = useState([]);
 const [dropoffSuggestions, setDropoffSuggestions] = useState([]);


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




 const fetchSuggestions = async (query, type) => {
   if (query.length < 3) {
     if (type === "pickup") setPickupSuggestions([]);
     else if (type === "dropoff") setDropoffSuggestions([]);
     else setSuggestions([]); // Clear suggestions for the general case
     return;
   }
    try {
     const response = await fetch(
       `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5`
     );
     const data = await response.json();
      if (type === "pickup") {
       setPickupSuggestions(data);
     } else if (type === "dropoff") {
       setDropoffSuggestions(data);
     } else {
       setSuggestions(data); // Previous general functionality
     }
   } catch (error) {
     console.error("Error fetching location data: ", error);
   }
 };




 const handleLocationSelect = (location, type) => {
   const { lat, lon, display_name } = location;
    if (type === "pickup") {
     // Handle pickup-specific logic
     setValue("pickup_latitude", lat);
     setValue("pickup_longitude", lon);
     setValue("pickup_address", display_name);
     setPickupSuggestions([]);
   } else if (type === "dropoff") {
     // Handle dropoff-specific logic
     setValue("dropoff_latitude", lat);
     setValue("dropoff_longitude", lon);
     setValue("dropoff_address", display_name);
     setDropoffSuggestions([]);
   } else {
     // General location logic for onRegisterSubmit
     setValue("latitude", lat);
     setValue("longitude", lon);
     setValue("address", display_name);
     setSuggestions([]);
   }
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
     const location = {
       latitude: parseFloat(data.latitude),
       longitude: parseFloat(data.longitude),
       address: data.address, // Include address in the payload
     };
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
   const pickup = formData.get("pickup").trim();
   const dropoff = formData.get("dropoff").trim();
   const description = formData.get("description").trim();


   if (!pickup || !dropoff) {
     alert("Both pickup and dropoff locations are required.");
     return;
   }


   console.log("Pickup:", pickup);
   console.log("Dropoff:", dropoff);


   const pickupLocation = await getLocationCoordinates(pickup);
   const dropoffLocation = await getLocationCoordinates(dropoff)


   try {
     const response = await fetch("http://localhost:3000/api/findNearestRider", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         pickup: pickupLocation,
         dropoff: dropoffLocation,
         description,
         companyId,
       }),
     });


     const result = await response.json();


     if (response.ok) {
       alert(`Rider found! Name: ${result.rider.name}, Phone: ${result.rider.phoneNumber}`);
       setRiderPhoneNumber(result.rider.phoneNumber);
       setRiderName(result.rider.name || "Unknown Rider");
     } else {
       const errorMessage = result.message || "An error occurred while finding a rider.";
       alert(errorMessage);
       console.error("Error finding rider:", result);
     }
   } catch (error) {
     console.error("Error fetching available rider:", error);
     alert("Unable to connect to the server. Please try again later.");
   }
 };




 const getLocationCoordinates = async (location) => {
   // Use a geocoding service to get coordinates (e.g., OpenStreetMap Nominatim API)
   const response = await fetch(
     `https://nominatim.openstreetmap.org/search?q=${location}&format=json&addressdetails=1&limit=1`
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
           <label className="block mb-1">Address</label>
           <input
             {...register("address", { required: true })}
             onChange={(e) => fetchSuggestions(e.target.value)}
             className="w-full p-2 border rounded"
             placeholder="Search location"
           />
           {errors.address && <span className="text-red-500">Address is required</span>}
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
         <div>
           <label className="block mb-1">Whatsapp Number</label>
           <input {...register("whatsapp_number", { required: true })} className="w-full p-2 border rounded" />
           {errors.whatsapp_number && <span className="text-red-500">Whatsapp number is required</span>}
         </div>
         <div>
           <label className="block mb-1">Email</label>
           <input {...register("email", { required: false })} className="w-full p-2 border rounded" />
         </div>
         <input {...register("latitude", { required: true })} hidden />
         <input {...register("longitude", { required: true })} hidden />
         <div>
           <label className="block mb-1">Riders Phone Number</label>
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
                 <p>Address: {company.address}</p>
                 <p>Phone: {company.whatsapp_number}</p>
                 <p>Email: {company.email}</p>
                 <p><strong>Place Order</strong></p>
                 <form onSubmit={(e) => handleOrderSubmit(e, company.id)}>
                  <input type="text" name="pickup" 
                         placeholder="Pickup point" 
                         onChange={(e) => fetchSuggestions(e.target.value, "pickup")} 
                         className="w-full p-2 border rounded mb-2" />
                  {pickupSuggestions.length > 0 && (
                    <ul className="border p-2 mt-2 bg-white rounded shadow">
                      {pickupSuggestions.map((suggestion, index) => (
                        <li key={index} className="cursor-pointer hover:bg-gray-200 p-1" 
                            onClick={() => handleLocationSelect(suggestion, "pickup")}>
                          {suggestion.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <input type="text" name="dropoff"
                         placeholder="Dropoff point" 
                         onChange={(e) => fetchSuggestions(e.target.value, "dropoff")} 
                         className="w-full p-2 border rounded mb-2" />
                  {dropoffSuggestions.length > 0 && (
                    <ul className="border p-2 mt-2 bg-white rounded shadow">
                      {dropoffSuggestions.map((suggestion, index) => (
                        <li key={index} className="cursor-pointer hover:bg-gray-200 p-1" 
                            onClick={() => handleLocationSelect(suggestion, "dropoff")}>
                          {suggestion.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <textarea name="description" placeholder="Description" 
                            className="w-full p-2 border rounded mb-2"></textarea>
                  <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Book Now</button>
                </form>
               </div>
             </Popup>
           </Marker>
         ))}
       </MapContainer>
     </div>
     {/* Rider Information Popup */}
     {riderPhoneNumber && (
       <div className="fixed bottom-4 left-4 bg-white p-4 border rounded shadow-md">
         <div className="flex items-center">
           <div className="w-6 h-6 bg-gray-500 rounded-full mr-2"></div>
           <span>{riderName}</span>
         </div>
         <div className="flex items-center mt-2">
           <span>{riderPhoneNumber}</span>
           <a href={`tel:${riderPhoneNumber}`} className="ml-2 text-blue-500">
             <i className="fas fa-phone-alt"></i>
           </a>
         </div>
       </div>
     )}
   </div>
 );
};


export default RegisterAndMap;



