/**
 * Optimize location_summary view for performance.
 *
 * Problem: The existing view uses correlated subqueries (3 separate queries
 * per row in the locations table), causing statement timeouts on Supabase.
 *
 * Fix: Rewrite using LEFT JOINs with pre-aggregated subqueries so each
 * underlying table is scanned once. Also adds missing water_body_type column.
 */
exports.up = function (knex) {
  return knex.raw(`
    DROP VIEW IF EXISTS location_summary;

    CREATE VIEW location_summary AS
    SELECT
        l.id,
        l.name,
        l.state,
        l.district,
        l.latitude,
        l.longitude,
        l.water_body_type,
        COALESCE(r.parameters_monitored, 0)::bigint AS parameters_monitored,
        r.last_reading,
        w.avg_wqi_score,
        COALESCE(a.active_alerts, 0)::bigint AS active_alerts,
        CASE
            WHEN w.avg_wqi_score IS NULL THEN NULL
            WHEN w.avg_wqi_score >= 80 THEN 'safe'
            WHEN w.avg_wqi_score >= 50 THEN 'moderate'
            WHEN w.avg_wqi_score >= 25 THEN 'poor'
            ELSE 'critical'
        END AS risk_level
    FROM locations l
    LEFT JOIN (
        SELECT
            location_id,
            COUNT(DISTINCT parameter_id) AS parameters_monitored,
            MAX(measurement_date) AS last_reading
        FROM water_quality_readings
        GROUP BY location_id
    ) r ON r.location_id = l.id
    LEFT JOIN (
        SELECT
            location_id,
            AVG(wqi_score) AS avg_wqi_score
        FROM water_quality_index
        GROUP BY location_id
    ) w ON w.location_id = l.id
    LEFT JOIN (
        SELECT
            location_id,
            COUNT(*) AS active_alerts
        FROM alerts
        WHERE status = 'active'
        GROUP BY location_id
    ) a ON a.location_id = l.id
  `);
};

exports.down = function (knex) {
  // Revert to the correlated subquery version
  return knex.raw(`
    CREATE OR REPLACE VIEW location_summary AS
    SELECT
        l.id,
        l.name,
        l.state,
        l.district,
        l.latitude,
        l.longitude,
        (
          SELECT COUNT(DISTINCT wqr.parameter_id)
          FROM water_quality_readings wqr
          WHERE wqr.location_id = l.id
        ) as parameters_monitored,
        (
          SELECT MAX(wqr.measurement_date)
          FROM water_quality_readings wqr
          WHERE wqr.location_id = l.id
        ) as last_reading,
        (
          SELECT AVG(wqi.wqi_score)
          FROM water_quality_index wqi
          WHERE wqi.location_id = l.id
        ) as avg_wqi_score,
        (
          SELECT COUNT(*)
          FROM alerts a
          WHERE a.location_id = l.id AND a.status = 'active'
        ) as active_alerts
    FROM locations l
  `);
};
