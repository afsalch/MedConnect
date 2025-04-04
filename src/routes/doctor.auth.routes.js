const express = require('express')
const route = express.Router();
const doctorLoginController = require('../controllers/doctor/doctor.auth.controller')

route.get('/doctor_login_view', doctorLoginController.doctorLoginView);

route.post('/doctor_login', doctorLoginController.doctorLogin);

route.get('/doctor_logout', doctorLoginController.doctorLogout);

module.exports = route; 