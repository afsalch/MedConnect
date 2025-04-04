const express = require('express')
const route = express.Router();
const doctorAppointmentController = require('../controllers/doctor/doctor.appoinment.controller');
const doctorauthMiddleware = require('../middlewares/doctor.auth.middleware'); 


route.get('/appointments_list', doctorauthMiddleware, doctorAppointmentController.appointmentList);

route.get('/view_add_prescription', doctorauthMiddleware, doctorAppointmentController.viewAddPrescription);


module.exports = route;