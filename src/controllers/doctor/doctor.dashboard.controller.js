module.exports.doctorDashboard = (req,res) => {
    try {
        const doctorProfile = req.doctorProfileImg; 
        res.render('doctor/doctorDashboard', { doctorProfile })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}