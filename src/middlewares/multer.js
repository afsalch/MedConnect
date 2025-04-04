const multer = require('multer');
const path = require('path');

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the directory to save uploaded files
        cb(null, path.join(__dirname, '../../public/assets/imgs/uploadedImages'));
    },
    filename: function (req, file, cb) {
        // Generate a unique filename
        const uniqueSuffix = Date.now();
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

// File filter to accept image and PDF files
const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|webp|bmp|svg|heic/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error('Only image and PDF files are allowed.'));
    }
};

// Multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 }, 
});

module.exports = upload;
