const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

// Sample alerts
const sampleAlerts = [
    {
        id: "alert-001",
        title: "High Pollution Level Detected",
        message: "BOD levels in Yamuna at Delhi exceed critical limits.",
        severity: "critical",
        location: "Yamuna at Delhi",
        coordinates: [28.6139, 77.2090],
        timestamp: new Date().toISOString(),
        isRead: false
    },
    {
        id: "alert-002",
        title: "Water Quality Warning",
        message: "TDS levels in Ganga at Varanasi are rising.",
        severity: "warning",
        location: "Ganga at Varanasi",
        coordinates: [25.3176, 82.9739],
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        isRead: true
    }
];

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts
 * @access  Public
 */
router.get(
    '/',
    asyncHandler(async (req, res) => {
        res.json({
            success: true,
            count: sampleAlerts.length,
            data: sampleAlerts
        });
    })
);

/**
 * @route   GET /api/alerts/active
 * @desc    Get active/unread alerts
 * @access  Public
 */
router.get(
    '/active',
    asyncHandler(async (req, res) => {
        const activeAlerts = sampleAlerts.filter(a => !a.isRead);
        res.json({
            success: true,
            count: activeAlerts.length,
            data: activeAlerts
        });
    })
);

module.exports = router;
