const express = require('express')
const route = express.Router();
const departmentController = require('../controllers/admin/department.controller')
const upload = require('../middlewares/multer'); 
const adminAuthMiddleware = require('../middlewares/admin.auth.middleware'); 


route.get('/department_list', adminAuthMiddleware, departmentController.departmentList);

route.get('/add_department_view', adminAuthMiddleware, departmentController.addDepartmentView);

route.post('/add_department', adminAuthMiddleware, upload.any(), departmentController.addDepartment);

route.get('/view_edit_department', adminAuthMiddleware, departmentController.viewEditDepartment);

route.put('/update_department', upload.any(), adminAuthMiddleware, departmentController.updateDepartment);

route.put('/active_department', adminAuthMiddleware, departmentController.activeDepartment);

route.put('/block_department', adminAuthMiddleware, departmentController.blockDepartment); 

route.delete('/delete_department', adminAuthMiddleware, departmentController.deleteDepartment);

module.exports = route;