const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const { deleteImage } = require('../../utils/delete.image');

module.exports.viewHomePage = async (req, res) => {
    try {
        // Fetch the prescription count
        const [prescriptionResult] = await connection.query(`SELECT COUNT(*) AS total FROM ${tables.PRESCRIPTION}`);
        const prescriptionCount = prescriptionResult[0].total;

        // Fetch the admin's phone number (assuming there's only one admin)
        const [adminResult] = await connection.query(`SELECT phone FROM ${tables.Admin} LIMIT 1`);
        const adminPhone = adminResult.length > 0 ? adminResult[0].phone : 'N/A';

        // Render the page with the data
        res.render('patient/patientHomePage', { prescriptionCount, adminPhone });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};


module.exports.viewAboutPage = (req, res) => {
    try {
        res.render('patient/aboutPage')
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}


module.exports.viewServicePage = (req, res) => {
    try {
        res.render('patient/servicePage')
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}


module.exports.viewAllDepartmentPage = async (req, res) => {
    try {
        // Fetch all departments from the database, ordered by created_at
        const [departments] = await connection.query(`
            SELECT * FROM ${tables.DEPARTMENT} 
            WHERE isBlocked = FALSE 
            ORDER BY created_at DESC
        `);

        // Parse the attachments field
        const parsedDepartments = departments.map(dept => ({
            ...dept,
            attachments: JSON.parse(dept.attachments)[0]
        }));


        // Render the view and pass the departments data
        res.render('patient/allDepartmentsPage', { departments: parsedDepartments });
    } catch (error) {
        console.error('Error fetching departments:', error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.viewSingleDepartmentPage = async (req, res) => {
    try {
        const departmentId = req.query.id;

        if (!departmentId) {
            return res.status(400).json({ success: false, message: "Department ID is required" });
        }

        // Fetch department details
        const [department] = await connection.query(
            `SELECT * FROM ${tables.DEPARTMENT} WHERE id = ?`,
            [departmentId]
        );

        if (department.length === 0) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        // Fetch doctors for the department including profile_img
        const [doctors] = await connection.query(
            `SELECT id, doctor_name, profile_img FROM ${tables.DOCTOR} WHERE department_id = ?`,
            [departmentId]
        );

        // Parse profile_img field if stored as JSON
        const doctorData = doctors.map(doctor => ({
            ...doctor,
            profile_img: doctor.profile_img ? JSON.parse(doctor.profile_img) : []
        }));

        // Parse the attachments field (if applicable)
        const departmentData = {
            ...department[0],
            attachments: department[0].attachments ? JSON.parse(department[0].attachments) : []
        };

        // ✅ Fetch department reviews along with patient details
        const [reviews] = await connection.query(
            `SELECT dr.id, dr.comment, dr.created_at, 
                    p.patient_name, p.profile_img, p.patient_age, p.patient_gender, p.address 
             FROM ${tables.DEPARTMENT_REVIEW} dr
             JOIN ${tables.PATIENT} p ON dr.patient_id = p.id
             WHERE dr.department_id = ? 
             ORDER BY dr.created_at DESC`,
            [departmentId]
        );

        // Parse profile_img if stored as JSON
        const reviewData = reviews.map(review => ({
            ...review,
            profile_img: review.profile_img ? JSON.parse(review.profile_img) : null
        }));

        // Render the view with department, doctors, and reviews data
        res.render('patient/singleDepartmentPage', { 
            department: departmentData, 
            doctors: doctorData,
            reviews: reviewData 
        });

    } catch (error) {
        console.error('Error fetching department details:', error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.viewAllDoctorsPage = async (req, res) => {
    try {
        // Fetch all departments
        const [departments] = await connection.query(`SELECT id, department_name FROM ${tables.DEPARTMENT}`);
        
        // Fetch all doctors with department names
        const [doctors] = await connection.query(`
            SELECT d.id, d.doctor_name, d.profile_img, dept.department_name 
            FROM ${tables.DOCTOR} d
            JOIN ${tables.DEPARTMENT} dept ON d.department_id = dept.id
            WHERE d.isBlocked = FALSE
        `);

        // Parse profile_img field
        doctors.forEach(doctor => {
            try {
                if (doctor.profile_img) {
                    console.log('(doctor.profile_img)');
                    
                    const parsedImages = JSON.parse(doctor.profile_img); // Convert to array
                    console.log("parsedImages:", JSON.stringify(parsedImages, null, 2));
                    doctor.profile_img = parsedImages.length > 0 ? parsedImages[0] : []; // Get the first image
                }
            } catch (error) {
                console.error("Error parsing profile_img for doctor:", doctor.id, error);
                doctor.profile_img = []; // Fallback to null if parsing fails
            }
        });

        console.log("Doctors:", JSON.stringify(doctors, null, 2));

        // Render the view and pass the fetched data
        res.render('patient/allDoctorsPage', { departments, doctors });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.viewSingleDoctorPage = async (req, res) => {
    try {
        const doctorId = req.query.id;

        if (!doctorId) {
            return res.status(400).json({ success: false, message: "Doctor ID is required" });
        }

        // Fetch doctor details along with department name
        const doctorQuery = `
            SELECT d.*, dep.department_name 
            FROM ${tables.DOCTOR} d
            JOIN ${tables.DEPARTMENT} dep ON d.department_id = dep.id
            WHERE d.id = ?
        `;

        const [doctors] = await connection.query(doctorQuery, [doctorId]);

        if (!doctors || doctors.length === 0) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        const doctor = doctors[0];

        // Parsing profile image correctly
        doctor.profile_img = doctor.profile_img
            ? `/assets/imgs/uploadedImages/${JSON.parse(doctor.profile_img)[0]}`
            : '/images/no photo_LE_upscale_balanced_x4.jpg';

        // Parsing attachments if necessary
        doctor.attachments = doctor.attachments ? JSON.parse(doctor.attachments) : [];

        // Fetch available times where status = 'confirmed'
        const availableTimeQuery = `
            SELECT available_times 
            FROM ${tables.AVAILABLE_TIME} 
            WHERE doctor_id = ? AND status = 'confirmed'
        `;

        const [availableTimes] = await connection.query(availableTimeQuery, [doctorId]);

        // Ensure available_times is always an array
        const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

        doctor.available_times = availableTimes.length > 0
            ? availableTimes.map(time => JSON.parse(time.available_times))
                .flat() // Flatten the array of arrays
                .filter(item => item.date >= today) // Keep only current or future dates
            : [];

        console.log("Filtered Available Time List:", JSON.stringify(doctor.available_times, null, 2));

        res.render('patient/singleDoctorPage', { doctor });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};





module.exports.viewAppointmentPage = async (req, res) => {
    try {
        const doctor_id = req.query.id;

        if (!doctor_id) {
            return res.status(400).json({ success: false, message: "Doctor ID is required" });
        }

        // Fetch confirmed available times for the doctor
        const availableTimeQuery = `
            SELECT available_times 
            FROM ${tables.AVAILABLE_TIME} 
            WHERE doctor_id = ? AND status = 'confirmed'
        `;

        const [availableTimes] = await connection.query(availableTimeQuery, [doctor_id]);

        const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

        // Parse available_times and filter for current or future dates
        const parsedAvailableTimes = availableTimes.length > 0
            ? availableTimes.map(time => JSON.parse(time.available_times))
                .flat() // Flatten the array of arrays
                .filter(item => item.date >= today) // Keep only current or future dates
            : [];

        res.render('patient/appointmentPage', { doctor_id, available_times: parsedAvailableTimes });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};




module.exports.bookAppointment = async (req, res) => {
    try {
        let { date, time, doctor_id, message } = req.body;
        const patient_id = req.patient_id;

        // Fix the issue by converting array values to single values
        if (Array.isArray(doctor_id)) doctor_id = doctor_id[0];
        if (Array.isArray(message)) message = message[0];

        // Validate required fields
        if (!date || !time || !patient_id || !doctor_id) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ message: "Missing required fields." });
        }

        const image = req.files?.length > 0 ? req.files.map(file => file.filename) : [];
        

        //  Insert into database
        await connection.query(`
            INSERT INTO ${tables.APPOINTMENT} 
            (patient_id, doctor_id, date, time, message, attachments) 
            VALUES (?, ?, ?, ?, ?, ?)`, [
            patient_id,
            doctor_id,
            date,
            time,
            message,
            JSON.stringify(image),
        ]);

        return res.status(200).json({ success: true, message: "Appointment booked successfully!", doctor_id });
    } catch (error) {
        req.files.forEach(file => deleteImage(file.filename));
        console.error("Error in bookAppointment:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};





module.exports.viewContactPage = async (req, res) => {
    try {
        // Fetch admin email, phone, and address (assuming only one admin exists)
        const [adminResult] = await connection.query(`SELECT email, phone, address FROM ${tables.Admin} LIMIT 1`);
        
        if (adminResult.length === 0) {
            return res.render('patient/contactPage', { email: 'N/A', phone: 'N/A', address: 'N/A' });
        }

        // Extract admin details
        const { email, phone, address } = adminResult[0];

        // Render the contact page with admin details
        res.render('patient/contactPage', { email, phone, address });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};




module.exports.viewPrescriptionPage = async (req, res) => {
    const itemsPerPage = 5;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;

    try {
        const patientId = req.patient_id;

        // Fetch paginated prescriptions with patient name
        const query = `
            SELECT 
                p.id AS prescription_id,
                p.prescription,
                p.attachments AS prescription_attachments,
                p.created_at AS prescription_created_at,
                a.message,
                a.date,
                a.time,
                a.attachments AS appointment_attachments,
                pt.patient_name
            FROM ${tables.PRESCRIPTION} p
            JOIN ${tables.APPOINTMENT} a ON p.appointment_id = a.id
            JOIN ${tables.PATIENT} pt ON p.patient_id = pt.id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [results] = await connection.execute(query, [patientId, itemsPerPage, offset]);

        // Count total prescriptions for pagination
        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) AS total FROM ${tables.PRESCRIPTION} WHERE patient_id = ?`,
            [patientId]
        );

        const totalPages = Math.ceil(total / itemsPerPage);

        // Parse JSON attachments
        const prescriptions = results.map(row => ({
            prescription_id: row.prescription_id,
            prescription: row.prescription,
            prescription_attachments: row.prescription_attachments ? JSON.parse(row.prescription_attachments) : [],
            prescription_created_at: row.prescription_created_at,
            message: row.message,
            date: row.date,
            time: row.time,
            appointment_attachments: row.appointment_attachments ? JSON.parse(row.appointment_attachments) : [],
            patient_name: row.patient_name
        }));

        console.log(prescriptions);
        console.log(totalPages);
        
        

        res.render('patient/viewPrescriptionPage', {
            prescriptions,
            currentPage: page,
            totalPages: totalPages,
            itemsPerPage: itemsPerPage
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};




module.exports.addDepartmentComment = async (req, res) => {
    try {
        const patientId = req.patient_id;
        const { comment, department_id } = req.body;

        console.log(req.body);
        

        // Validate required fields
        if (!comment.trim()) {
            return res.status(400).json({ success: false, message: 'Comment is required.' });
        }

        if (!department_id) {
            return res.status(400).json({ success: false, message: 'Department ID is required.' });
        }

        // Insert comment into DEPARTMENT_REVIEW table
        await connection.query(
            `INSERT INTO ${tables.DEPARTMENT_REVIEW} (patient_id, department_id, comment) VALUES (?, ?, ?)`,
            [patientId, department_id, comment]
        );

        // Send response after successful insertion
        res.status(201).json({ success: true, message: 'Comment added successfully!' });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};