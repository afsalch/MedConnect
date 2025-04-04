const fs = require('fs');
const path = require('path');


const deleteImage = (filename) => {
    if (!filename) return; 

    const filePath = path.join(__dirname, '../../public/assets/imgs/uploadedImages', filename);
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file ${filePath}:`, err);
            } else {
                // console.log(`Deleted file: ${filePath}`);
            }
        });
    } else { 
        console.log(`File not found for deletion: ${filePath}`);
    }
};

module.exports = { deleteImage };
