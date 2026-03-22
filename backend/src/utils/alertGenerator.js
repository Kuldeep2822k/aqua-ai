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
    // 1. Get the latest reading for each location and parameter
    // We use a subquery to find the latest measurement_date per location/parameter
    const latestReadings = await db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
      .whereIn(['wqr.location_id', 'wqr.parameter_id', 'wqr.measurement_date'], 
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
        'wqp.parameter_code',
        'wqp.unit',
        'wqp.safe_limit',
        'wqp.moderate_limit',
        'wqp.high_limit',
        'wqp.critical_limit'
      );

    logger.info(`Processing ${latestReadings.length} latest readings for alert evaluation.`);

    let createdCount = 0;
    let resolvedCount = 0;

    for (const reading of latestReadings) {
      const { 
        location_id, 
        parameter_id, 
        actual_value, 
        risk_level, 
        location_name, 
        parameter_name,
        parameter_code,
        unit
      } = reading;

      // Determine threshold value based on risk level
      let threshold_value = reading.safe_limit;
      if (risk_level === 'critical') threshold_value = reading.critical_limit;
      else if (risk_level === 'high') threshold_value = reading.high_limit;
      else if (risk_level === 'medium') threshold_value = reading.moderate_limit;

      // Check for an existing active alert for this location and parameter
      const activeAlert = await db('alerts')
        .where({
          location_id,
          parameter_id,
          status: 'active'
        })
        .first();

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
            created_at: db.fn.now()
          });

          logger.info(`Created NEW ${risk_level} alert for ${parameter_name} at ${location_name}`);
          createdCount++;
        } else {
          // Alert already active. If the severity or value changed significantly, we could update it.
          // For now, we'll just keep the existing alert active.
          if (activeAlert.severity !== risk_level) {
             await db('alerts')
               .where('id', activeAlert.id)
               .update({
                 severity: risk_level,
                 actual_value,
                 message: `${parameter_name} at ${location_name} escalated to ${risk_level} level (${actual_value}). Threshold: ${threshold_value}`,
                 updated_at: db.fn.now()
               });
             logger.info(`Updated alert severity for ${parameter_name} at ${location_name} to ${risk_level}`);
          }
        }
      } else {
        // Risk level is low - check if we need to resolve an existing alert
        if (activeAlert) {
          await db('alerts')
            .where('id', activeAlert.id)
            .update({
              status: 'resolved',
              resolved_at: db.fn.now(),
              actual_value,
              updated_at: db.fn.now()
            });
          
          logger.info(`RESOLVED alert for ${parameter_name} at ${location_name} as condition improved.`);
          resolvedCount++;
        }
      }
    }

    // 2. Cleanup: Auto-dismiss very old active alerts (e.g., > 7 days)
    const cleanupCount = await db('alerts')
      .where('status', 'active')
      .where('triggered_at', '<', db.raw("NOW() - INTERVAL '7 days'"))
      .update({
        status: 'dismissed',
        dismissal_reason: 'Auto-dismissed due to age (7+ days)',
        updated_at: db.fn.now()
      });

    if (cleanupCount > 0) {
      logger.info(`Auto-dismissed ${cleanupCount} old active alerts.`);
    }

    logger.info(`Alert generation complete. Created: ${createdCount}, Resolved: ${resolvedCount}, Cleaned: ${cleanupCount}`);

  } catch (error) {
    logger.error('Error in alert generation process:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateAlerts()
    .then(() => {
      logger.info('✅ Alert generator finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Alert generator failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await closeConnection();
    });
}

module.exports = { generateAlerts };
