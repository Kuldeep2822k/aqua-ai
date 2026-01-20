import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Button, ButtonGroup } from '@mui/material';
import { usePerformanceOptimizer } from '../hooks/usePerformanceOptimizer';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface SimpleMapProps {
  height?: string | number;
}

// Comprehensive water quality data - All parameters for each state
const sampleData = [
  // UTTAR PRADESH - 12 locations (all parameters)
  {
    id: 1,
    name: 'Ganga at Varanasi - BOD',
    lat: 25.3176,
    lng: 82.9739,
    risk: 'high',
    value: 'BOD: 8.5 mg/L',
    state: 'Uttar Pradesh',
  },
  {
    id: 2,
    name: 'Ganga at Varanasi - TDS',
    lat: 25.3196,
    lng: 82.9759,
    risk: 'medium',
    value: 'TDS: 450 mg/L',
    state: 'Uttar Pradesh',
  },
  {
    id: 3,
    name: 'Ganga at Kanpur - BOD',
    lat: 26.4499,
    lng: 80.3319,
    risk: 'critical',
    value: 'BOD: 18.3 mg/L',
    state: 'Uttar Pradesh',
  },
  {
    id: 4,
    name: 'Yamuna at Agra - pH',
    lat: 27.1767,
    lng: 78.0081,
    risk: 'medium',
    value: 'pH: 8.2',
    state: 'Uttar Pradesh',
  },
  {
    id: 5,
    name: 'Ganga at Allahabad - DO',
    lat: 25.4358,
    lng: 81.8463,
    risk: 'high',
    value: 'DO: 2.1 mg/L',
    state: 'Uttar Pradesh',
  },
  {
    id: 6,
    name: 'Yamuna at Mathura - Heavy Metals',
    lat: 27.4924,
    lng: 77.6737,
    risk: 'high',
    value: 'Lead: 0.8 mg/L',
    state: 'Uttar Pradesh',
  },
  {
    id: 7,
    name: 'Ganga at Lucknow - Coliform',
    lat: 26.8467,
    lng: 80.9462,
    risk: 'critical',
    value: 'Coliform: 1800/100ml',
    state: 'Uttar Pradesh',
  },
  {
    id: 8,
    name: 'Rapti at Gorakhpur - Nitrates',
    lat: 26.7606,
    lng: 83.3732,
    risk: 'medium',
    value: 'Nitrates: 42 mg/L',
    state: 'Uttar Pradesh',
  },
  {
    id: 9,
    name: 'Gomti at Lucknow - Turbidity',
    lat: 26.8389,
    lng: 80.9234,
    risk: 'high',
    value: 'Turbidity: 68 NTU',
    state: 'Uttar Pradesh',
  },
  {
    id: 10,
    name: 'Yamuna at Noida - Industrial',
    lat: 28.5355,
    lng: 77.391,
    risk: 'critical',
    value: 'Industrial Pollutants: High',
    state: 'Uttar Pradesh',
  },
  {
    id: 11,
    name: 'Hindon at Ghaziabad - Salinity',
    lat: 28.6692,
    lng: 77.4538,
    risk: 'medium',
    value: 'Salinity: 850 mg/L',
    state: 'Uttar Pradesh',
  },
  {
    id: 12,
    name: 'Ganga at Mirzapur - Pesticides',
    lat: 25.146,
    lng: 82.569,
    risk: 'medium',
    value: 'Pesticides: 0.09 mg/L',
    state: 'Uttar Pradesh',
  },

  // DELHI - 12 locations (all parameters)
  {
    id: 13,
    name: 'Yamuna at ITO - BOD',
    lat: 28.6139,
    lng: 77.209,
    risk: 'critical',
    value: 'BOD: 15.2 mg/L',
    state: 'Delhi',
  },
  {
    id: 14,
    name: 'Yamuna at Wazirabad - TDS',
    lat: 28.7041,
    lng: 77.2025,
    risk: 'high',
    value: 'TDS: 650 mg/L',
    state: 'Delhi',
  },
  {
    id: 15,
    name: 'Najafgarh Drain - pH',
    lat: 28.6219,
    lng: 77.0389,
    risk: 'critical',
    value: 'pH: 9.2',
    state: 'Delhi',
  },
  {
    id: 16,
    name: 'Yamuna at Okhla - DO',
    lat: 28.5355,
    lng: 77.3151,
    risk: 'critical',
    value: 'DO: 0.8 mg/L',
    state: 'Delhi',
  },
  {
    id: 17,
    name: 'Delhi Gate Drain - Heavy Metals',
    lat: 28.6448,
    lng: 77.2435,
    risk: 'critical',
    value: 'Mercury: 2.8 mg/L',
    state: 'Delhi',
  },
  {
    id: 18,
    name: 'Shahdara Drain - Coliform',
    lat: 28.6692,
    lng: 77.2897,
    risk: 'critical',
    value: 'Coliform: 5600/100ml',
    state: 'Delhi',
  },
  {
    id: 19,
    name: 'Yamuna at Nizamuddin - Ammonia',
    lat: 28.5933,
    lng: 77.2507,
    risk: 'critical',
    value: 'Ammonia: 45 mg/L',
    state: 'Delhi',
  },
  {
    id: 20,
    name: 'Barapullah Drain - Turbidity',
    lat: 28.5719,
    lng: 77.2581,
    risk: 'critical',
    value: 'Turbidity: 95 NTU',
    state: 'Delhi',
  },
  {
    id: 21,
    name: 'Yamuna at Palla - Industrial',
    lat: 28.7749,
    lng: 77.1234,
    risk: 'critical',
    value: 'Industrial Pollutants: Critical',
    state: 'Delhi',
  },
  {
    id: 22,
    name: 'Supplementary Drain - Salinity',
    lat: 28.628,
    lng: 77.3028,
    risk: 'high',
    value: 'Salinity: 1200 mg/L',
    state: 'Delhi',
  },
  {
    id: 23,
    name: 'Kushak Drain - Fluoride',
    lat: 28.6517,
    lng: 77.0648,
    risk: 'medium',
    value: 'Fluoride: 2.1 mg/L',
    state: 'Delhi',
  },
  {
    id: 24,
    name: 'Trans Yamuna - Pesticides',
    lat: 28.6861,
    lng: 77.2717,
    risk: 'high',
    value: 'Pesticides: 0.18 mg/L',
    state: 'Delhi',
  },

  // MAHARASHTRA - 12 locations (all parameters)
  {
    id: 25,
    name: 'Godavari at Nashik - BOD',
    lat: 19.9975,
    lng: 73.7898,
    risk: 'medium',
    value: 'BOD: 4.8 mg/L',
    state: 'Maharashtra',
  },
  {
    id: 26,
    name: 'Mumbai Coastal - TDS',
    lat: 19.076,
    lng: 72.8777,
    risk: 'medium',
    value: 'TDS: 480 mg/L',
    state: 'Maharashtra',
  },
  {
    id: 27,
    name: 'Tapi at Surat - pH',
    lat: 21.1959,
    lng: 72.8302,
    risk: 'medium',
    value: 'pH: 7.8',
    state: 'Maharashtra',
  },
  {
    id: 28,
    name: 'Krishna at Sangli - DO',
    lat: 16.8524,
    lng: 74.5815,
    risk: 'low',
    value: 'DO: 5.4 mg/L',
    state: 'Maharashtra',
  },
  {
    id: 29,
    name: 'Godavari at Aurangabad - Iron',
    lat: 19.8762,
    lng: 75.3433,
    risk: 'medium',
    value: 'Iron: 1.8 mg/L',
    state: 'Maharashtra',
  },
  {
    id: 30,
    name: 'Mithi River Mumbai - Coliform',
    lat: 19.0896,
    lng: 72.8656,
    risk: 'critical',
    value: 'Coliform: 2400/100ml',
    state: 'Maharashtra',
  },
  {
    id: 31,
    name: 'Bhima at Pune - Nitrates',
    lat: 18.5204,
    lng: 73.8567,
    risk: 'high',
    value: 'Nitrates: 48 mg/L',
    state: 'Maharashtra',
  },
  {
    id: 32,
    name: 'Wardha at Nagpur - Turbidity',
    lat: 21.1458,
    lng: 79.0882,
    risk: 'medium',
    value: 'Turbidity: 42 NTU',
    state: 'Maharashtra',
  },
  {
    id: 33,
    name: 'Ulhas at Kalyan - Industrial',
    lat: 19.2403,
    lng: 73.1305,
    risk: 'high',
    value: 'Industrial Pollutants: High',
    state: 'Maharashtra',
  },
  {
    id: 34,
    name: 'Penganga at Nanded - Salinity',
    lat: 19.1383,
    lng: 77.2975,
    risk: 'medium',
    value: 'Salinity: 620 mg/L',
    state: 'Maharashtra',
  },
  {
    id: 35,
    name: 'Tapti at Jalgaon - Fluoride',
    lat: 21.0077,
    lng: 75.5626,
    risk: 'medium',
    value: 'Fluoride: 1.6 mg/L',
    state: 'Maharashtra',
  },
  {
    id: 36,
    name: 'Godavari at Nandurbar - Pesticides',
    lat: 21.3667,
    lng: 74.2436,
    risk: 'medium',
    value: 'Pesticides: 0.07 mg/L',
    state: 'Maharashtra',
  },

  // GUJARAT - 12 locations (all parameters)
  {
    id: 37,
    name: 'Sabarmati at Ahmedabad - BOD',
    lat: 23.0225,
    lng: 72.5714,
    risk: 'high',
    value: 'BOD: 7.2 mg/L',
    state: 'Gujarat',
  },
  {
    id: 38,
    name: 'Narmada at Bharuch - TDS',
    lat: 21.7051,
    lng: 72.9959,
    risk: 'medium',
    value: 'TDS: 380 mg/L',
    state: 'Gujarat',
  },
  {
    id: 39,
    name: 'Tapi at Surat - pH',
    lat: 21.1702,
    lng: 72.8311,
    risk: 'high',
    value: 'pH: 8.9',
    state: 'Gujarat',
  },
  {
    id: 40,
    name: 'Mahi at Vadodara - DO',
    lat: 22.3072,
    lng: 73.1812,
    risk: 'medium',
    value: 'DO: 4.8 mg/L',
    state: 'Gujarat',
  },
  {
    id: 41,
    name: 'Luni at Rajkot - Heavy Metals',
    lat: 22.3039,
    lng: 70.8022,
    risk: 'medium',
    value: 'Lead: 0.6 mg/L',
    state: 'Gujarat',
  },
  {
    id: 42,
    name: 'Coastal Water Kandla - Coliform',
    lat: 23.0333,
    lng: 70.2167,
    risk: 'medium',
    value: 'Coliform: 1800/100ml',
    state: 'Gujarat',
  },
  {
    id: 43,
    name: 'Banas at Palanpur - Nitrates',
    lat: 24.1712,
    lng: 72.4386,
    risk: 'high',
    value: 'Nitrates: 52 mg/L',
    state: 'Gujarat',
  },
  {
    id: 44,
    name: 'Meshwo at Junagadh - Turbidity',
    lat: 21.5222,
    lng: 70.4579,
    risk: 'medium',
    value: 'Turbidity: 38 NTU',
    state: 'Gujarat',
  },
  {
    id: 45,
    name: 'Vishwamitri at Vadodara - Industrial',
    lat: 22.2738,
    lng: 73.2086,
    risk: 'high',
    value: 'Industrial Pollutants: High',
    state: 'Gujarat',
  },
  {
    id: 46,
    name: 'Little Rann - Salinity',
    lat: 23.7,
    lng: 71.0833,
    risk: 'high',
    value: 'Salinity: 4200 mg/L',
    state: 'Gujarat',
  },
  {
    id: 47,
    name: 'Rupen at Radhanpur - Fluoride',
    lat: 23.8333,
    lng: 71.6,
    risk: 'critical',
    value: 'Fluoride: 2.8 mg/L',
    state: 'Gujarat',
  },
  {
    id: 48,
    name: 'West Banas at Deesa - Pesticides',
    lat: 24.2594,
    lng: 72.1928,
    risk: 'medium',
    value: 'Pesticides: 0.11 mg/L',
    state: 'Gujarat',
  },

  // KARNATAKA - 12 locations (all parameters)
  {
    id: 49,
    name: 'Cauvery at Bangalore - BOD',
    lat: 12.9716,
    lng: 77.5946,
    risk: 'medium',
    value: 'BOD: 5.8 mg/L',
    state: 'Karnataka',
  },
  {
    id: 50,
    name: 'Krishna at Belgaum - TDS',
    lat: 15.8497,
    lng: 74.4977,
    risk: 'medium',
    value: 'TDS: 420 mg/L',
    state: 'Karnataka',
  },
  {
    id: 51,
    name: 'Tungabhadra at Hospet - pH',
    lat: 15.2693,
    lng: 76.3874,
    risk: 'low',
    value: 'pH: 7.4',
    state: 'Karnataka',
  },
  {
    id: 52,
    name: 'Netravati at Mangalore - DO',
    lat: 12.9141,
    lng: 74.856,
    risk: 'low',
    value: 'DO: 6.2 mg/L',
    state: 'Karnataka',
  },
  {
    id: 53,
    name: 'Bhadra at Shimoga - Iron',
    lat: 13.9299,
    lng: 75.5681,
    risk: 'medium',
    value: 'Iron: 2.4 mg/L',
    state: 'Karnataka',
  },
  {
    id: 54,
    name: 'Vrishabhavathi at Bangalore - Coliform',
    lat: 12.9352,
    lng: 77.6245,
    risk: 'critical',
    value: 'Coliform: 3800/100ml',
    state: 'Karnataka',
  },
  {
    id: 55,
    name: 'Hemavati at Hassan - Nitrates',
    lat: 13.0933,
    lng: 76.1,
    risk: 'medium',
    value: 'Nitrates: 35 mg/L',
    state: 'Karnataka',
  },
  {
    id: 56,
    name: 'Kabini at Mysore - Turbidity',
    lat: 12.2958,
    lng: 76.6394,
    risk: 'low',
    value: 'Turbidity: 25 NTU',
    state: 'Karnataka',
  },
  {
    id: 57,
    name: 'Kali at Karwar - Industrial',
    lat: 14.8167,
    lng: 74.1333,
    risk: 'medium',
    value: 'Industrial Pollutants: Medium',
    state: 'Karnataka',
  },
  {
    id: 58,
    name: 'Ghataprabha at Gokak - Salinity',
    lat: 16.1667,
    lng: 74.8333,
    risk: 'medium',
    value: 'Salinity: 580 mg/L',
    state: 'Karnataka',
  },
  {
    id: 59,
    name: 'Sharavathi at Jog Falls - Fluoride',
    lat: 14.2269,
    lng: 74.8175,
    risk: 'low',
    value: 'Fluoride: 0.8 mg/L',
    state: 'Karnataka',
  },
  {
    id: 60,
    name: 'Arkavati at Kanakapura - Pesticides',
    lat: 12.55,
    lng: 77.4167,
    risk: 'low',
    value: 'Pesticides: 0.04 mg/L',
    state: 'Karnataka',
  },

  // WEST BENGAL - 12 locations (all parameters)
  {
    id: 61,
    name: 'Hooghly at Kolkata - BOD',
    lat: 22.5726,
    lng: 88.3639,
    risk: 'critical',
    value: 'BOD: 25.8 mg/L',
    state: 'West Bengal',
  },
  {
    id: 62,
    name: 'Ganga at Malda - TDS',
    lat: 25.0961,
    lng: 88.1435,
    risk: 'medium',
    value: 'TDS: 520 mg/L',
    state: 'West Bengal',
  },
  {
    id: 63,
    name: 'Damodar at Durgapur - pH',
    lat: 23.5204,
    lng: 87.3119,
    risk: 'high',
    value: 'pH: 8.7',
    state: 'West Bengal',
  },
  {
    id: 64,
    name: 'Rupnarayan at Howrah - DO',
    lat: 22.5958,
    lng: 88.2636,
    risk: 'high',
    value: 'DO: 1.8 mg/L',
    state: 'West Bengal',
  },
  {
    id: 65,
    name: 'Mayurakshi at Siuri - Heavy Metals',
    lat: 23.9167,
    lng: 87.5333,
    risk: 'high',
    value: 'Lead: 1.2 mg/L',
    state: 'West Bengal',
  },
  {
    id: 66,
    name: 'Hooghly at Chinsurah - Coliform',
    lat: 22.8833,
    lng: 88.4,
    risk: 'critical',
    value: 'Coliform: 4200/100ml',
    state: 'West Bengal',
  },
  {
    id: 67,
    name: 'Adi Ganga Kolkata - Ammonia',
    lat: 22.5355,
    lng: 88.3803,
    risk: 'critical',
    value: 'Ammonia: 38 mg/L',
    state: 'West Bengal',
  },
  {
    id: 68,
    name: 'Jalangi at Krishnagar - Turbidity',
    lat: 23.4,
    lng: 88.5,
    risk: 'medium',
    value: 'Turbidity: 55 NTU',
    state: 'West Bengal',
  },
  {
    id: 69,
    name: 'Ajay at Katwa - Coal Discharge',
    lat: 23.65,
    lng: 88.1333,
    risk: 'critical',
    value: 'Coal Ash: 180 mg/L',
    state: 'West Bengal',
  },
  {
    id: 70,
    name: 'Ichamati at Basirhat - Salinity',
    lat: 22.6667,
    lng: 88.8833,
    risk: 'medium',
    value: 'Salinity: 780 mg/L',
    state: 'West Bengal',
  },
  {
    id: 71,
    name: 'Bhagirathi at Murshidabad - Fluoride',
    lat: 24.1667,
    lng: 88.2667,
    risk: 'low',
    value: 'Fluoride: 1.2 mg/L',
    state: 'West Bengal',
  },
  {
    id: 72,
    name: 'Teesta at Jalpaiguri - Arsenic',
    lat: 26.55,
    lng: 88.7167,
    risk: 'high',
    value: 'Arsenic: 0.08 mg/L',
    state: 'West Bengal',
  },
];

const SimpleMap: React.FC<SimpleMapProps> = ({ height = '400px' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Critical');
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Use performance optimizer hook
  const { batchDOMReads, batchDOMWrites, createDebouncedResizeHandler } =
    usePerformanceOptimizer();

  // Parameter categories - each shows 3-4 key parameters per state
  const parameterCategories = {
    Critical: ['BOD', 'Heavy Metals', 'Industrial', 'Coliform'],
    Basic: ['pH', 'DO', 'TDS', 'Turbidity'],
    Chemical: ['Nitrates', 'Ammonia', 'Fluoride', 'Pesticides'],
    Environmental: ['Arsenic', 'Salinity', 'Coal', 'Iron'],
  };

  // Memoized filter function to prevent unnecessary recalculations
  const getFilteredData = useCallback(() => {
    const categoryParams =
      parameterCategories[selectedCategory as keyof typeof parameterCategories];
    return sampleData.filter((location) => {
      return categoryParams.some((param) => {
        const locationValue = location.value.toLowerCase();
        const locationName = location.name.toLowerCase();
        return (
          locationValue.includes(param.toLowerCase()) ||
          locationName.includes(param.toLowerCase()) ||
          (param === 'Heavy Metals' &&
            (locationValue.includes('lead') ||
              locationValue.includes('mercury') ||
              locationValue.includes('iron'))) ||
          (param === 'Industrial' &&
            (locationValue.includes('industrial') ||
              locationValue.includes('pollutant'))) ||
          (param === 'Coal' &&
            (locationValue.includes('coal') || locationName.includes('coal')))
        );
      });
    });
  }, [selectedCategory]);

  // Optimized marker management
  const clearMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      batchDOMWrites([
        () => {
          markersRef.current.forEach((marker) => {
            if (mapInstance.current) {
              mapInstance.current.removeLayer(marker);
            }
          });
          markersRef.current = [];
        },
      ]);
    }
  }, [batchDOMWrites]);

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      case 'high':
        return '#e74c3c';
      case 'critical':
        return '#8e44ad';
      default:
        return '#95a5a6';
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers first
    clearMarkers();

    try {
      // Initialize map if not already created
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          center: [23.5937, 78.9629], // Center of India (slightly adjusted)
          zoom: 5,
          minZoom: 4,
          maxZoom: 12,
          zoomControl: true,
          // Restrict panning to India region
          maxBounds: [
            [6.0, 68.0], // Southwest corner (southernmost and westernmost points of India)
            [37.0, 98.0], // Northeast corner (northernmost and easternmost points of India)
          ],
          maxBoundsViscosity: 0.8, // Makes it harder to pan outside bounds
          preferCanvas: true, // Use canvas for better performance
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapInstance.current);
      }

      // Batch marker creation for better performance
      const filteredData = getFilteredData();

      batchDOMWrites([
        () => {
          filteredData.forEach((location) => {
            const color = getRiskColor(location.risk);

            const marker = L.circleMarker([location.lat, location.lng], {
              color: color,
              fillColor: color,
              fillOpacity: 0.7,
              radius: 10,
              weight: 2,
            });

            const popupContent = `
              <div style="font-family: Arial, sans-serif; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px; font-weight: bold;">${location.name}</h3>
                <p style="margin: 0 0 8px 0; color: #7f8c8d; font-size: 13px;">
                  <strong>📍 ${location.state}</strong>
                </p>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 14px; font-weight: bold; color: #34495e;">${location.value}</span>
                </div>
                <span style="
                  background: ${color}; 
                  color: white; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
                  font-size: 12px;
                  text-transform: capitalize;
                  font-weight: bold;
                  display: inline-block;
                ">
                  🚨 ${location.risk} Risk
                </span>
              </div>
            `;

            marker.bindPopup(popupContent);
            if (mapInstance.current) {
              marker.addTo(mapInstance.current);
              markersRef.current.push(marker);
            }
          });
        },
      ]);

      // Use requestAnimationFrame to prevent forced reflows
      requestAnimationFrame(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize({ animate: false });
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Cleanup
    return () => {
      clearMarkers();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [selectedCategory, getFilteredData, clearMarkers, batchDOMWrites]); // Re-render when category selection changes

  return (
    <Box sx={{ position: 'relative', height: height }}>
      {/* Parameter Category Selection */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'white',
          padding: 1,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
        }}
      >
        <Typography
          variant="caption"
          sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}
        >
          Select Parameter Category:
        </Typography>
        <ButtonGroup size="small" variant="contained">
          {Object.keys(parameterCategories).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory(category)}
              sx={{ fontSize: '10px', minWidth: '60px' }}
            >
              {category}
            </Button>
          ))}
        </ButtonGroup>
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 1, fontSize: '9px' }}
        >
          Showing:{' '}
          {parameterCategories[
            selectedCategory as keyof typeof parameterCategories
          ].join(', ')}
        </Typography>
      </Box>

      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          contain: 'layout style paint',
          willChange: 'auto',
        }}
        className="critical-content"
      />

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: 'white',
          padding: 2,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
          minWidth: '120px',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}
        >
          Risk Levels
        </Typography>
        {[
          { level: 'low', color: '#27ae60', label: 'Low' },
          { level: 'medium', color: '#f39c12', label: 'Medium' },
          { level: 'high', color: '#e74c3c', label: 'High' },
          { level: 'critical', color: '#8e44ad', label: 'Critical' },
        ].map(({ level, color, label }) => (
          <Box
            key={level}
            sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: color,
                mr: 1,
              }}
            />
            <Typography variant="caption">{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Data count */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'white',
          padding: 1,
          borderRadius: 1,
          boxShadow: 1,
          zIndex: 1000,
        }}
      >
        <Typography variant="caption">
          {getFilteredData().length} locations ({selectedCategory})
        </Typography>
      </Box>
    </Box>
  );
};

export default SimpleMap;
