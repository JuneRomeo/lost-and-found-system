
const express = require("express");
const { Readable } = require("stream");

const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

const router = express.Router();

// Upload an image to Cloudinary
router.post("/", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image to upload."
            });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "lost-and-found"
            },
            (error, result) => {
                if (error) {
                    return res.status(500).json({
                        message: "Image upload failed.",
                        error: error.message
                    });
                }

                res.status(200).json({
                    message: "Image uploaded successfully!",
                    imageUrl: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        Readable.from(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong during image upload.",
            error: error.message
        });
    }
});

module.exports = router;
