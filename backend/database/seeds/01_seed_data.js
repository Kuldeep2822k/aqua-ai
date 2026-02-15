/**
 * Seed data for Aqua-AI water quality monitoring
 */

exports.seed = async function (knex) {
  const client = knex.client.config.client;
  const locations = [
    {
      name: 'Yamuna River - Delhi',
      state: 'Delhi',
      district: 'Central Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      water_body_type: 'river',
    },
    {
      name: 'Ganges River - Varanasi',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      latitude: 25.3176,
      longitude: 82.9739,
      water_body_type: 'river',
    },
    {
      name: 'Hussain Sagar Lake',
      state: 'Telangana',
      district: 'Hyderabad',
      latitude: 17.4239,
      longitude: 78.4738,
      water_body_type: 'lake',
    },
    {
      name: 'Mithi River - Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai',
      latitude: 19.076,
      longitude: 72.8777,
      water_body_type: 'river',
    },
    {
      name: 'Cooum River - Chennai',
      state: 'Tamil Nadu',
      district: 'Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      water_body_type: 'river',
    },
    {
      name: 'Dal Lake',
      state: 'Jammu and Kashmir',
      district: 'Srinagar',
      latitude: 34.0837,
      longitude: 74.7973,
      water_body_type: 'lake',
    },
    {
      name: 'Sabarmati River',
      state: 'Gujarat',
      district: 'Ahmedabad',
      latitude: 23.0225,
      longitude: 72.5714,
      water_body_type: 'river',
    },
    {
      name: 'Chilika Lake',
      state: 'Odisha',
      district: 'Puri',
      latitude: 19.7214,
      longitude: 85.319,
      water_body_type: 'lake',
    },
    {
      name: 'Brahmaputra River',
      state: 'Assam',
      district: 'Guwahati',
      latitude: 26.1445,
      longitude: 91.7362,
      water_body_type: 'river',
    },
    {
      name: 'Godavari River',
      state: 'Andhra Pradesh',
      district: 'Rajahmundry',
      latitude: 16.9891,
      longitude: 81.784,
      water_body_type: 'river',
    },
    {
      name: 'Cauvery River - Mysuru',
      state: 'Karnataka',
      district: 'Mysuru',
      latitude: 12.2958,
      longitude: 76.6394,
      water_body_type: 'river',
    },
    {
      name: 'Vembanad Lake',
      state: 'Kerala',
      district: 'Alappuzha',
      latitude: 9.5937,
      longitude: 76.3306,
      water_body_type: 'lake',
    },
    {
      name: 'Narmada River',
      state: 'Madhya Pradesh',
      district: 'Jabalpur',
      latitude: 23.1815,
      longitude: 79.9864,
      water_body_type: 'river',
    },
    {
      name: 'Mahanadi River',
      state: 'Chhattisgarh',
      district: 'Raipur',
      latitude: 21.2514,
      longitude: 81.6296,
      water_body_type: 'river',
    },
    {
      name: 'Sukhna Lake',
      state: 'Chandigarh',
      district: 'Chandigarh',
      latitude: 30.7426,
      longitude: 76.8177,
      water_body_type: 'lake',
    },
  ];

  if (client !== 'sqlite3' && client !== 'better-sqlite3') {
    await knex('alerts').del();
    await knex('water_quality_readings').del();
    await knex('water_quality_index').del();
    await knex('locations').del();

    await knex('locations').insert(locations);

    const insertedLocations = await knex('locations').select('id', 'name');

    const parameterCodes = ['pH', 'BOD', 'DO', 'TDS', 'Turbidity', 'Coliform'];
    const dbParameters = await knex('water_quality_parameters')
      .select('id', 'parameter_code')
      .whereIn('parameter_code', parameterCodes);
    const parameterIdByCode = new Map(
      dbParameters.map((p) => [p.parameter_code, p.id])
    );

    const parameterRanges = {
      pH: { min: 6.0, max: 9.0 },
      BOD: { min: 1.0, max: 30.0 },
      DO: { min: 1.0, max: 12.0 },
      TDS: { min: 100.0, max: 2000.0 },
      Turbidity: { min: 1.0, max: 100.0 },
      Coliform: { min: 1.0, max: 5000.0 },
    };

    const readings = [];
    const today = new Date();
    for (const location of insertedLocations) {
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const readingDate = new Date(today);
        readingDate.setDate(today.getDate() - dayOffset);
        for (const code of parameterCodes) {
          const parameter_id = parameterIdByCode.get(code);
          if (!parameter_id) continue;
          const range = parameterRanges[code];
          const value =
            Math.round(
              (Math.random() * (range.max - range.min) + range.min) * 100
            ) / 100;
          readings.push({
            location_id: location.id,
            parameter_id,
            value,
            measurement_date: readingDate.toISOString(),
            source: 'government',
          });
        }
      }
    }

    const batchSize = 500;
    for (let i = 0; i < readings.length; i += batchSize) {
      await knex('water_quality_readings').insert(
        readings.slice(i, i + batchSize)
      );
    }

    const locIdByName = new Map(insertedLocations.map((l) => [l.name, l.id]));

    const rawAlerts = [
      {
        location_name: 'Yamuna River - Delhi',
        parameter_code: 'BOD',
        alert_type: 'threshold_exceeded',
        severity: 'critical',
        message: 'BOD levels extremely high',
        threshold_value: 10,
        actual_value: 28.5,
        status: 'active',
      },
      {
        location_name: 'Mithi River - Mumbai',
        parameter_code: 'Coliform',
        alert_type: 'threshold_exceeded',
        severity: 'high',
        message: 'High coliform count detected',
        threshold_value: 500,
        actual_value: 4500,
        status: 'active',
      },
      {
        location_name: 'Cooum River - Chennai',
        parameter_code: 'DO',
        alert_type: 'threshold_exceeded',
        severity: 'medium',
        message: 'Low dissolved oxygen levels',
        threshold_value: 4,
        actual_value: 2.1,
        status: 'active',
      },
    ];

    const alerts = [];
    const droppedAlerts = [];

    for (const alert of rawAlerts) {
      const location_id = locIdByName.get(alert.location_name);
      const parameter_id = parameterIdByCode.get(alert.parameter_code);
      if (!location_id || !parameter_id) {
        const missing = [];
        if (!location_id) missing.push(`location:${alert.location_name}`);
        if (!parameter_id) missing.push(`parameter:${alert.parameter_code}`);
        droppedAlerts.push({ alert, missing });
        continue;
      }
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

    for (const dropped of droppedAlerts) {
      console.warn('Dropping seed alert due to missing references', dropped);
    }

    await knex('alerts').insert(alerts);

    console.log(`✅ Seeded ${insertedLocations.length} locations`);
    console.log(`✅ Seeded ${readings.length} water quality readings`);
    console.log(`✅ Seeded ${alerts.length} alerts`);
    return;
  }

  // Clear existing data
  await knex('alerts').del();
  await knex('water_quality_readings').del();
  await knex('water_quality_index').del();
  await knex('locations').del();

  // Insert locations
  await knex('locations').insert(locations);

  const insertedLocations = await knex('locations').select(
    'id',
    'name',
    'state',
    'district',
    'latitude',
    'longitude'
  );

  const parameters = [
    { name: 'pH', unit: '', min: 6.0, max: 9.0 },
    { name: 'BOD', unit: 'mg/L', min: 1, max: 30 },
    { name: 'DO', unit: 'mg/L', min: 3, max: 12 },
    { name: 'TDS', unit: 'mg/L', min: 100, max: 2000 },
    { name: 'Turbidity', unit: 'NTU', min: 1, max: 100 },
    { name: 'Coliform', unit: 'MPN/100ml', min: 10, max: 5000 },
  ];

  const parameterCodes = parameters.map((param) => param.name);
  const dbParameters = await knex('water_quality_parameters')
    .select('id', 'parameter_code', 'parameter_name')
    .whereIn('parameter_code', parameterCodes);
  const parameterIdByName = new Map();
  for (const param of dbParameters) {
    parameterIdByName.set(param.parameter_code, param.id);
    parameterIdByName.set(param.parameter_name, param.id);
  }
  const locationIdByName = new Map(
    insertedLocations.map((l) => [l.name, l.id])
  );
  const water_quality_readings = 'water_quality_readings';

  const readings = [];
  const today = new Date();

  for (const location of insertedLocations) {
    const location_id = locationIdByName.get(location.name);
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const readingDate = new Date(today);
      readingDate.setDate(today.getDate() - dayOffset);

      for (const param of parameters) {
        const parameter_id = parameterIdByName.get(param.name);
        if (!location_id || !parameter_id) {
          continue;
        }
        const value = (
          Math.random() * (param.max - param.min) +
          param.min
        ).toFixed(2);
        readings.push({
          location_id,
          parameter_id,
          value: parseFloat(value),
          measurement_date: readingDate.toISOString(),
          source: 'CPCB',
          quality_score: null,
          risk_level: null,
          is_validated: false,
          validation_notes: null,
        });
      }
    }
  }

  const batchSize = 100;
  for (let i = 0; i < readings.length; i += batchSize) {
    const batch = readings.slice(i, i + batchSize);
    await knex(water_quality_readings).insert(batch);
  }

  const rawAlerts = [
    {
      location_name: 'Yamuna River - Delhi',
      parameter: 'BOD',
      value: 28.5,
      threshold: 10,
      severity: 'critical',
      message: 'BOD levels extremely high',
      is_resolved: false,
    },
    {
      location_name: 'Mithi River - Mumbai',
      parameter: 'Coliform',
      value: 4500,
      threshold: 500,
      severity: 'high',
      message: 'High coliform count detected',
      is_resolved: false,
    },
    {
      location_name: 'Cooum River - Chennai',
      parameter: 'DO',
      value: 2.1,
      threshold: 4,
      severity: 'medium',
      message: 'Low dissolved oxygen levels',
      is_resolved: false,
    },
  ];

  const alerts = [];
  for (const alert of rawAlerts) {
    const location_id = locationIdByName.get(alert.location_name);
    const parameter_id = parameterIdByName.get(alert.parameter);
    if (!location_id || !parameter_id) {
      continue;
    }
    const status = alert.is_resolved ? 'resolved' : 'active';
    alerts.push({
      location_id,
      parameter_id,
      alert_type: 'threshold_exceeded',
      severity: alert.severity,
      message: alert.message,
      threshold_value: alert.threshold,
      actual_value: alert.value,
      status,
    });
  }

  await knex('alerts').insert(alerts);

  console.log(`✅ Seeded ${insertedLocations.length} locations`);
  console.log(`✅ Seeded ${readings.length} water quality readings`);
  console.log(`✅ Seeded ${alerts.length} alerts`);
};
