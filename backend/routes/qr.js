const express = require("express");
const QRCode = require("qrcode");
const auth = require("../middleware/auth");

const router = express.Router();

// Generate QR (Teacher)
router.get("/generate", auth, async (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Access denied" });
  }

  const qrData = JSON.stringify({
    teacherId: req.user.id,
    timestamp: Date.now()
  });

  const qrCode = await QRCode.toDataURL(qrData);
  res.json({ qrCode });
});

module.exports = router;
