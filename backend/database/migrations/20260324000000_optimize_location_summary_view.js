/**
 * Convert location_summary from a regular VIEW to a MATERIALIZED VIEW.
 *
 * Problem: The regular view scans 749K+ water_quality_readings rows on every
 * request, taking ~3.8s on warm cache and timing out on cold cache.
 *
 * Fix: Materialized view pre-computes the aggregation once. Queries read
 * from the materialized data (~7ms). Data is refreshed on demand via
 * REFRESH MATERIALIZED VIEW CONCURRENTLY.
 */
exports.up = function (knex) {
  return knex.raw(`
    DROP VIEW IF EXISTS location_summary;

    CREATE MATERIALIZED VIEW location_summary AS
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
    ) a ON a.location_id = l.id;

    -- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY
    CREATE UNIQUE INDEX idx_location_summary_id ON location_summary(id);

    -- Indexes for common queries
    CREATE INDEX idx_location_summary_state ON location_summary(state);
    CREATE INDEX idx_location_summary_name ON location_summary(name);
    CREATE INDEX idx_location_summary_risk ON location_summary(risk_level);

    -- Speed up future refreshes (COUNT(DISTINCT parameter_id))
    CREATE INDEX IF NOT EXISTS idx_readings_location_param
        ON water_quality_readings(location_id, parameter_id);
  `);
};

exports.down = function (knex) {
  return knex.raw(`
    DROP MATERIALIZED VIEW IF EXISTS location_summary;
    DROP INDEX IF EXISTS idx_readings_location_param;

    CREATE VIEW location_summary AS
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
