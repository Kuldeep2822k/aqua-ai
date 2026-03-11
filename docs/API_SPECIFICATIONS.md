# Government Water Quality API Specifications

This document outlines the research and documentation of API specifications for official Indian government data sources as required for the Aqua-AI platform integration.

## 1. Data.gov.in (OGD Platform India)

The Open Government Data (OGD) Platform is a major source for historical and near-real-time water quality data.

- **Base URL:** `https://api.data.gov.in/resource/`
- **Authentication:** API Key required (`X-Api-Key` header or `api-key` query parameter).
- **Format:** JSON (preferred), XML, CSV.
- **Resource IDs identified:**
  - `19697d76-442e-4d76-aeae-13f8a17c91e1`: Surface Water Quality (Historical Trends).
- **Key Parameters Mapped:**
  - **BOD:** Biochemical Oxygen Demand (mg/L).
  - **TDS:** Total Dissolved Solids / Conductivity (mg/L).
  - **pH:** Acidity/Alkalinity.
  - **DO:** Dissolved Oxygen (mg/L).
  - **Coliform:** Total/Fecal Coliform (MPN/100ml).
  - **Nitrates:** Nitrate (mg/L).

## 2. Central Pollution Control Board (CPCB)

The CPCB provides real-time monitoring data through its network of stations.

- **Base URL:** `https://cpcb.nic.in/` (Portal), API access often routed through OGD or dedicated dashboards.
- **Integration Strategy:** 
  - Real-time data is often provided via the **Real-time Continuous Water Quality Monitoring System (RT-CWQMS)**.
  - Data structure typically includes: Station Name, State, District, Parameter, Value, Unit, and Last Updated Timestamp.
- **Rate Limit:** 50 requests per minute.

## 3. Ministry of Jal Shakti

Responsible for the development and management of water resources.

- **Base URL:** `https://jal.gov.in/` (Portal), includes the **India-Water Resources Information System (India-WRIS)**.
- **Integration Strategy:**
  - India-WRIS provides comprehensive datasets on river flows and water quality.
  - Data is available for major rivers like Ganga, Yamuna, etc.
- **Rate Limit:** 30 requests per minute.

## 4. Parameter Mapping & Normalization

All incoming data must be normalized to the following internal schema:

| Parameter | Internal Code | Standard Unit | Safe Threshold |
| :--- | :--- | :--- | :--- |
| Biochemical Oxygen Demand | `BOD` | mg/L | 3.0 |
| Total Dissolved Solids | `TDS` | mg/L | 500 |
| pH Level | `pH` | - | 6.5 - 8.5 |
| Dissolved Oxygen | `DO` | mg/L | 6.0 |
| Lead | `Lead` | mg/L | 0.01 |
| Mercury | `Mercury` | mg/L | 0.001 |
| Coliform Count | `Coliform` | MPN/100ml | 2.2 |
| Nitrates | `Nitrates` | mg/L | 45 |

## 5. Implementation Notes

- **Error Handling:** Must handle HTTP 429 (Too Many Requests) and provide exponential backoff.
- **Caching:** Cache API responses for at least 15 minutes to reduce load and stay within rate limits.
- **Geocoding:** Many records only provide station names. A fallback geocoding mechanism using the `locations` table or state-level coordinates is required.
