const express = require('express')
const route = express.Router();
const patientLoginController = require('../controllers/patient/patients.auth.controller')
const upload = require('../middlewares/multer'); 

route.get('/patient_login_view', patientLoginController.patientLoginView);

route.post('/patient_login', patientLoginController.patientLogin);

route.get('/patient_register_view', patientLoginController.patientRegisterView);

route.post('/patient_register', upload.any(), patientLoginController.patientRegister);

route.get('/patient_logout', patientLoginController.patientLogout);

module.exports = route;