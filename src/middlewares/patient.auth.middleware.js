const connection = require('../models/connect.mysql');
const tables = require('../models/tables');

const patientAuthMiddleware = async (req, res, next) => {
    if (!req.session.patientId) {
        return res.redirect('/api/patient_login_view'); 
    }

    try {
        const [user] = await connection.query(
            `SELECT * FROM ${tables.PATIENT} WHERE id = ?`,
            [req.session.patientId]
        );

        if (user.length === 0) {
            return res.redirect('/api/patient_login_view'); 
        }

        req.patient_id = req.session.patientId

        next();
    } catch (error) {
        console.error("Error checking user privileges:", error);
        return res.status(500).json({ error: "An error occurred while checking user privileges." });
    }
};

module.exports = patientAuthMiddleware;