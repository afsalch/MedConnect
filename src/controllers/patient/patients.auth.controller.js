const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables')
const bcrypt = require('bcrypt');
const { deleteImage } = require('../../utils/delete.image');


module.exports.patientLoginView = (req,res) => {
    try {
        res.render('patient/patientLogin'); 
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}


module.exports.patientLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required" });
        }

        // Fetch patient details
        const [results] = await connection.query(`SELECT * FROM ${tables.PATIENT} WHERE username = ?`, [username]);
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid username." });
        }

        const patient = results[0];

        // 🔑 Check password
        const isPasswordValid = await bcrypt.compare(password, patient.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid password." });
        }

        // ❌ Check if the patient is blocked
        if (patient.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact admin." });
        }

        // ✅ Set session data
        req.session.patientId = patient.id;

        return res.status(200).json({ success: true, message: "Login successful." });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports.patientRegisterView = (req,res) => {
    try {
        res.render('patient/patientRegister'); 
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}


module.exports.patientRegister = async (req, res) => {
    try {
        const {
            patient_name,
            patient_age,
            username,
            password,
            contact_number,
            patient_dob,
            patient_gender,
            weight,
            height,
            appointment_date,
            blood_group,
            address
        } = req.body;
        
        

        // Validate required fields
        if (!patient_name.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Patient name is required.' });
        }
        if (!patient_age || isNaN(patient_age)) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Valid patient age is required.' });
        }
        if (!username.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }
        if (!password.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Password is required.' });
        }
        if (!contact_number.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Contact number is required.' });
        }
        if (!patient_dob.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Date of Birth is required.' });
        }
        if (!patient_gender) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Gender is required.' });
        }

        // Check if username or contact number already exists
        const [existingUser] = await connection.query(
            `SELECT * FROM ${tables.PATIENT} WHERE username = ? OR contact_number = ?`,
            [username, contact_number]
        );

        if (existingUser.length > 0) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Username or contact number already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const attachments = req.files?.length > 0 ? req.files.map(file => file.filename) : [];


        // Insert patient into the database
        await connection.query(
            `INSERT INTO ${tables.PATIENT} 
            (patient_name, patient_age, attachments, username, password, 
            appointment_date, weight, height, contact_number, blood_group, patient_dob, patient_gender, 
            address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                patient_name,
                patient_age,
                JSON.stringify(attachments),
                username,
                hashedPassword,
                appointment_date,
                weight,
                height,
                contact_number,
                blood_group,
                patient_dob,
                patient_gender,
                address
            ]
        );

        // Send response
        res.status(201).json({
            success: true,
            message: 'Patient registered successfully!'
        });

    } catch (error) {
        req.files.forEach(file => deleteImage(file.filename));
        console.error('Error registering patient:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};




module.exports.patientLogout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout Error:", err);
                return res.status(500).json({ success: false, message: "Logout failed" });
            }
            res.clearCookie("connect.sid"); 
            return res.redirect("/api/patient_login_view"); 
        });
    } catch (error) {
        console.error("Error in logout:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
