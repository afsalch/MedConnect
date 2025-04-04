const express = require('express')
const route = express.Router();
const paymentController = require('../controllers/admin/payment.type.controller')
const adminAuthMiddleware = require('../middlewares/admin.auth.middleware'); 


route.get('/payment_list', adminAuthMiddleware, paymentController.paymentlist);

route.get('/view_add_payment', adminAuthMiddleware, paymentController.viewAddPayment);

route.post('/insert_payment', adminAuthMiddleware, paymentController.insertpayment);

route.get('/toggle_status', adminAuthMiddleware, paymentController.updateStatus);

route.get('/edit_payment', adminAuthMiddleware, paymentController.editpayment);

route.put('/update_payment', adminAuthMiddleware, paymentController.updatepayment);

route.get('/delete_payment', adminAuthMiddleware, paymentController.deletepayment);

module.exports = route;




