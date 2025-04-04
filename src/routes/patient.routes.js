const express = require('express')
const route = express.Router();
const patientsController = require('../controllers/patient/patients.controller')
const upload = require('../middlewares/multer'); 
const patientAuthMiddleware = require('../middlewares/patient.auth.middleware'); 


route.get('/view_home_page', patientAuthMiddleware, patientsController.viewHomePage);

route.get('/view_about_page', patientAuthMiddleware, patientsController.viewAboutPage);

route.get('/view_service_page', patientAuthMiddleware, patientsController.viewServicePage);

route.get('/view_all_departmets_page', patientAuthMiddleware, patientsController.viewAllDepartmentPage);

route.get('/view_single_department_page', patientAuthMiddleware, patientsController.viewSingleDepartmentPage);

route.get('/view_all_doctors_page', patientAuthMiddleware, patientsController.viewAllDoctorsPage);

route.get('/view_single_doctor_page', patientAuthMiddleware, patientsController.viewSingleDoctorPage);

route.get('/view_appointment_page', patientAuthMiddleware, patientsController.viewAppointmentPage);

route.post('/book_appointment', upload.any(), patientAuthMiddleware, patientsController.bookAppointment);

route.get('/view_contact_page', patientAuthMiddleware, patientsController.viewContactPage);

route.get('/view_prescription_page', patientAuthMiddleware, patientsController.viewPrescriptionPage);

route.post('/add_department_comment', patientAuthMiddleware, patientsController.addDepartmentComment);


module.exports = route;