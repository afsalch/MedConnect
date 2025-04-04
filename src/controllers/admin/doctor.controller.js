const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const bcrypt = require('bcrypt');
const { deleteImage } = require('../../utils/delete.image');

module.exports.doctorList = async (req, res) => {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;

    try {
         // Fetch paginated doctor list with department name, available times, and status
         const [doctor_list] = await connection.query(
            `SELECT d.*, dep.department_name
            FROM ${tables.DOCTOR} d
            LEFT JOIN ${tables.DEPARTMENT} dep ON d.department_id = dep.id
            ORDER BY d.created_at DESC 
            LIMIT ? OFFSET ?`,
            [itemsPerPage, offset]
        );

        // Count total number of doctors
        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) AS total FROM ${tables.DOCTOR}`
        );

        const totalPages = Math.ceil(total / itemsPerPage);
        const message = doctor_list.length === 0 ? "No doctor has been added yet." : null;

        
        res.render('admin/doctorList', {
            doctor_list,
            message,
            currentPage: page,
            totalPages,
            itemsPerPage,
        });

        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.addDoctorView = async (req, res) => {
    try {
        const [departments] = await connection.query(`SELECT id, department_name FROM ${tables.DEPARTMENT}`);
        res.render('admin/addDoctor', { departments }); // Pass as an object
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};


module.exports.addDoctor = async (req, res) => {
    try {
        const { doctor_name, details, department_id, username, password } = req.body;
        // Validate required fields
        if (!doctor_name.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Doctor name is required.' });
        }

        if (!department_id) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Department is required.' });
        }

        if (!username.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        if (!password.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Password is required.' });
        }

        // Check if username already exists
        const [existingUser] = await connection.query(
            `SELECT * FROM ${tables.DOCTOR} WHERE username = ?`,
            [username]
        );

        if (existingUser.length > 0) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Username already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Get uploaded file name (if any)
        const image = req.files?.length > 0 ? req.files.map(file => file.filename) : [];


        // Insert into database
        await connection.query(
            `INSERT INTO ${tables.DOCTOR} 
            (doctor_name, details, attachments, department_id, username, password) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                doctor_name,
                details,
                JSON.stringify(image),
                department_id,
                username,
                hashedPassword
            ]
        );

        // Send response after successful insertion
        res.status(201).json({
            success: true,
            message: 'Doctor added successfully!',
            image,
        });

    } catch (error) {
        req.files.forEach(file => deleteImage(file.filename));
        console.error('Error adding doctor:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};



module.exports.viewEditDoctor = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("Doctor ID is required");
        }

        // Fetch doctor by ID
        const [doctorRows] = await connection.query(
            `SELECT * FROM ${tables.DOCTOR} WHERE id = ?`,
            [id]
        );

        if (doctorRows.length === 0) {
            return res.status(404).send("Doctor not found");
        }

        const doctor = doctorRows[0];

        // Parse attachments if they exist
        doctor.attachments = doctor.attachments ? JSON.parse(doctor.attachments) : [];

        // Fetch all departments
        const [departmentRows] = await connection.query(
            `SELECT id, department_name FROM ${tables.DEPARTMENT}`
        );

        res.render('admin/editDoctor', { doctor, departments: departmentRows });

    } catch (error) {
        console.error("Error fetching doctor:", error);
        res.status(500).send("Internal Server Error");
    }
};


module.exports.updateDoctor = async (req, res) => {
    try {
        const { id, doctor_name, details, department_id, username, old_images } = req.body;
        let uploadedImages = req.files ? req.files.map(file => file.filename) : [];
        let remainingAttachments = [];

        if (!doctor_name.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Doctor name is required.' });
        }

        if (!department_id) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Department is required.' });
        }

        if (!username) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        // Check if username already exists
        const [existingUser] = await connection.query(
            `SELECT id FROM ${tables.DOCTOR} WHERE username = ? AND id != ?`,
            [username, id]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists. Please choose a different one.' });
        }

        const [existingDoctor] = await connection.query(
            `SELECT attachments FROM ${tables.DOCTOR} WHERE id = ?`,
            [id]
        );

        if (existingDoctor.length !== 0 && existingDoctor[0].attachments) {
            let existingAttachments = existingDoctor[0].attachments ? JSON.parse(existingDoctor[0].attachments) : [];

            // Find images to keep (present in old_images)
            remainingAttachments = existingAttachments.filter(img => old_images.includes(img));

            // Find images to delete (present in existing but not in old_images)
            let imagesToDelete = existingAttachments.filter(img => !old_images.includes(img));

            // Delete images that are no longer needed
            imagesToDelete.forEach(file => deleteImage(file));
        }

        // Add newly uploaded images
        let finalAttachments = [...remainingAttachments, ...uploadedImages];

        await connection.query(
            `UPDATE ${tables.DOCTOR} SET doctor_name = ?, details = ?, department_id = ?, username = ?, attachments = ? WHERE id = ?`,
            [doctor_name, details, department_id, username, JSON.stringify(finalAttachments), id]
        );

        res.json({ success: true, message: 'Doctor updated successfully.' });
    } catch (error) {
        console.error('Update Doctor Error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};




module.exports.doctorDetails = async (req, res) => {
    try {
        const doctorId = req.query.id;

        // Fetch doctor details along with department name
        const [doctorData] = await connection.query(
            `SELECT d.*, dep.department_name 
             FROM ${tables.DOCTOR} d
             LEFT JOIN ${tables.DEPARTMENT} dep ON d.department_id = dep.id
             WHERE d.id = ?`,
            [doctorId]
        );

        if (doctorData.length === 0) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        let doctor = doctorData[0];

        // Parse doctor attachments
        doctor.attachments = doctor.attachments ? JSON.parse(doctor.attachments) : [];

        // Fetch available times
        const [availableTimes] = await connection.query(
            `SELECT id AS available_time_id, available_times, status AS time_slot_status
             FROM ${tables.AVAILABLE_TIME}
             WHERE doctor_id = ?`,
            [doctorId]
        );

        // Parse available_times
        const parsedAvailableTimes = availableTimes.map(timeSlot => ({
            available_time_id: timeSlot.available_time_id,
            available_times: JSON.parse(timeSlot.available_times),
            time_slot_status: timeSlot.time_slot_status
        }));

        // Ensure it's passed to the template
        res.render("doctor/doctorDetails", {
            doctor,
            availableTimes: parsedAvailableTimes, // Make sure this is passed
            parsedAvailableTimes, // Explicitly pass this to avoid ReferenceError
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};






module.exports.activeDoctor = async (req, res) => {
    try {
        const { id } = req.body;

        // Update isBlocked to FALSE
        const [result] = await connection.query(
            `UPDATE ${tables.DOCTOR} SET isBlocked = FALSE WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.json({ success: true, message: "Department activated successfully" });

    } catch (error) {
        console.error("Activation Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};


module.exports.blockDoctor = async (req, res) => {
    try {
        const { id } = req.body;

        // Update isBlocked to FALSE
        const [result] = await connection.query(
            `UPDATE ${tables.DOCTOR} SET isBlocked = TRUE WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.json({ success: true, message: "Department blocked successfully" });

    } catch (error) {
        console.error("Blocking Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
}

module.exports.confirmDoctor = async (req, res) => {
    try {
        const { id } = req.body;
        console.log(id);
        

        // Update the doctor's status to 'confirmed'
        const [result] = await connection.query(
            `UPDATE ${tables.AVAILABLE_TIME} SET status = 'confirmed' WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Failed to confirm doctor" });
        }

        console.log('success');
        
        res.json({ success: true, message: "Doctor confirmed successfully" });
    } catch (error) {
        console.error("Confirm Doctor Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


module.exports.cancelDoctor = async (req, res) => {
    try {
        const { id } = req.body;

        // Update the doctor's status to 'canceled'
        const [result] = await connection.query(
            `UPDATE ${tables.AVAILABLE_TIME} SET status = 'canceled' WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Failed to cancel doctor" });
        }

        res.json({ success: true, message: "Doctor canceled successfully" });
    } catch (error) {
        console.error("Cancel Doctor Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




module.exports.deleteDoctor = async (req, res) => {
    try {
        const { id } = req.body;

        // Fetch the doctor to check if they exist and get attachments & profile image
        const [existingDoctor] = await connection.query(
            `SELECT profile_img, attachments FROM ${tables.DOCTOR} WHERE id = ?`,
            [id]
        );

        if (existingDoctor.length > 0) {
            // Parse and delete profile image if it exists
            if (existingDoctor[0].profile_img) {
                try {
                    const profileImages = JSON.parse(existingDoctor[0].profile_img);
                    profileImages.forEach(file => deleteImage(file));
                } catch (error) {
                    console.error("Error parsing profile_img:", error);
                }
            }

            // Parse and delete attached images (if any)
            if (existingDoctor[0].attachments) {
                try {
                    const existingAttachments = JSON.parse(existingDoctor[0].attachments);
                    existingAttachments.forEach(file => deleteImage(file));
                } catch (error) {
                    console.error("Error parsing attachments:", error);
                }
            }
        }

        // Delete the doctor
        const [result] = await connection.query(
            `DELETE FROM ${tables.DOCTOR} WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Failed to delete doctor" });
        }

        res.json({ success: true, message: "Doctor deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};