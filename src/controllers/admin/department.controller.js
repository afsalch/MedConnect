const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const { deleteImage } = require('../../utils/delete.image');

module.exports.departmentList = async (req, res) => {
    const itemsPerPage = 5;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;

    try {
        // Fetch paginated department list ordered by date descending
        const [department_list] = await connection.query(
            `SELECT * FROM ${tables.DEPARTMENT} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [itemsPerPage, offset]
        );

        // Count total number of departments
        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) AS total FROM ${tables.DEPARTMENT}`
        );

        const totalPages = Math.ceil(total / itemsPerPage);

        // Handle case where no departments exist
        const message = department_list.length === 0 ? "No departments have been added yet." : null;

        // Parse JSON attachments (if any)
        const parsedDepartments = department_list.map(dept => ({
            ...dept,
            attachments: dept.attachments ? JSON.parse(dept.attachments) : []
        }));

        res.render('admin/departmentList', {
            department_list: parsedDepartments,
            message: message,
            currentPage: page,
            totalPages: totalPages,
            itemsPerPage: itemsPerPage
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.addDepartmentView = (req, res) => {
    try {
        res.render('admin/addDepartment');
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}


module.exports.addDepartment = async (req, res) => {
    try {
        const { department_name, details } = req.body;

        // Validate required fields
        if (!department_name.trim()) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Department name is required.' });
        }

        // Check if the department name already exists 
        const [existingDepartment] = await connection.query(
            `SELECT department_name FROM ${tables.DEPARTMENT} WHERE department_name = ?`,
            [department_name]
        );

        if (existingDepartment.length > 0) {
            req.files.forEach(file => deleteImage(file.filename));
            return res.status(400).json({ success: false, message: 'Department name already exists.' });
        }

        // Get uploaded file name (if any)
        const image = req.files?.length > 0 ? req.files.map(file => file.filename) : [];


        // Insert into database
        await connection.query(`
            INSERT INTO ${tables.DEPARTMENT} 
            (department_name, details, attachments) 
            VALUES (?, ?, ?)`, [
            department_name,
            details,
            JSON.stringify(image),
        ]);

        // Send response after successful insertion
        res.status(201).json({
            success: true,
            message: 'Department added successfully!',
            image,
        });

    } catch (error) {
        req.files.forEach(file => deleteImage(file.filename));
        console.error('Error adding department:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};



module.exports.viewEditDepartment = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("Department ID is required");
        }

        // Fetch department by ID
        const [rows] = await connection.query(
            `SELECT * FROM ${tables.DEPARTMENT} WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).send("Department not found");
        }

        const department = rows[0];


        res.render('admin/editDepartment', { department });

    } catch (error) {
        console.error("Error fetching department:", error);
        res.status(500).send("Internal Server Error");
    }
};


module.exports.updateDepartment = async (req, res) => {
    try {
        const { id, department_name, details, delete_images } = req.body;
        let attachments = [];
        let uploadedImages = req.files ? req.files.map(file => file.filename) : [];

        // Fetch existing department
        const [existingDepartment] = await connection.query(
            `SELECT attachments FROM ${tables.DEPARTMENT} WHERE id = ?`,
            [id]
        );

        if (existingDepartment.length > 0) {
            // Parse existing attachments if available
            existingAttachments = existingDepartment[0].attachments
                ? JSON.parse(existingDepartment[0].attachments)
                : [];

            // Handle deletion of existing images
            if (delete_images === 'true' || req.files?.length > 0) {
                existingAttachments.forEach(file => deleteImage(file));
            }

            if (req.files?.length > 0) {
                attachments = [...uploadedImages];
            } else if (delete_images === 'true') {
                attachments = []
            } else if (req.files?.length == 0) {
                attachments = [...existingAttachments];
            }

        }

        // Update database with new images
        await connection.query(
            `UPDATE ${tables.DEPARTMENT} SET department_name = ?, details = ?, attachments = ? WHERE id = ?`,
            [department_name, details, JSON.stringify(attachments), id]
        );

        res.json({ success: true, message: 'Department updated successfully' });

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



module.exports.activeDepartment = async (req, res) => {
    try {
        const { id } = req.body;

        // Update isBlocked to FALSE
        const [result] = await connection.query(
            `UPDATE ${tables.DEPARTMENT} SET isBlocked = FALSE WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.json({ success: true, message: "Department activated successfully" });

    } catch (error) {
        console.error("Activation Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};


module.exports.blockDepartment = async (req, res) => {
    try {
        const { id } = req.body;

        // Update isBlocked to FALSE
        const [result] = await connection.query(
            `UPDATE ${tables.DEPARTMENT} SET isBlocked = TRUE WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.json({ success: true, message: "Department blocked successfully" });

    } catch (error) {
        console.error("Blocking Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
}


module.exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.body;

        // Fetch the department to check if it exists and get attachments
        const [existingDepartment] = await connection.query(
            `SELECT attachments FROM ${tables.DEPARTMENT} WHERE id = ?`,
            [id]
        );

        if (existingDepartment.length > 0) {
            // Delete attached images (if any)
            const existingAttachments = existingDepartment[0].attachments
                ? JSON.parse(existingDepartment[0].attachments)
                : [];

            existingAttachments.forEach(file => deleteImage(file)); 
        }



        // Delete the department
        const [result] = await connection.query(
            `DELETE FROM ${tables.DEPARTMENT} WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Failed to delete department" });
        }

        res.json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};