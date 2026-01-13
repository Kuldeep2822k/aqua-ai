const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

// Sample water quality readings
const sampleReadings = [
    {
        locationId: 1,
        readings: [
            { parameter: "BOD", value: 8.5, unit: "mg/L", date: "2024-09-13", safeLimit: 3.0, exceedsLimit: true },
            { parameter: "TDS", value: 650, unit: "mg/L", date: "2024-09-13", safeLimit: 500, exceedsLimit: true },
            { parameter: "pH", value: 7.8, unit: "", date: "2024-09-13", safeLimit: 8.5, exceedsLimit: false },
            { parameter: "DO", value: 4.2, unit: "mg/L", date: "2024-09-13", safeLimit: 6.0, exceedsLimit: true }
        ]
    },
    {
        locationId: 2,
        readings: [
            { parameter: "BOD", value: 15.2, unit: "mg/L", date: "2024-09-13", safeLimit: 3.0, exceedsLimit: true },
            { parameter: "TDS", value: 850, unit: "mg/L", date: "2024-09-13", safeLimit: 500, exceedsLimit: true },
            { parameter: "Coliform", value: 45.3, unit: "MPN/100ml", date: "2024-09-13", safeLimit: 2.2, exceedsLimit: true }
        ]
    },
    {
        locationId: 3,
        readings: [
            { parameter: "BOD", value: 4.8, unit: "mg/L", date: "2024-09-13", safeLimit: 3.0, exceedsLimit: true },
            { parameter: "TDS", value: 420, unit: "mg/L", date: "2024-09-13", safeLimit: 500, exceedsLimit: false },
            { parameter: "pH", value: 7.2, unit: "", date: "2024-09-13", safeLimit: 8.5, exceedsLimit: false }
        ]
    },
    {
        locationId: 4,
        readings: [
            { parameter: "BOD", value: 2.1, unit: "mg/L", date: "2024-09-13", safeLimit: 3.0, exceedsLimit: false },
            { parameter: "TDS", value: 380, unit: "mg/L", date: "2024-09-13", safeLimit: 500, exceedsLimit: false },
            { parameter: "pH", value: 7.4, unit: "", date: "2024-09-13", safeLimit: 8.5, exceedsLimit: false },
            { parameter: "DO", value: 6.8, unit: "mg/L", date: "2024-09-13", safeLimit: 6.0, exceedsLimit: false }
        ]
    }
];

/**
 * @route   GET /api/water-quality
 * @desc    Get all water quality readings
 * @access  Public
 */
router.get(
    '/',
    asyncHandler(async (req, res) => {
        // In a real implementation, this would query the database with filters
        res.json({
            success: true,
            data: sampleReadings
        });
    })
);

/**
 * @route   GET /api/water-quality/latest
 * @desc    Get latest readings for all locations
 * @access  Public
 */
router.get(
    '/latest',
    asyncHandler(async (req, res) => {
        res.json({
            success: true,
            data: sampleReadings
        });
    })
);

/**
 * @route   GET /api/water-quality/location/:id
 * @desc    Get readings for a specific location
 * @access  Public
 */
router.get(
    '/location/:id',
    asyncHandler(async (req, res) => {
        const locationId = parseInt(req.params.id);
        const data = sampleReadings.find(r => r.locationId === locationId);

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'No data found for this location'
            });
        }

        res.json({
            success: true,
            data: data.readings
        });
    })
);

module.exports = router;
