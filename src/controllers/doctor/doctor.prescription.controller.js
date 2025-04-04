const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const { deleteImage } = require('../../utils/delete.image');


module.exports.addPrescription = async (req,res) => {
    try {
        const { prescription, patient_id, appointment_id } = req.body;
        
        // Validate required fields
        if (!prescription.trim() || !patient_id || !appointment_id) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Prescription is required.' });
        }

        
        // Get uploaded file name (if any)
        const image = req.files?.length > 0 ? req.files.map(file => file.filename) : [];

        // Insert into database
        await connection.query(`
            INSERT INTO ${tables.PRESCRIPTION} 
            (prescription, attachments, patient_id, appointment_id) 
            VALUES (?, ?, ?, ?)`, [
            prescription,
            JSON.stringify(image),
            patient_id,
            appointment_id
        ]);

        // Send response after successful insertion
        res.status(201).json({
            success: true,
            message: 'Prescription added successfully!'
        });

    } catch (error) {
        req.files.forEach(file => deleteImage(file.filename));
        console.error('Error adding prescription:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
}



module.exports.prescriptionList = async (req, res) => {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;

    try {
        // Fetch prescription data with pagination and include patient_name
        const [prescription_list] = await connection.query(
            `SELECT p.*, pt.patient_name 
             FROM ${tables.PRESCRIPTION} p
             LEFT JOIN ${tables.PATIENT} pt ON p.patient_id = pt.id
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`,
            [itemsPerPage, offset]
        );

        // Count total prescriptions
        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) AS total FROM ${tables.PRESCRIPTION}`
        );

        const totalPages = Math.ceil(total / itemsPerPage);

        // Parse attachments
        prescription_list.forEach(prescription => {
            try {
                prescription.attachments = prescription.attachments
                    ? JSON.parse(prescription.attachments)
                    : [];
            } catch (error) {
                console.error("Error parsing attachments:", error);
                prescription.attachments = [];
            }
        });

        const doctorProfile = req.doctorProfileImg; 

        res.render('doctor/prescriptionList', {
            prescription_list,
            currentPage: page,
            totalPages: totalPages,
            itemsPerPage: itemsPerPage,
            doctorProfile
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};




module.exports.viewEditPrescription = async (req, res) => {
    try {
        const prescriptionId = req.query.id; // Get prescription ID from query parameters

        // Fetch prescription details from the database
        const [[prescription]] = await connection.query(
            `SELECT p.*, pt.patient_name 
             FROM ${tables.PRESCRIPTION} p
             LEFT JOIN ${tables.PATIENT} pt ON p.patient_id = pt.id
             WHERE p.id = ?`,
            [prescriptionId]
        );

        if (!prescription) {
            return res.status(404).json({ success: false, message: "Prescription not found" });
        }

        // Parse attachments (if applicable)
        try {
            prescription.attachments = prescription.attachments
                ? JSON.parse(prescription.attachments)
                : [];
        } catch (error) {
            console.error("Error parsing attachments:", error);
            prescription.attachments = [];
        }

        const doctorProfile = req.doctorProfileImg; 
        // Render edit prescription page with prescription data
        res.render('doctor/editPrescription', { prescription, doctorProfile });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};


module.exports.editPrescription = async (req, res) => {
    try {
        const { prescriptionId, prescription, old_images } = req.body;
        let uploadedImages = req.files ? req.files.map(file => file.filename) : [];
        let remainingAttachments = [];
        
        // Validate required fields
        if (!prescriptionId || !prescription.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Prescription is required.' });
        }

        const [existingPrescription] = await connection.query( 
            `SELECT attachments FROM ${tables.PRESCRIPTION} WHERE id = ?`,
            [prescriptionId]
        );

        if (existingPrescription.length !== 0  && existingPrescription[0].attachments) {

            let existingAttachments = existingPrescription[0].attachments ? JSON.parse(existingPrescription[0].attachments) : [];

             // Find images to keep (present in old_images)
             remainingAttachments = existingAttachments.filter(img => old_images.includes(img));

             // Find images to delete (present in existing but not in old_images)
             let imagesToDelete = existingAttachments.filter(img => !old_images.includes(img));
 
             // Delete images that are no longer needed
             imagesToDelete.forEach(file => deleteImage(file));
        }

       


       // Add newly uploaded images
        let updatedAttachments = [...remainingAttachments, ...uploadedImages];


        // Update prescription in the database
        await connection.query(`
            UPDATE ${tables.PRESCRIPTION} 
            SET prescription = ?, attachments = ? 
            WHERE id = ?`, 
            [prescription, JSON.stringify(updatedAttachments), prescriptionId]
        );

        return res.status(200).json({
            success: true,
            message: 'Prescription updated successfully!',
            updatedImages: updatedAttachments
        });

    } catch (error) {
        req.files.forEach(file => deleteImage(file.filename));
        console.error('Error updating prescription:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};
