const connection = require('./connect.mysql');
const tables = require('../models/tables')

const createAdminTableQuery = `

    CREATE TABLE IF NOT EXISTS ${tables.Admin} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(10) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        isBlocked BOOLEAN DEFAULT FALSE,
        address VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

`

const createDepartmentTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.DEPARTMENT} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_name VARCHAR(255) NOT NULL UNIQUE,
        details TEXT,
        attachments TEXT, 
        isBlocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
`;

const createDoctorTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.DOCTOR} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_name VARCHAR(255) NOT NULL,
        department_id INT NOT NULL,
        details TEXT,
        profile_img TEXT,
        attachments TEXT, 
        isBlocked BOOLEAN DEFAULT FALSE,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES ${tables.DEPARTMENT}(id)
    );
`;

const createDoctorAvailableTimeTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.AVAILABLE_TIME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        details TEXT,
        available_times TEXT,
        status ENUM('pending', 'confirmed', 'canceled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES ${tables.DOCTOR}(id)
    );
`;

const createAppointmentTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.APPOINTMENT} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        message TEXT,
        date VARCHAR(15),
        time VARCHAR(115), 
        attachments TEXT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id),
        FOREIGN KEY (doctor_id) REFERENCES ${tables.DOCTOR}(id)
    );
`;

const createPatientTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.PATIENT} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        patient_age INT NOT NULL,
        profile_img TEXT,
        attachments TEXT, 
        prescription TEXT, 
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        appointment_date VARCHAR(15),
        weight DECIMAL(10,2),
        height DECIMAL(10,2),
        contact_number VARCHAR(15) NOT NULL UNIQUE,
        blood_group ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-') DEFAULT NULL,
        patient_dob VARCHAR(15) NOT NULL,
        patient_gender ENUM('Male', 'Female', 'Other') NOT NULL,
        address TEXT,
        isBlocked BOOLEAN DEFAULT FALSE, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
`;


const createPrescriptionTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.PRESCRIPTION} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prescription TEXT,
        attachments TEXT, 
        patient_id INT NOT NULL,
        appointment_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id),
        FOREIGN KEY (appointment_id) REFERENCES ${tables.APPOINTMENT}(id)
    );
`;

const createDepartmentReviewTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.DEPARTMENT_REVIEW} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        department_id INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id),
        FOREIGN KEY (department_id) REFERENCES ${tables.DEPARTMENT}(id)
    );
`;

const createPaymentTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.PAYMENTS} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_type VARCHAR(255) NOT NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
`;

const createFeesTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tables.FEES} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date VARCHAR(15) NOT NULL, 
        amount DECIMAL(10, 2) NOT NULL,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        payment_id INT NOT NULL,  
        margin INT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id),
        FOREIGN KEY (doctor_id) REFERENCES ${tables.DOCTOR}(id),
        FOREIGN KEY (payment_id) REFERENCES ${tables.PAYMENTS}(id)
    ); 
`; 

// Function to create all the tables
async function createTables() {
    try {
        await connection.query(createAdminTableQuery);
        await connection.query(createDepartmentTableQuery);
        await connection.query(createDoctorTableQuery);
        await connection.query(createDoctorAvailableTimeTableQuery);
        await connection.query(createPatientTableQuery);
        await connection.query(createAppointmentTableQuery);
        await connection.query(createPrescriptionTableQuery);
        await connection.query(createDepartmentReviewTableQuery);
        await connection.query(createPaymentTableQuery);
        await connection.query(createFeesTableQuery);
    } catch (error) {
        console.error("Error creating tables: ", error);
    }
}


module.exports = {
    createTables,
};
