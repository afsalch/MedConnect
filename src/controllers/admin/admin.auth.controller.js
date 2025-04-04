const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const bcrypt = require('bcrypt');


module.exports.adminLoginView = (req,res) => {
    try {
        res.render('admin/login'); 
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}


module.exports.adminLogin = async (req, res) => {
    try {
        
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });

        const [results] = await connection.query(`SELECT * FROM ${tables.Admin} WHERE email = ?`, [email]);
        if (results.length === 0) return res.status(201).json({ success: false, message: "Invalid email." });

        if (!(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).json({ success: false, message: "Invalid password." });
        }

         // ✅ Set session data
         req.session.adminId = results[0].id

        return res.status(200).json({ success: true, message: "Login successful." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.adminLogOut = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout Error:", err);
                return res.status(500).json({ success: false, message: "Logout failed" });
            }
            res.clearCookie("connect.sid"); 
            return res.redirect("/api/admin_login_view");
        });
    } catch (error) {
        console.error("Error in logout:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};
