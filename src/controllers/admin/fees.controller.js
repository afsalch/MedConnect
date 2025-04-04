const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const PDFDocument = require("pdfkit");

module.exports.feesList = async (req, res) => {
    const itemsPerPage = 10; // Number of records per page
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;

    try {
        // Fetch paginated fees list with patient, doctor, and payment details
        const [fees_list] = await connection.query(
            `SELECT f.id, f.date, f.amount, f.margin, f.notes, 
                    p.patient_name, d.doctor_name, pay.payment_type
            FROM ${tables.FEES} f
            JOIN ${tables.PATIENT} p ON f.patient_id = p.id
            JOIN ${tables.DOCTOR} d ON f.doctor_id = d.id
            JOIN ${tables.PAYMENTS} pay ON f.payment_id = pay.id
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?`,
            [itemsPerPage, offset]
        );

        // Count total number of fees records
        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) AS total FROM ${tables.FEES}`
        );

        const totalPages = Math.ceil(total / itemsPerPage);
        const message = fees_list.length === 0 ? "No fees have been recorded yet." : null;

        res.render('admin/feesList', {
            fees_list,
            message,
            currentPage: page,
            totalPages,
            itemsPerPage,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};


module.exports.addFeesView = async (req, res) => {
    try {
        // Fetch active payment types
        const [payments] = await connection.query(
            `SELECT id, payment_type FROM ${tables.PAYMENTS} WHERE status = 'Active'`
        );

        // Fetch all patients
        const [patients] = await connection.query(
            `SELECT id, patient_name FROM ${tables.PATIENT}`
        );

        // Fetch all doctors
        const [doctors] = await connection.query(
            `SELECT id, doctor_name FROM ${tables.DOCTOR}`
        );

        // Render the addFees page and pass data
        res.render('admin/addFees', {
            payments,
            patients,
            doctors,
        });
    } catch (error) {
        console.error('Error fetching data for add fees:', error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.addFees = async (req, res) => {
    try {
        const { date, amount, patient_id, doctor_id, payment_id, margin, notes } = req.body;

        // Validate required fields
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ success: false, message: 'Valid date is required (YYYY-MM-DD).' });
        }

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Enter a valid positive amount.' });
        }

        if (!patient_id) {
            return res.status(400).json({ success: false, message: 'Patient selection is required.' });
        }

        if (!doctor_id) {
            return res.status(400).json({ success: false, message: 'Doctor selection is required.' });
        }

        if (!payment_id) {
            return res.status(400).json({ success: false, message: 'Payment method selection is required.' });
        }

        // Margin Validation (must be a valid number, can be 0 or more)
        if (!margin || isNaN(margin) || parseInt(margin) < 1 || parseInt(margin) > 100) {
            return res.status(400).json({ success: false, message: 'Margin must be between 1 and 100.' });
        }

        // Insert into database
        await connection.query(
            `INSERT INTO ${tables.FEES} (date, amount, patient_id, doctor_id, payment_id, margin, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [date, parseFloat(amount), patient_id, doctor_id, payment_id, parseFloat(margin), notes]
        );

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Fees added successfully!',
        });

    } catch (error) {
        console.error('Error adding fees:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};



module.exports.viewEditFees = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("Fee ID is required");
        }

        // Fetch fee details
        const [feeRows] = await connection.query(
            `SELECT * FROM ${tables.FEES} WHERE id = ?`,
            [id]
        );

        if (feeRows.length === 0) {
            return res.status(404).send("Fee not found");
        }

        const fee = feeRows[0];

        // Fetch all patients
        const [patients] = await connection.query(
            `SELECT id, patient_name FROM ${tables.PATIENT}`
        );

        // Fetch all doctors
        const [doctors] = await connection.query(
            `SELECT id, doctor_name FROM ${tables.DOCTOR}`
        );

        // Fetch all payment types
        const [payments] = await connection.query(
            `SELECT id, payment_type FROM ${tables.PAYMENTS}`
        );

        res.render('admin/editFees', { fee, patients, doctors, payments });

    } catch (error) {
        console.error("Error fetching fee details:", error);
        res.status(500).send("Internal Server Error");
    }
};



module.exports.updateFees = async (req, res) => {
    try {
        const { fee_id, date, amount, patient_id, doctor_id, payment_id, margin, notes } = req.body;

        // Validate required fields
        if (!fee_id) {
            return res.status(400).json({ success: false, message: 'Fee ID is required.' });
        }

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ success: false, message: 'Valid date is required (YYYY-MM-DD).' });
        }

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Enter a valid positive amount.' });
        }

        if (!patient_id) {
            return res.status(400).json({ success: false, message: 'Patient selection is required.' });
        }

        if (!doctor_id) {
            return res.status(400).json({ success: false, message: 'Doctor selection is required.' });
        }

        if (!payment_id) {
            return res.status(400).json({ success: false, message: 'Payment method selection is required.' });
        }

        // Margin Validation (must be a valid number, can be 0 or more)
        if (!margin || isNaN(margin) || parseInt(margin) < 1 || parseInt(margin) > 100) {
            return res.status(400).json({ success: false, message: 'Margin must be between 1 and 100.' });
        }

        // Update fees in database
        await connection.query(
            `UPDATE ${tables.FEES} 
            SET date = ?, amount = ?, patient_id = ?, doctor_id = ?, payment_id = ?, margin = ?, notes = ? 
            WHERE id = ?`,
            [date, parseFloat(amount), patient_id, doctor_id, payment_id, parseFloat(margin), notes, fee_id]
        );

        // Send success response
        res.json({
            success: true,
            message: 'Fees updated successfully!',
        });

    } catch (error) {
        console.error('Error updating fees:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};



module.exports.deleteFees = async (req, res) => {
    try {
        const { id } = req.query; // Get fee ID from query parameters

        if (!id) {
            return res.status(400).json({ success: false, message: "Fee ID is required." });
        }

        // Delete the fee from the database
        const [result] = await connection.query(`DELETE FROM ${tables.FEES} WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Fee not found." });
        }

        res.json({ success: true, message: "Fee deleted successfully!" });
    } catch (error) {
        console.error("Error deleting fee:", error);
        res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.downloadFees = async (req, res) => {
    try {
        const feeId = req.query.id;

        // Fetch the fee details with patient_name, doctor_name, and payment_type
        const [feeResult] = await connection
            .query(
                `SELECT 
                    f.date, 
                    f.amount, 
                    p.patient_name, 
                    d.doctor_name, 
                    pay.payment_type
                FROM Fees f
                JOIN Patient p ON f.patient_id = p.id
                JOIN Doctor d ON f.doctor_id = d.id
                JOIN Payments pay ON f.payment_id = pay.id
                WHERE f.id = ?`,
                [feeId]
            );

        if (feeResult.length === 0) {
            return res.status(404).send("Fee record not found");
        }

        const fee = feeResult[0];
        const doc = new PDFDocument();

        // Set headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="fee_details.pdf"');

        doc.pipe(res);

        // PDF Content
        doc
            .font("Helvetica-Bold")
            .fontSize(20)
            .text("Fee Details", { align: "center" })
            .moveDown(2);

        doc
            .font("Helvetica")
            .fontSize(12)
            .text(`Date: ${fee.date}`, { align: "left" })
            .moveDown(0.5);

        doc
            .text(`Amount: $${parseFloat(fee.amount).toFixed(2)}`, { align: "left" })
            .moveDown(0.5);

        doc
            .text(`Patient Name: ${fee.patient_name}`, { align: "left" })
            .moveDown(0.5);

        doc
            .text(`Doctor Name: ${fee.doctor_name}`, { align: "left" })
            .moveDown(0.5);

        doc
            .text(`Payment Type: ${fee.payment_type}`, { align: "left" })
            .moveDown(0.5);


        // End the document
        doc.end();
    } catch (error) {
        console.error("Error generating fee PDF:", error);
        res.status(500).send("Internal Server Error");
    }
};