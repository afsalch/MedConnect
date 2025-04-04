const express = require('express')
const route = express.Router();
const doctorDashboardController = require('../controllers/doctor/doctor.dashboard.controller')
const doctorauthMiddleware = require('../middlewares/doctor.auth.middleware'); 

route.get('/doctor_dashboard', doctorauthMiddleware, doctorDashboardController.doctorDashboard);

module.exports = route;