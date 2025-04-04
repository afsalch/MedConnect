const express = require('express')
const route = express.Router();
const availableTimeController = require('../controllers/doctor/available.time.controller')
const upload = require('../middlewares/multer'); 
const doctorauthMiddleware = require('../middlewares/doctor.auth.middleware'); 


route.get('/available_time_list', doctorauthMiddleware, availableTimeController.availableTimeList);

route.get('/add_available_time_view', doctorauthMiddleware, availableTimeController.addAvailbaleTimeView);

route.post('/add_available_time', doctorauthMiddleware, upload.any(), availableTimeController.addAvailableTime);

route.get('/view_edit_available_time', doctorauthMiddleware, availableTimeController.viewEditAvailbaleTime);

route.put('/update_available_time', doctorauthMiddleware, upload.any(), availableTimeController.updateAvailableTime);

route.delete('/delete_available_time', doctorauthMiddleware, availableTimeController.deleteAvailbaleTime);

module.exports = route;