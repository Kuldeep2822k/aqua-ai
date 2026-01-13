const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');

// Sample data to serve when database is empty
const sampleLocations = [
    {
        id: 1,
        name: "Ganga at Varanasi",
        state: "Uttar Pradesh",
        district: "Varanasi",
        latitude: 25.3176,
        longitude: 82.9739,
        type: "river",
        riskLevel: "high",
        wqiScore: 45
    },
    {
        id: 2,
        name: "Yamuna at Delhi",
        state: "Delhi",
        district: "Delhi",
        latitude: 28.6139,
        longitude: 77.2090,
        type: "river",
        riskLevel: "critical",
        wqiScore: 28
    },
    {
        id: 3,
        name: "Godavari at Nashik",
        state: "Maharashtra",
        district: "Nashik",
        latitude: 19.9975,
        longitude: 73.7898,
        type: "river",
        riskLevel: "medium",
        wqiScore: 62
    },
    {
        id: 4,
        name: "Krishna at Vijayawada",
        state: "Andhra Pradesh",
        district: "Krishna",
        latitude: 16.5062,
        longitude: 80.6480,
        type: "river",
        riskLevel: "low",
        wqiScore: 78
    }
];

/**
 * @route   GET /api/locations
 * @desc    Get all monitoring locations
 * @access  Public
 */
router.get(
    '/',
    asyncHandler(async (req, res) => {
        // In a real implementation, this would query the database
        // const locations = await Location.findAll();

        res.json({
            success: true,
            count: sampleLocations.length,
            data: sampleLocations
        });
    })
);

/**
 * @route   GET /api/locations/:id
 * @desc    Get location by ID
 * @access  Public
 */
router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const location = sampleLocations.find(l => l.id === parseInt(req.params.id));

        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }

        res.json({
            success: true,
            data: location
        });
    })
);

module.exports = router;
