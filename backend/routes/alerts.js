const express = require('express');
const router = express.Router();
const supabase = require('../src/supabase');

// Mock alerts data - fallback if Supabase is unavailable
const mockAlerts = [
  {
    id: 1,
    location_id: 1,
    location_name: "Ganga at Varanasi",
    state: "Uttar Pradesh",
    parameter: "BOD",
    alert_type: "threshold_exceeded",
    severity: "high",
    message: "BOD levels exceed safe limits",
    threshold_value: 6.0,
    actual_value: 8.5,
    status: "active",
    triggered_at: "2024-01-15T08:30:00Z",
    resolved_at: null,
    notification_sent: true,
    created_at: "2024-01-15T08:30:00Z"
  },
  {
    id: 2,
    location_id: 1,
    location_name: "Ganga at Varanasi",
    state: "Uttar Pradesh",
    parameter: "Lead",
    alert_type: "threshold_exceeded",
    severity: "critical",
    message: "Lead contamination critical",
    threshold_value: 0.1,
    actual_value: 0.15,
    status: "active",
    triggered_at: "2024-01-15T06:30:00Z",
    resolved_at: null,
    notification_sent: true,
    created_at: "2024-01-15T06:30:00Z"
  },
  {
    id: 3,
    location_id: 2,
    location_name: "Yamuna at Delhi",
    state: "Delhi",
    parameter: "BOD",
    alert_type: "threshold_exceeded",
    severity: "critical",
    message: "BOD levels critically high",
    threshold_value: 10.0,
    actual_value: 15.2,
    status: "active",
    triggered_at: "2024-01-15T11:00:00Z",
    resolved_at: null,
    notification_sent: true,
    created_at: "2024-01-15T11:00:00Z"
  },
  {
    id: 4,
    location_id: 2,
    location_name: "Yamuna at Delhi",
    state: "Delhi",
    parameter: "Coliform",
    alert_type: "threshold_exceeded",
    severity: "critical",
    message: "Bacterial contamination critical",
    threshold_value: 50.0,
    actual_value: 120.5,
    status: "active",
    triggered_at: "2024-01-15T11:30:00Z",
    resolved_at: null,
    notification_sent: true,
    created_at: "2024-01-15T11:30:00Z"
  },
  {
    id: 5,
    location_id: 3,
    location_name: "Godavari at Nashik",
    state: "Maharashtra",
    parameter: "BOD",
    alert_type: "threshold_exceeded",
    severity: "medium",
    message: "BOD levels moderately high",
    threshold_value: 6.0,
    actual_value: 4.8,
    status: "resolved",
    triggered_at: "2024-01-15T14:15:00Z",
    resolved_at: "2024-01-15T16:15:00Z",
    notification_sent: true,
    created_at: "2024-01-15T14:15:00Z"
  }
];

// GET /api/alerts - Get all alerts
router.get('/', async (req, res) => {
  try {
    const {
      status,
      severity,
      location_id,
      parameter,
      alert_type,
      start_date,
      end_date,
      limit = 100,
      offset = 0
    } = req.query;

    let filteredAlerts = [...mockAlerts];

    // Apply filters
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }

    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    if (location_id) {
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.location_id === parseInt(location_id)
      );
    }

    if (parameter) {
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.parameter.toLowerCase() === parameter.toLowerCase()
      );
    }

    if (alert_type) {
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.alert_type === alert_type
      );
    }

    if (start_date) {
      filteredAlerts = filteredAlerts.filter(alert =>
        new Date(alert.triggered_at) >= new Date(start_date)
      );
    }

    if (end_date) {
      filteredAlerts = filteredAlerts.filter(alert =>
        new Date(alert.triggered_at) <= new Date(end_date)
      );
    }

    // Apply pagination
    const total = filteredAlerts.length;
    const paginatedData = filteredAlerts.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// GET /api/alerts/active - Get active alerts only
router.get('/active', async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;

    let activeAlerts = mockAlerts.filter(alert => alert.status === 'active');

    if (severity) {
      activeAlerts = activeAlerts.filter(alert => alert.severity === severity);
    }

    if (limit) {
      activeAlerts = activeAlerts.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: activeAlerts,
      count: activeAlerts.length
    });

  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active alerts',
      message: error.message
    });
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let alerts = [...mockAlerts];

    if (start_date) {
      alerts = alerts.filter(alert =>
        new Date(alert.triggered_at) >= new Date(start_date)
      );
    }

    if (end_date) {
      alerts = alerts.filter(alert =>
        new Date(alert.triggered_at) <= new Date(end_date)
      );
    }

    const stats = {
      total_alerts: alerts.length,
      active_alerts: alerts.filter(alert => alert.status === 'active').length,
      resolved_alerts: alerts.filter(alert => alert.status === 'resolved').length,
      dismissed_alerts: alerts.filter(alert => alert.status === 'dismissed').length,
      severity_distribution: {
        low: alerts.filter(alert => alert.severity === 'low').length,
        medium: alerts.filter(alert => alert.severity === 'medium').length,
        high: alerts.filter(alert => alert.severity === 'high').length,
        critical: alerts.filter(alert => alert.severity === 'critical').length
      },
      alert_types: {
        threshold_exceeded: alerts.filter(alert => alert.alert_type === 'threshold_exceeded').length,
        anomaly_detected: alerts.filter(alert => alert.alert_type === 'anomaly_detected').length,
        prediction_alert: alerts.filter(alert => alert.alert_type === 'prediction_alert').length,
        system_alert: alerts.filter(alert => alert.alert_type === 'system_alert').length
      },
      parameters_with_alerts: [...new Set(alerts.map(alert => alert.parameter))],
      locations_with_alerts: [...new Set(alerts.map(alert => alert.location_id))].length,
      average_resolution_time: calculateAverageResolutionTime(alerts)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics',
      message: error.message
    });
  }
});

// GET /api/alerts/:id - Get specific alert
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = mockAlerts.find(alert => alert.id === parseInt(id));

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert',
      message: error.message
    });
  }
});

// PUT /api/alerts/:id/resolve - Resolve an alert
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const alert = mockAlerts.find(alert => alert.id === parseInt(id));

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    if (alert.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: 'Alert is already resolved'
      });
    }

    // Update alert status
    alert.status = 'resolved';
    alert.resolved_at = new Date().toISOString();
    if (resolution_notes) {
      alert.resolution_notes = resolution_notes;
    }

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error.message
    });
  }
});

// PUT /api/alerts/:id/dismiss - Dismiss an alert
router.put('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const { dismissal_reason } = req.body;

    const alert = mockAlerts.find(alert => alert.id === parseInt(id));

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    if (alert.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Only active alerts can be dismissed'
      });
    }

    // Update alert status
    alert.status = 'dismissed';
    alert.dismissed_at = new Date().toISOString();
    if (dismissal_reason) {
      alert.dismissal_reason = dismissal_reason;
    }

    res.json({
      success: true,
      message: 'Alert dismissed successfully',
      data: alert
    });

  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss alert',
      message: error.message
    });
  }
});

// POST /api/alerts/notify - Send notifications for alerts
router.post('/notify', async (req, res) => {
  try {
    const { alert_ids, notification_type = 'email' } = req.body;

    if (!alert_ids || !Array.isArray(alert_ids)) {
      return res.status(400).json({
        success: false,
        error: 'Alert IDs array is required'
      });
    }

    // Mock notification sending
    const notifications = alert_ids.map(alertId => {
      const alert = mockAlerts.find(a => a.id === alertId);
      return {
        alert_id: alertId,
        notification_type,
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient: 'user@example.com'
      };
    });

    res.json({
      success: true,
      message: 'Notifications sent successfully',
      data: notifications
    });

  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notifications',
      message: error.message
    });
  }
});

// Helper function to calculate average resolution time
function calculateAverageResolutionTime(alerts) {
  const resolvedAlerts = alerts.filter(alert => 
    alert.status === 'resolved' && alert.resolved_at
  );

  if (resolvedAlerts.length === 0) return null;

  const totalTime = resolvedAlerts.reduce((sum, alert) => {
    const triggered = new Date(alert.triggered_at);
    const resolved = new Date(alert.resolved_at);
    return sum + (resolved - triggered);
  }, 0);

  return totalTime / resolvedAlerts.length / (1000 * 60 * 60); // Convert to hours
}

module.exports = router;

