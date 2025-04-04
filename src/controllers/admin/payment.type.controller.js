const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');


module.exports.paymentlist = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    try {
        const [payments] = await connection.query(
            `SELECT * FROM ${tables.PAYMENTS} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [pageSize, offset]
        );

        const [[{ totalCount }]] = await connection.query(
            `SELECT COUNT(*) as totalCount FROM ${tables.PAYMENTS}`
        );

        const totalPages = Math.ceil(totalCount / pageSize);

        res.render('admin/paymentList', { payments, currentPage: page, totalPages });
    } catch (error) {
        console.error("Error fetching payments: ", error);
        res.status(500).json({ message: "An error occurred while fetching the payments." });
    }
};


module.exports.viewAddPayment = (req,res)=>{
    try {
        res.render('admin/addPayment')
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
    
}

module.exports.insertpayment = async (req, res) => {
    try {
        const { payment_type, details } = req.body;

        if (!payment_type) {
            return res.status(400).json({ message: "payment type is required" });
        }

        // Check if payment_type already exists
        const checkQuery = `SELECT id FROM ${tables.PAYMENTS} WHERE payment_type = ?`;
        const [existingPayment] = await connection.query(checkQuery, [payment_type]);

        if (existingPayment.length > 0) {
            return res.status(400).json({ message: "Payment type already exists." });
        }

        // Insert new payment type if it doesn't exist
        const query = `INSERT INTO ${tables.PAYMENTS} (payment_type, details) VALUES (?, ?)`;
        await connection.query(query, [payment_type, details]);

        return res.status(200).json({ message: "Payment added successfully" });
    } catch (error) {
        console.error("Error inserting payment:", error);
        res.status(500).json({ message: "An error occurred while inserting the payment." });
    }
};

 
module.exports.updateStatus = async (req, res) => {
    const { id, status } = req.query;

    try {
        await connection.query(`UPDATE ${tables.PAYMENTS} SET status = ? WHERE id = ?`, [status, id]);
        res.json({ success: true, message: `Payment ${status}d successfully!` });
    } catch (error) {
        console.error('Error updating payment status: ', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating the payment status.' });
    }
};


module.exports.editpayment = async (req,res)=>{
    const { id } = req.query;

    try {
        const [payments] = await connection.query(`SELECT * FROM ${tables.PAYMENTS} WHERE id = ?`, [id]);

        
            res.render('admin/editpayment', { payment: payments[0] });
        
    } catch (error) {
        console.error('Error fetching payment: ', error);
        res.status(500).json({ message: 'An error occurred while fetching the payment.' });
    }
}

module.exports.updatepayment = async (req, res) => {
    const { id, payment_type, details } = req.body;

    try {
        if (!payment_type) {
            return res.status(400).json({ message: "payment type is required" });
        }

        // Check if payment_type already exists
        const checkQuery = `SELECT id FROM ${tables.PAYMENTS} WHERE payment_type = ? AND id != ?`;
        const [existingPayment] = await connection.query(checkQuery, [payment_type, id]);

        if (existingPayment.length > 0) {
            return res.status(400).json({ message: "Payment type already exists." });
        }

        await connection.query(
            `UPDATE ${tables.PAYMENTS} SET payment_type = ?, details = ? WHERE id = ?`, 
            [payment_type, details, id]
        );

        res.status(200).json({ success: true, message: 'Payment updated successfully.' });
    } catch (error) {
        console.error('Error updating payment: ', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating the payment.' });
    }
};



module.exports.deletepayment = async (req,res)=>{
    const id = req.query.id;

    try {
        // await connection.query(`DELETE FROM ${tables.PAYMENTS} WHERE id = ?`, [id]);
        // res.redirect('/api/paymentlist')
    } catch (error) {
        console.error('Error deleting payment: ', error);
        res.status(500).json({ message: 'An error occurred while deleting the payment.' });
    }
}

