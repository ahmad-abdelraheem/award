# Appointment Booking System API

## Overview
This Node.js application serves as the backend API for managing appointments in hospitals and clinics. It provides endpoints that an Android application can consume to perform various tasks related to appointment booking, checking availability, and managing user profiles.

## Installation
1. **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2. **Install dependencies:**
    ```bash
    npm install
    ```
3. **Set up the MySQL database:**
    - Create a MySQL database named `mawaeed_db`.
    - Import the database schema from `database.sql` file.

4. **Configure the MySQL connection:**
    - Open `index.js`.
    - Modify the MySQL connection settings in the `pool` object to match your database configuration.

5. **Run the application:**
    ```bash
    node index.js
    ```
   The server will start running on `http://localhost:3000`.

## Usage
- Your Android application can consume the provided endpoints to interact with the API. Here are some of the available endpoints:
    - `/getHospitals`: Get a list of hospitals.
    - `/getHospitalsByCity`: Get hospitals by city.
    - `/getClinics`: Get a list of clinics.
    - `/startBooking`: Start the booking process.
    - `/checkAvailableDate`: Check the availability of a date for booking.
    - `/getMyAppointments`: Get appointments for a specific user.
    - `/myProfile`: Get user profile information.
    - `/getResetCode`: Get a reset code for resetting the password.
    - `/makeAppointment`: Make a new appointment.
    - `/editAppointment`: Edit an existing appointment.
    - `/logIn`: User login.
    - `/updatePassword`: Update user password.
    - `/checkResetCode`: Check the reset code for password reset.
    - `/updatePasswordViaCode`: Update password using a reset code.
    - `/deleteAppointment`: Delete an appointment.

## Authentication
- Implement proper authentication mechanisms in your Android application to secure API requests. You may use tokens, session management, or other authentication methods depending on your application's requirements.

## Contributing
Contributions are welcome. Please feel free to open an issue or submit a pull request for any improvements or bug fixes.
