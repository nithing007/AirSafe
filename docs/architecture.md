# AirSafe Architecture

## Overview

AirSafe estimates personal outdoor pollution exposure using air quality data, activity type and exposure duration.

## Application Components

- **Client:** React frontend for displaying air quality, exposure scores and recommendations.
- **Server:** Node.js and Express REST API.
- **Database:** MongoDB Atlas for application data and exposure history.
- **External API:** OpenWeather Air Pollution API.
- **Infrastructure:** AWS resources managed using Terraform.
- **CI/CD:** GitHub Actions for automated testing, building and deployment.

## Request Flow

1. The client obtains the user's location and selected activity.
2. The server retrieves air quality data.
3. The exposure service calculates an estimated exposure score.
4. The recommendation service generates actionable guidance.
5. The API returns results to the client.

## Deployment

The frontend will be hosted using S3 and CloudFront. The backend will run in a Docker container on EC2, with MongoDB Atlas as the database.

AWS deployment details may evolve during implementation.
