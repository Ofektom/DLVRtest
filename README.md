## Instructions for Using the App

### Access the Application:

Visit the deployed application link provided in the submission email.

### Register a Logistics Company:

On the left-hand side of the screen, fill out the "Register Company" form with the following:
Company Name (Required)
Address:
Type in the address and select one of the suggestions from the autocomplete dropdown.
Whatsapp Number (Required)
Email Address (Optional)
Riders' Phone Numbers:
Add rider phone numbers using the provided phone input field and click the "Add" button to include them.
Click the "Register" button to submit the form.
A success message will confirm the company registration, and the company will appear on the map.

### View Registered Companies on the Map:

The map on the right-hand side displays markers for all registered logistics companies.
Click on a marker to view the company's details in a popup. The details include:
Company name
Address
Whatsapp number
Email
A form to place an order.

### Place an Order with a Logistics Company:

In the company's popup:
Fill out the order form with the following details:
Pickup Point (Required)
Dropoff Point (Optional)
Description of the order (Optional)
Click the "Book Now" button to submit the order.
The app will find the nearest available dispatch rider and display their contact information (name and phone number).

### Contact the Rider:

If a rider is successfully located, their information will appear in a popup at the bottom-left of the screen.
Use the provided phone number to contact the rider.
Technical Details for Developers:

The backend runs using Firebase for data storage and retrieval.
The API for finding the nearest rider processes requests based on the provided pickup location.
Additional Notes:

Ensure a stable internet connection while using the app.
For address-based operations, autocomplete depends on the OpenStreetMap Nominatim API, so accurate input improves results.
If no rider is found, an error message will appear.
