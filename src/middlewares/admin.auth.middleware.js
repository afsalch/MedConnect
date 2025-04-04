const connection = require('../models/connect.mysql');
const tables = require('../models/tables');

const adminAuthMiddleware = async (req, res, next) => {
    if (!req.session.adminId) {
        return res.redirect('/api/admin_login_view'); 
    }

    try {
        const [user] = await connection.query(
            `SELECT * FROM ${tables.Admin} WHERE id = ?`,
            [req.session.adminId]
        );

        if (user.length === 0) {
            return res.redirect('/api/admin_login_view'); 
        }

        next();
    } catch (error) {
        console.error("Error checking user privileges:", error);
        return res.status(500).json({ error: "An error occurred while checking user privileges." });
    }
};

module.exports = adminAuthMiddleware;