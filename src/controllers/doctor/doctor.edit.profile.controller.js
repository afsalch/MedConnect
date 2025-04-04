const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const { deleteImage } = require('../../utils/delete.image');
const bcrypt = require('bcrypt');

module.exports.editDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.doctorId;

        // Fetch old profile image
        const [rows] = await connection.query(
            `SELECT profile_img FROM ${tables.DOCTOR} WHERE id = ?`,
            [doctorId]
        );

        let profileImage = "/images/no photo_LE_upscale_balanced_x4.jpg";

        if (rows.length > 0 && rows[0].profile_img) {
            const profile = JSON.parse(rows[0].profile_img);
            if (profile.length > 0) {
                profileImage = `/assets/imgs/uploadedImages/${profile[0]}`;
            }
        }

        const doctorProfile = req.doctorProfileImg; 

        res.render("doctor/doctorEditProfile", { profileImage, doctorProfile });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};




module.exports.updateDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.doctorId;

        if (!doctorId) {
            return res.status(400).json({ success: false, message: "Doctor ID is required" });
        }

        const image = req.files?.length > 0 ? req.files.map(file => file.filename) : [];

        // Fetch old profile image
        const [rows] = await connection.query(
            `SELECT profile_img FROM ${tables.DOCTOR} WHERE id = ?`,
            [doctorId]
        );

        if (rows.length > 0 && rows[0].profile_img) {
            const oldImages = JSON.parse(rows[0].profile_img);
            if (Array.isArray(oldImages)) {
                oldImages.forEach(img => deleteImage(img));
            } else {
                deleteImage(oldImages);
            }
        }

        // Update profile image in the database
        await connection.query(
            `UPDATE ${tables.DOCTOR} SET profile_img = ? WHERE id = ?`,
            [JSON.stringify(image), doctorId]
        );

        return res.status(200).json({
            success: true,
            message: "Profile image updated successfully"
        });

    } catch (error) {
        req.files?.forEach(file => deleteImage(file.filename));
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.viewChangeDoctorPassword = (req, res) => {
    try {
        const doctorProfile = req.doctorProfileImg; 
        res.render("doctor/changeDoctorPassword", { doctorProfile });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}



module.exports.checkDoctorUsername = async (req, res) => {
    try {
        const { username } = req.body;

        const [doctor] = await connection.query(
            `SELECT id FROM ${tables.DOCTOR} WHERE username = ?`,
            [username]
        );

        if (doctor.length > 0) {
            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: "Username does not exist." });
        }
    } catch (error) {
        console.error("Check Username Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong." });
    }
}



module.exports.doctorChangePassword = async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await connection.query(
            `UPDATE ${tables.DOCTOR} SET password = ? WHERE username = ?`,
            [hashedPassword, username] 
        );

        return res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong." });
    }
}