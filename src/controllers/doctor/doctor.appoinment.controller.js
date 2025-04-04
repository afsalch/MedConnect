const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');

module.exports.appointmentList = async (req, res) => {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;
    const doctorId = req.doctorId; // Assuming doctorId is available in the request

    try {
        // Fetch appointment data with pagination for a specific doctor
        const [appointment_list] = await connection.query(
            `SELECT a.*, 
                    p.patient_name 
             FROM ${tables.APPOINTMENT} a
             LEFT JOIN ${tables.PATIENT} p ON a.patient_id = p.id
             WHERE a.doctor_id = ? 
             ORDER BY a.created_at DESC
             LIMIT ? OFFSET ?`,
            [doctorId, itemsPerPage, offset]
        );

        // Count total appointments for the doctor
        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) AS total FROM ${tables.APPOINTMENT} WHERE doctor_id = ?`,
            [doctorId]
        );

        const totalPages = Math.ceil(total / itemsPerPage);

        // Parse attachments (if applicable)
        appointment_list.forEach(appointment => {
            try {
                appointment.attachments = appointment.attachments
                    ? JSON.parse(appointment.attachments)
                    : [];
            } catch (error) {
                console.error("Error parsing attachments:", error);
                appointment.attachments = [];
            }
        });

        // Check if a prescription exists for both patient_id and appointment_id
        for (let appointment of appointment_list) {
            const [[prescriptionExists]] = await connection.query(
                `SELECT COUNT(*) AS count 
                 FROM ${tables.PRESCRIPTION} 
                 WHERE patient_id = ? AND appointment_id = ?`,
                [appointment.patient_id, appointment.id]
            );
            appointment.isExist = prescriptionExists.count > 0;
        }

        const doctorProfile = req.doctorProfileImg; 

        res.render('doctor/doctorAppointmentPage', {
            appointment_list,
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





module.exports.viewAddPrescription = (req, res) => {
    try {
        const patient_id = req.query.patient_id; 
        const appointment_id = req.query.appointment_id; 
        const doctorProfile = req.doctorProfileImg; 
        res.render('doctor/addPrescription', { patient_id, appointment_id, doctorProfile }); 
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};


