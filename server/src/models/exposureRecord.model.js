'use strict';

/**
 * models/exposureRecord.model.js — Mongoose schema for logged exposure sessions.
 *
 * LIMITATIONS (Phase 4):
 *   - Authentication and user identity are NOT implemented in this phase.
 *   - Records are not associated with a specific user; all records are
 *     anonymous session logs.
 *   - The GET /api/exposure/history endpoint returns records in reverse
 *     chronological order. Without user identity, it will return all records
 *     or an empty array — not personalised history.
 *   - Seeded or fabricated records are never returned as real user history.
 */

const mongoose = require('mongoose');

const ExposureRecordSchema = new mongoose.Schema(
  {
    activity: {
      type: String,
      required: [true, 'Activity ID is required.'],
    },
    activityLabel: {
      type: String,
      default: '',
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required.'],
      min: [1, 'Duration must be at least 1 minute.'],
      max: [720, 'Duration must not exceed 720 minutes.'],
    },
    aqi: {
      type: Number,
      required: [true, 'AQI is required.'],
      min: 0,
    },
    pm25: {
      type: Number,
      default: null,
    },
    exposureScore: {
      type: Number,
      required: [true, 'Exposure score is required.'],
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'VERY HIGH'],
      required: [true, 'Risk level is required.'],
    },
    location: {
      name: { type: String, default: null },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      country: { type: String, default: null },
    },
    dataSource: {
      type: String,
      enum: ['explicit-override', 'live-openweather'],
      default: 'explicit-override',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    collection: 'exposure_records',
  }
);

// Index for chronological retrieval
ExposureRecordSchema.index({ createdAt: -1 });

const ExposureRecord = mongoose.model('ExposureRecord', ExposureRecordSchema);

module.exports = ExposureRecord;
