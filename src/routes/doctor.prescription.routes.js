const express = require('express')
const route = express.Router();
const doctorPrescriptionController = require('../controllers/doctor/doctor.prescription.controller');
const upload = require('../middlewares/multer'); 
const doctorauthMiddleware = require('../middlewares/doctor.auth.middleware'); 

route.post('/add_prescription',  upload.any(), doctorauthMiddleware, doctorPrescriptionController.addPrescription);

route.get('/prescription_list', doctorauthMiddleware, doctorPrescriptionController.prescriptionList);

route.get('/view_edit_prescription', doctorauthMiddleware, doctorPrescriptionController.viewEditPrescription);

route.put('/edit_prescription',  upload.any(), doctorauthMiddleware, doctorPrescriptionController.editPrescription);

module.exports = route;