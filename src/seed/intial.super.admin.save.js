const connection = require('../models/connect.mysql');
const bcrypt = require('bcrypt');

// Default SuperAdmin details
const defaultSuperAdmin = {
    name: 'Admin',
    email: 'Admin@gmail.com',
    phone: '9876543210',
    password: 'Admin@123',
    address: 'Stak centre, new bus stand kasaragod',
    isBlocked: false,
};
 
// Function to seed the default SuperAdmin
async function seedSuperAdmin() {
    try {
    //     // Hash the default password
        const hashedPassword = await bcrypt.hash(defaultSuperAdmin.password, 10); 


        const insertQuery = `
            INSERT INTO Admin (
                admin_name, email, phone, password, isBlocked, address
            )
            SELECT * FROM (SELECT ?, ?, ?, ?, ?, ?) AS tmp
            WHERE NOT EXISTS (
                SELECT email FROM Admin WHERE email = ?
            ) LIMIT 1;
    `;


    //     // Execute the query with values
        await connection.query(insertQuery, [
            defaultSuperAdmin.name,
            defaultSuperAdmin.email,
            defaultSuperAdmin.phone,
            hashedPassword,
            defaultSuperAdmin.isBlocked,
            defaultSuperAdmin.address,
            defaultSuperAdmin.email, 
        ]);


        console.log('Default SuperAdmin added or already exists.');
    } catch (error) {
        console.error('Error seeding SuperAdmin:', error.message);
    }
}
 
module.exports = { seedSuperAdmin };   