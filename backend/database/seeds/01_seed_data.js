/* eslint-disable no-console */
/**
 * Seed data for Aqua-AI water quality monitoring
 */

const locationsData = [
  { name: 'Yamuna River - Delhi', state: 'Delhi', district: 'Central Delhi', latitude: 28.6139, longitude: 77.209, water_body_type: 'river' },
  { name: 'Ganges River - Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', latitude: 25.3176, longitude: 82.9739, water_body_type: 'river' },
  { name: 'Hussain Sagar Lake', state: 'Telangana', district: 'Hyderabad', latitude: 17.4239, longitude: 78.4738, water_body_type: 'lake' },
  { name: 'Mithi River - Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.076, longitude: 72.8777, water_body_type: 'river' },
  { name: 'Cooum River - Chennai', state: 'Tamil Nadu', district: 'Chennai', latitude: 13.0827, longitude: 80.2707, water_body_type: 'river' },
  { name: 'Dal Lake', state: 'Jammu and Kashmir', district: 'Srinagar', latitude: 34.0837, longitude: 74.7973, water_body_type: 'lake' },
  { name: 'Sabarmati River', state: 'Gujarat', district: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, water_body_type: 'river' },
  { name: 'Chilika Lake', state: 'Odisha', district: 'Puri', latitude: 19.7214, longitude: 85.319, water_body_type: 'lake' },
  { name: 'Brahmaputra River', state: 'Assam', district: 'Guwahati', latitude: 26.1445, longitude: 91.7362, water_body_type: 'river' },
  { name: 'Godavari River', state: 'Andhra Pradesh', district: 'Rajahmundry', latitude: 16.9891, longitude: 81.784, water_body_type: 'river' },
  { name: 'Cauvery River - Mysuru', state: 'Karnataka', district: 'Mysuru', latitude: 12.2958, longitude: 76.6394, water_body_type: 'river' },
  { name: 'Vembanad Lake', state: 'Kerala', district: 'Alappuzha', latitude: 9.5937, longitude: 76.3306, water_body_type: 'lake' },
  { name: 'Narmada River', state: 'Madhya Pradesh', district: 'Jabalpur', latitude: 23.1815, longitude: 79.9864, water_body_type: 'river' },
  { name: 'Mahanadi River', state: 'Chhattisgarh', district: 'Raipur', latitude: 21.2514, longitude: 81.6296, water_body_type: 'river' },
  { name: 'Sukhna Lake', state: 'Chandigarh', district: 'Chandigarh', latitude: 30.7426, longitude: 76.8177, water_body_type: 'lake' },
];

const parameterRanges = {
  pH: { min: 6.0, max: 9.0, unit: '' },
  BOD: { min: 1.0, max: 30.0, unit: 'mg/L' },
  DO: { min: 1.0, max: 12.0, unit: 'mg/L' },
  TDS: { min: 100.0, max: 2000.0, unit: 'mg/L' },
  Turbidity: { min: 1.0, max: 100.0, unit: 'NTU' },
  Coliform: { min: 1.0, max: 5000.0, unit: 'MPN/100ml' },
};

const rawAlerts = [
  { location_name: 'Yamuna River - Delhi', parameter_code: 'BOD', alert_type: 'threshold_exceeded', severity: 'critical', message: 'BOD levels extremely high', threshold_value: 10, actual_value: 28.5, status: 'active' },
  { location_name: 'Mithi River - Mumbai', parameter_code: 'Coliform', alert_type: 'threshold_exceeded', severity: 'high', message: 'High coliform count detected', threshold_value: 500, actual_value: 4500, status: 'active' },
  { location_name: 'Cooum River - Chennai', parameter_code: 'DO', alert_type: 'threshold_exceeded', severity: 'medium', message: 'Low dissolved oxygen levels', threshold_value: 4, actual_value: 2.1, status: 'active' },
];

async function clearTables(knex) {
  await knex('alerts').del();
  await knex('water_quality_readings').del();
  await knex('water_quality_index').del();
  await knex('locations').del();
}

async function getParametersMapping(knex) {
  const parameterCodes = Object.keys(parameterRanges);
  const dbParameters = await knex('water_quality_parameters')
    .select('id', 'parameter_code', 'parameter_name')
    .whereIn('parameter_code', parameterCodes);

  const idByCode = new Map();
  for (const p of dbParameters) {
    idByCode.set(p.parameter_code, p.id);
    idByCode.set(p.parameter_name, p.id);
  }
  return idByCode;
}

function generateReadingsForLocation(locationId, parameterIdByCode, { today, days, isSqlite }) {
  const dailyReadings = [];
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const readingDate = new Date(today);
    readingDate.setDate(today.getDate() - dayOffset);

    for (const [code, range] of Object.entries(parameterRanges)) {
      const parameter_id = parameterIdByCode.get(code);
      if (!parameter_id) { continue; }
      
      const value = Math.round((Math.random() * (range.max - range.min) + range.min) * 100) / 100;
      
      const reading = {
        location_id: locationId,
        parameter_id,
        value,
        measurement_date: readingDate.toISOString(),
        source: isSqlite ? 'CPCB' : 'government',
      };
      
      if (isSqlite) {
        reading.quality_score = null;
        reading.risk_level = null;
        reading.is_validated = false;
        reading.validation_notes = null;
      }
      
      dailyReadings.push(reading);
    }
  }
  return dailyReadings;
}

async function insertInBatches(knex, tableName, data, batchSize = 500) {
  for (let i = 0; i < data.length; i += batchSize) {
    await knex(tableName).insert(data.slice(i, i + batchSize));
  }
}

function generateAlerts(locIdByName, parameterIdByCode) {
  const alerts = [];
  for (const alert of rawAlerts) {
    const location_id = locIdByName.get(alert.location_name);
    const parameter_id = parameterIdByCode.get(alert.parameter_code);
    if (!location_id || !parameter_id) { continue; }
    
    alerts.push({
      location_id,
      parameter_id,
      alert_type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      threshold_value: alert.threshold_value,
      actual_value: alert.actual_value,
      status: alert.status,
    });
  }
  return alerts;
}

exports.seed = async function (knex) {
  const client = knex.client.config.client;
  const isSqlite = client === 'sqlite3' || client === 'better-sqlite3';

  await clearTables(knex);
  await knex('locations').insert(locationsData);

  const insertedLocations = await knex('locations').select('id', 'name');
  const locIdByName = new Map(insertedLocations.map((l) => [l.name, l.id]));
  const parameterIdByCode = await getParametersMapping(knex);

  const readings = [];
  const today = new Date();
  
  for (const location of insertedLocations) {
    readings.push(...generateReadingsForLocation(location.id, parameterIdByCode, { today, days: 30, isSqlite }));
  }

  await insertInBatches(knex, 'water_quality_readings', readings, isSqlite ? 100 : 500);

  const alerts = generateAlerts(locIdByName, parameterIdByCode);
  await knex('alerts').insert(alerts);

  console.log(`✅ Seeded ${insertedLocations.length} locations`);
  console.log(`✅ Seeded ${readings.length} water quality readings`);
  console.log(`✅ Seeded ${alerts.length} alerts`);
};
