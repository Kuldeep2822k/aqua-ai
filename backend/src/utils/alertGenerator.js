/**
 * Alert Generator Utility
 * Automatically generates and manages water quality alerts based on readings.
 */

const { db, closeConnection } = require('../db/connection');
const logger = require('./logger');

/**
 * Generate and manage alerts based on latest water quality readings
 */
async function generateAlerts() {
  logger.info('🔔 Starting alert generation process...');

  try {
    // 1. Get the absolute latest reading for each location and parameter
    // based on measurement_date. This handles historical data correctly.
    const latestReadings = await db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
      .whereIn(
        ['wqr.location_id', 'wqr.parameter_id', 'wqr.measurement_date'],
        db('water_quality_readings')
          .select('location_id', 'parameter_id')
          .max('measurement_date')
          .groupBy('location_id', 'parameter_id')
      )
      .select(
        'wqr.id as reading_id',
        'wqr.location_id',
        'wqr.parameter_id',
        'wqr.value as actual_value',
        'wqr.risk_level',
        'wqr.measurement_date',
        'l.name as location_name',
        'wqp.parameter_name',
        'wqp.unit',
        'wqp.safe_limit',
        'wqp.moderate_limit',
        'wqp.high_limit',
        'wqp.critical_limit'
      );

    logger.info(
      `Evaluating ${latestReadings.length} absolute latest readings for alert state.`
    );

    // Fetch all active alerts once to avoid N+1 query issue
    const activeAlertsList = await db('alerts').where('status', 'active');
    const activeAlertsMap = new Map();
    for (const alert of activeAlertsList) {
      const key = `${alert.location_id}-${alert.parameter_id}`;
      activeAlertsMap.set(key, alert);
    }

    let createdCount = 0;
    let resolvedCount = 0;
    let highRiskCount = 0;

    for (const reading of latestReadings) {
      const {
        location_id,
        parameter_id,
        actual_value,
        risk_level,
        location_name,
        parameter_name,
        unit,
      } = reading;

      // Skip if risk level is missing (trigger might not have run)
      if (!risk_level) {
        logger.debug(
          `Skipping reading ${reading.reading_id} at ${location_name}: No risk level calculated.`
        );
        continue;
      }

      if (risk_level !== 'low') highRiskCount++;

      // Determine threshold value based on risk level
      let threshold_value = reading.safe_limit;
      if (risk_level === 'critical') threshold_value = reading.critical_limit;
      else if (risk_level === 'high') threshold_value = reading.high_limit;
      else if (risk_level === 'medium')
        threshold_value = reading.moderate_limit;

      // Check for an existing active alert for this location and parameter
      const activeAlert = activeAlertsMap.get(`${location_id}-${parameter_id}`);

      if (risk_level !== 'low') {
        // High risk detected - handle alert creation/update
        if (!activeAlert) {
          // Create new alert
          const message = `${parameter_name} at ${location_name} is at ${risk_level} level (${actual_value} ${unit || ''}). Threshold: ${threshold_value}`;

          await db('alerts').insert({
            location_id,
            parameter_id,
            alert_type: 'threshold_exceeded',
            severity: risk_level,
            message,
            threshold_value,
            actual_value,
            status: 'active',
            triggered_at: reading.measurement_date,
            created_at: db.fn.now(),
          });

          logger.info(
            `[ALERT] Created NEW ${risk_level} alert: ${parameter_name} at ${location_name} (${actual_value})`
          );
          createdCount++;
        } else if (activeAlert.severity !== risk_level) {
          // Update existing alert if severity changed (e.g. from medium to high)
          await db('alerts')
            .where('id', activeAlert.id)
            .update({
              severity: risk_level,
              actual_value,
              message: `${parameter_name} at ${location_name} escalated to ${risk_level} level (${actual_value}). Threshold: ${threshold_value}`,
            });
          logger.info(
            `[ALERT] Updated alert severity: ${parameter_name} at ${location_name} -> ${risk_level}`
          );
        }
      } else {
        // Risk level is low - check if we need to resolve an existing alert
        // This only happens if the *absolute latest* reading is now safe.
        if (activeAlert) {
          await db('alerts').where('id', activeAlert.id).update({
            status: 'resolved',
            resolved_at: db.fn.now(),
            actual_value,
          });

          logger.info(
            `[RESOLVED] Alert for ${parameter_name} at ${location_name} resolved as latest data is safe.`
          );
          resolvedCount++;
        }
      }
    }

    logger.info(`Alert cycle summary:
- Absolute Latest States Evaluated: ${latestReadings.length}
- Locations Currently at Risk: ${highRiskCount}
- New Alerts Created: ${createdCount}
- Alerts Automatically Resolved: ${resolvedCount}`);

    logger.info('Alert generation process complete.');
  } catch (error) {
    logger.error('Error in alert generation process:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    let exitCode = 0;
    try {
      await generateAlerts();
      logger.info('✅ Alert generator finished successfully');
    } catch (error) {
      logger.error('❌ Alert generator failed:', error);
      exitCode = 1;
    } finally {
      await closeConnection();
      process.exit(exitCode);
    }
  })();
}

module.exports = { generateAlerts };
