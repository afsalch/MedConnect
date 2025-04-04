const express = require('express');
const app = express();
const path = require('path');
const adminloginRoutes = require("./routes/admin.auth.routes");
const  dashboardRoutes = require("./routes/dashboard.routes");
const  doctordashboardRoutes = require("./routes/doctor.dashboard.routes");
const  departmentRoutes = require("./routes/department.routes")
const doctorloginRoutes = require("./routes/doctor.auth.routes");
const availableTimeRoutes = require("./routes/available.time.routes");
const  doctorRoutes = require("./routes/doctors.routes");
const patientloginRoutes = require("./routes/patients.auth.routes");
const patientRoutes = require("./routes/patient.routes");
const doctorAppoinmentsRoutes = require("./routes/doctor.appointments.routes");
const doctorPrescriptionsRoutes = require("./routes/doctor.prescription.routes");
const editProfileRoutes = require("./routes/doctor.edit.profile.routes");
const paymentTypeRoutes = require("./routes/payment.type.routes");
const feesRoutes = require("./routes/fees.routes");
const { createTables } = require('../src/models/schema'); 
const { seedSuperAdmin } = require('../src/seed/intial.super.admin.save');
const session = require("express-session");



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "your-secret-key", 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use('/api', adminloginRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', departmentRoutes);
app.use('/api', doctorRoutes);
app.use('/api', doctorloginRoutes);
app.use('/api', doctordashboardRoutes);
app.use('/api', availableTimeRoutes);
app.use('/api', patientloginRoutes);
app.use('/api', patientRoutes);
app.use('/api', editProfileRoutes);
app.use('/api', doctorAppoinmentsRoutes);
app.use('/api', doctorPrescriptionsRoutes);
app.use('/api', paymentTypeRoutes);
app.use('/api', feesRoutes);  



 

async function initializeApp() { 
    await createTables(); 
    await seedSuperAdmin(); 

    const PORT = process.env.PORT || 6474;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}/api/admin_login_view`);
        console.log(`Server running on http://localhost:${PORT}/api/doctor_login_view`);
        console.log(`Server running on http://localhost:${PORT}/api/patient_login_view`);
    });
}

initializeApp();
