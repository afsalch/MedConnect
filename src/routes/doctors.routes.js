const express = require('express')
const route = express.Router();
const doctorController = require('../controllers/admin/doctor.controller')
const upload = require('../middlewares/multer'); 
const adminAuthMiddleware = require('../middlewares/admin.auth.middleware'); 


route.get('/doctors_list', adminAuthMiddleware, doctorController.doctorList);

route.get('/add_doctor_view', adminAuthMiddleware, doctorController.addDoctorView);

route.post('/add_doctors', adminAuthMiddleware, upload.any(), doctorController.addDoctor);

route.get('/view_edit_doctor', adminAuthMiddleware, doctorController.viewEditDoctor);

route.put('/update_doctor', adminAuthMiddleware, upload.any(), doctorController.updateDoctor);

route.get('/view_doctor_detail', adminAuthMiddleware, doctorController.doctorDetails);

route.put('/active_doctor', adminAuthMiddleware, doctorController.activeDoctor); 

route.put('/block_doctor', adminAuthMiddleware, doctorController.blockDoctor); 

route.put('/confirm_doctor', adminAuthMiddleware, doctorController.confirmDoctor);

route.put('/cancel_doctor', adminAuthMiddleware, doctorController.cancelDoctor);

route.delete('/delete_doctor', adminAuthMiddleware, doctorController.deleteDoctor);

module.exports = route;