const connection = require('../models/connect.mysql');
const tables = require('../models/tables');

const doctorauthMiddleware = async (req, res, next) => {
    if (!req.session.doctorId) {
        return res.redirect('/api/doctor_login_view'); 
    }

    try {
        const [rows] = await connection.query(
            `SELECT id, profile_img FROM ${tables.DOCTOR} WHERE id = ? AND isBlocked = FALSE`,
            [req.session.doctorId]
        );

        if (rows.length === 0) {
            return res.redirect('/api/doctor_login_view'); 
        }

        const doctor = rows[0];

        let profileImagePath = "/images/no-photo_LE_upscale_balanced_x4.jpg"; // Default image
        
        if (doctor.profile_img) {
            try {
                const images = JSON.parse(doctor.profile_img); 
                if (Array.isArray(images) && images.length > 0) {
                    profileImagePath = "/assets/imgs/uploadedImages/" + images[0]; 
                }
            } catch (error) {
                console.error("Error parsing profile image JSON:", error);
            }
        }

        // ✅ Pass doctorId and profile_img to next function
        req.doctorId = req.session.doctorId;
        req.doctorProfileImg = profileImagePath;

        next();
    } catch (error) {
        console.error("Error checking user privileges:", error);
        return res.status(500).json({ error: "An error occurred while checking user privileges." });
    }
};

module.exports = doctorauthMiddleware;