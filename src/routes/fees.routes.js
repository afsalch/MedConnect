const express = require('express')
const route = express.Router();
const feesController = require('../controllers/admin/fees.controller')
const adminAuthMiddleware = require('../middlewares/admin.auth.middleware'); 


route.get('/fees_list', adminAuthMiddleware, feesController.feesList);

route.get('/add_fees_view', adminAuthMiddleware, feesController.addFeesView);

route.post('/add_fees', adminAuthMiddleware, feesController.addFees);

route.get('/view_edit_fees', adminAuthMiddleware, feesController.viewEditFees);

route.put('/update_fees', adminAuthMiddleware, feesController.updateFees);

route.delete('/delete_fees', adminAuthMiddleware, feesController.deleteFees);

route.get('/download_fees', adminAuthMiddleware, feesController.downloadFees);

module.exports = route;