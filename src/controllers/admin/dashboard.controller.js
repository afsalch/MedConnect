const connection = require('../../models/connect.mysql');
const tables = require('../../models/tables');

module.exports.dashboard = (req, res) => {
    try {
        res.render('admin/dashboard'); 
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}; 




module.exports.chartData = async (req, res) => {

    try {
        let labelObj = {};
        let patientCount = [];
        let feesCount = [];
        let findQuery;
        let today = new Date();
        let startDate, endDate, index;

        switch (req.body.filter.toLowerCase()) {
            case "daily":
                startDate = new Date();
                startDate.setDate(today.getDate() - 6); // Last 7 days
                endDate = today;
                labelObj = {};
                for (let i = 6; i >= 0; i--) {
                    let date = new Date();
                    date.setDate(today.getDate() - i);
                    let key = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
                    labelObj[key] = Object.keys(labelObj).length;
                }
                patientCount = new Array(7).fill(0);
                feesCount = new Array(7).fill(0);
                index = 3;
                break;

            case "weekly":
                startDate = new Date(); 
                startDate.setDate(today.getDate() - 6);
                endDate = today;
                labelObj = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
                patientCount = new Array(7).fill(0);
                feesCount = new Array(7).fill(0);
                index = 0;
                break;

            case "monthly":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                labelObj = {};
                for (let i = 1; i <= endDate.getDate(); i++) labelObj[String(i)] = i - 1;
                patientCount = new Array(endDate.getDate()).fill(0);
                feesCount = new Array(endDate.getDate()).fill(0);
                index = 1;
                break;

            case "yearly":
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                labelObj = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
                patientCount = new Array(12).fill(0);
                feesCount = new Array(12).fill(0);
                index = 2;
                break;

            default:
                return res.status(400).json({ message: "Invalid filter option" });
        }

        // Query the database
        const query = `
            SELECT date, COUNT(patient_id) AS totalPatients, SUM(amount) AS totalFees
            FROM ${tables.FEES}
            WHERE date BETWEEN ? AND ?
            GROUP BY date
        `;

        const [rows] = await connection.query(query, [startDate, endDate]);

        rows.forEach((row) => {
            let key;
            let dateObj = new Date(row.date);

            if (index === 0) key = dateObj.toLocaleString('en-US', { weekday: 'short' }); // Weekly
            if (index === 1) key = dateObj.getDate().toString(); // Monthly
            if (index === 2) key = dateObj.toLocaleString('en-US', { month: 'short' }); // Yearly
            if (index === 3) key = row.date; // Daily (YYYY-MM-DD format)

            if (labelObj[key] !== undefined) {
                patientCount[labelObj[key]] = row.totalPatients;
                feesCount[labelObj[key]] = row.totalFees;
            }
        }); 

        res.json({ label: Object.keys(labelObj), patientCount, feesCount });
    } catch (err) {
        console.error("Error fetching chart data:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};