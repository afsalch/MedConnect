const express = require('express')
const route = express.Router();
const dashboardController = require('../controllers/admin/dashboard.controller')
const adminAuthMiddleware = require('../middlewares/admin.auth.middleware'); 

route.get('/dashboard', adminAuthMiddleware, dashboardController.dashboard);

route.post('/chart_data', adminAuthMiddleware, dashboardController.chartData);

module.exports = route;