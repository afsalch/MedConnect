const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');
const { deleteImage } = require('../../utils/delete.image');

module.exports.availableTimeList = async (req, res) => {
    const itemsPerPage = 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;
    const doctorProfile = req.doctorProfileImg; 

    try {
        // ✅ Fetch required details including available_times
        const [available_time_list] = await connection.query(
            `SELECT * FROM ${tables.AVAILABLE_TIME} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [itemsPerPage, offset]
        );

        // ✅ Count total available time entries for the doctor
        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) AS total FROM ${tables.AVAILABLE_TIME}`
        );

        const totalPages = Math.ceil(total / itemsPerPage);
 
        // ✅ Parse available_times or set an empty array
        available_time_list.forEach(doctor => {
            try {
                doctor.available_times = doctor.available_times ? JSON.parse(doctor.available_times) : [];
        
                if (!Array.isArray(doctor.available_times)) {
                    doctor.available_times = [];
                }
        
                // Format the data to group by date and convert date format
                doctor.available_times = doctor.available_times.map(entry => {
                    if (typeof entry === 'object' && entry.date && entry.times) {
                        const formattedDate = new Date(entry.date).toLocaleDateString("en-GB"); 
                        return {
                            date: formattedDate,
                            times: entry.times.join(", ") // Join times into a single string
                        };
                    }
                    return entry;
                });
        
            } catch (error) {
                console.error("Error parsing available_times:", error);
                doctor.available_times = [];
            }
        });
        

        // ✅ Handle case where no available times exist
        const message = available_time_list.length === 0 ? "No available time slots added yet." : null;

        res.render('doctor/availableTimeList', {
            available_time_list,
            message,
            currentPage: page,
            totalPages: totalPages,
            itemsPerPage: itemsPerPage,
            doctorProfile
        });

    } catch (error) {
        console.error("Error fetching available time:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};



module.exports.addAvailbaleTimeView = (req, res) => {
    try {
        let timeSlots = [];

        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += 30) {
                let nextHour = hour;
                let nextMin = min + 30;

                if (nextMin === 60) {
                    nextMin = 0;
                    nextHour++;
                }

                let period = hour < 12 ? "AM" : "PM";
                let nextPeriod = nextHour < 12 ? "AM" : "PM";

                let displayHour = hour % 12 || 12;
                let nextDisplayHour = nextHour % 12 || 12;

                let startTime = `${displayHour}:${min === 0 ? '00' : min} ${period}`;
                let endTime = `${nextDisplayHour}:${nextMin === 0 ? '00' : nextMin} ${nextPeriod}`;

                timeSlots.push(`${startTime} - ${endTime}`);
            }
        }
        const doctorProfile = req.doctorProfileImg; 

        // Pass time slots to the view
        res.render('doctor/addAvailableTime', { timeSlots, doctorProfile });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
};




module.exports.addAvailableTime = async (req, res) => {
    try {
        const { selected_date, available_times, details } = req.body;
        const doctorId = req.doctorId
        

        // Validate required fields
        if (!doctorId || !selected_date || !available_times ) {
            return res.status(400).json({ success: false, message: 'Date and Available Times are required.' });
        }
        
        // Parse available_times if it's a stringified JSON
        let timesArray;
        try {
            timesArray = typeof available_times === "string" ? JSON.parse(available_times) : available_times;
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Invalid available_times format.' });
        }

        // Fetch existing available_times for the doctor
        const [availableTime] = await connection.query(
            `SELECT available_times FROM ${tables.AVAILABLE_TIME} `
        );

        // Initialize existing data
        let existingData = availableTime.length > 0 && availableTime[0].available_times
            ? JSON.parse(availableTime[0].available_times)
            : [];

        // Check if the selected_date already exists in the database
        const isDateExist = existingData.some(entry => entry.date === selected_date);
        if (isDateExist) {
            return res.status(400).json({ success: false, message: 'Date already exists.' });
        }

        let availableTimesArray =[]

        // Append the new date and times
        availableTimesArray.push({
            date: selected_date,
            times: timesArray
        });
       
        // Insert or update available_times and details in the database
        await connection.query(
            `INSERT INTO ${tables.AVAILABLE_TIME} (doctor_id, available_times, details) 
             VALUES (?, ?, ?)`,
            [doctorId, JSON.stringify(availableTimesArray), details, JSON.stringify(existingData), details]
        );

        res.status(200).json({
            success: true,
            message: 'Available times updated successfully!',
            available_times: existingData,
        });

    } catch (error) {
        console.error('Error updating available times:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};



module.exports.viewEditAvailbaleTime = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("Available time ID is required");
        } 

        // Fetch available time by ID
        const [rows] = await connection.query(
            `SELECT * FROM ${tables.AVAILABLE_TIME} WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).send("Available time not found");
        }

        const available_time_list = rows[0];

        // Parse available_times field
        let parsedAvailableTimes = [];
        if (available_time_list.available_times) {
            try {
                parsedAvailableTimes = JSON.parse(available_time_list.available_times);
            } catch (error) {
                console.error("Error parsing available_times:", error);
            }
        }

        // Extract first available date and times (assuming one date per entry)
        let selected_date = parsedAvailableTimes.length > 0 ? parsedAvailableTimes[0].date : "";
        let available_time_slots = parsedAvailableTimes.length > 0 ? parsedAvailableTimes[0].times : [];

        let timeSlots = [];

        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += 30) {
                let nextHour = hour;
                let nextMin = min + 30;

                if (nextMin === 60) {
                    nextMin = 0;
                    nextHour++;
                }

                let period = hour < 12 ? "AM" : "PM";
                let nextPeriod = nextHour < 12 ? "AM" : "PM";

                let displayHour = hour % 12 || 12;
                let nextDisplayHour = nextHour % 12 || 12;

                let startTime = `${displayHour}:${min === 0 ? '00' : min} ${period}`;
                let endTime = `${nextDisplayHour}:${nextMin === 0 ? '00' : nextMin} ${nextPeriod}`;

                timeSlots.push(`${startTime} - ${endTime}`);
            }
        }
        const doctorProfile = req.doctorProfileImg; 

        res.render('doctor/editAvailableTime', {
            available_time_list,
            selected_date,
            available_time_slots,
            timeSlots,
            doctorProfile
        });

    } catch (error) {
        console.error("Error fetching available time:", error);
        res.status(500).send("Internal Server Error");
    }
};



module.exports.updateAvailableTime = async (req, res) => {
    try {
        const { id ,selected_date, available_times, details } = req.body;
        const doctorId = req.doctorId
        
        console.log(req.body);
        

        // Validate required fields
        if (!id || !doctorId || !selected_date || !available_times ) {
            return res.status(400).json({ success: false, message: 'Date and Available Times are required.' });
        }
        
        // Parse available_times if it's a stringified JSON
        let timesArray;
        try {
            timesArray = typeof available_times === "string" ? JSON.parse(available_times) : available_times;
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Invalid available_times format.' });
        }

        // Fetch existing available_times for the doctor
        const [availableTime] = await connection.query(
            `SELECT available_times FROM ${tables.AVAILABLE_TIME} WHERE id != ?`,
            [id]
        );        

        // Initialize existing data
        let existingData = availableTime.length > 0 && availableTime[0].available_times
            ? JSON.parse(availableTime[0].available_times)
            : [];

        // Check if the selected_date already exists in the database
        const isDateExist = existingData.some(entry => entry.date === selected_date);
        if (isDateExist) {
            console.log('date already exist');
            
            return res.status(400).json({ success: false, message: 'Date already exists.' });
        }

        let availableTimesArray =[]

        // Append the new date and times
        availableTimesArray.push({
            date: selected_date,
            times: timesArray
        });

        console.log("availableTimesArray", JSON.stringify(availableTimesArray, null, 2));
        

        
        // Update the database
        await connection.query(
            `UPDATE ${tables.AVAILABLE_TIME} SET available_times = ?, details = ? WHERE doctor_id = ? AND id = ?`,
            [JSON.stringify(availableTimesArray), details, doctorId, id]
        );

        res.status(200).json({
            success: true,
            message: 'Available times updated successfully!'
        });

    } catch (error) {
        console.error('Error updating available times:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error });
    }
};

module.exports.deleteAvailbaleTime = async (req, res) => {
    try {
        const { id } = req.body;

        // Delete the department
        const [result] = await connection.query(
            `DELETE FROM ${tables.AVAILABLE_TIME} WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Failed to delete department" });
        }

        res.json({ success: true, message: "Available time deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};