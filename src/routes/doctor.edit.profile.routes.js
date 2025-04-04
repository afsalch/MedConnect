const express = require('express')
const route = express.Router();
const doctorEditProfileController = require('../controllers/doctor/doctor.edit.profile.controller')
const upload = require('../middlewares/multer'); 
const doctorauthMiddleware = require('../middlewares/doctor.auth.middleware'); 


route.get('/edit_doctor_profile', doctorauthMiddleware, doctorEditProfileController.editDoctorProfile);

route.post('/update_doctor_profile',  upload.any(), doctorauthMiddleware, doctorEditProfileController.updateDoctorProfile);

route.get('/view_change_doctor_password', doctorauthMiddleware, doctorEditProfileController.viewChangeDoctorPassword);

route.post('/check_doctor_username', doctorauthMiddleware, doctorEditProfileController.checkDoctorUsername);

route.post('/doctor_change_password', doctorauthMiddleware, doctorEditProfileController.doctorChangePassword);

module.exports = route;