const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables')
const bcrypt = require('bcrypt');


module.exports.doctorLoginView = (req,res) => {
    try {
        res.render('doctor/doctorLogin'); 
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}


module.exports.doctorLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required" });
        }

        // Fetch doctor details
        const [results] = await connection.query(`SELECT * FROM ${tables.DOCTOR} WHERE username = ?`, [username]);
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid username." });
        }

        const doctor = results[0];

        // 🔑 Check password
        const isPasswordValid = await bcrypt.compare(password, doctor.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid password." });
        }

        // ❌ Check if the doctor is blocked
        if (doctor.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact admin." });
        }

        // ✅ Set session data
        req.session.doctorId = doctor.id;

        return res.status(200).json({ success: true, message: "Login successful." });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};




module.exports.doctorLogout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout Error:", err);
                return res.status(500).json({ success: false, message: "Logout failed" });
            }
            res.clearCookie("connect.sid"); 
            return res.redirect("/api/doctor_login_view"); 
        });
    } catch (error) {
        console.error("Error in logout:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
