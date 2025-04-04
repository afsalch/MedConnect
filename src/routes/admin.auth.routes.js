const express = require('express')
const route = express.Router();
const adminLoginController = require('../controllers/admin/admin.auth.controller')

route.get('/admin_login_view', adminLoginController.adminLoginView);

route.post('/admin_login', adminLoginController.adminLogin);

route.get('/admin_logout', adminLoginController.adminLogOut);

module.exports = route;