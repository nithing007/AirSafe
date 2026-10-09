# AirSafe API Contract

The API contract defines the initial endpoints shared between the frontend and backend teams.

## Initial Endpoints

| Method | Endpoint                         | Purpose                              |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/health`                    | Check server health                  |
| GET    | `/api/air/current`               | Retrieve current air quality         |
| GET    | `/api/air/forecast`              | Retrieve air quality forecast        |
| POST   | `/api/exposure/calculate`        | Calculate estimated exposure         |
| GET    | `/api/exposure/history`          | Retrieve exposure history            |
| GET    | `/api/recommendations/current`   | Retrieve recommendations             |
| GET    | `/api/recommendations/best-time` | Find a potentially safer time window |
| POST   | `/api/routes/compare`            | Compare route exposure estimates     |

## Exposure Calculation Request

```json
{
  "activity": "running",
  "duration": 60,
  "latitude": 11.0168,
  "longitude": 76.9558
}
```

## Notes

- Duration is measured in minutes.
- Latitude and longitude are decimal coordinates.
- Exposure scores are estimates, not medical measurements.
- The backend team should communicate API changes to the frontend team before implementation.
