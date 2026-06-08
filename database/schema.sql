-- PostgreSQL database schema for AgroScan Plant Disease Detection System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TREATMENTS TABLE
-- Stores lookup data for crop diseases, their causes, and prevention tips.
CREATE TABLE IF NOT EXISTS treatments (
    disease_key VARCHAR(100) PRIMARY KEY, -- e.g., 'Apple___Apple_scab'
    crop VARCHAR(100) NOT NULL,            -- e.g., 'Apple'
    disease_name VARCHAR(250) NOT NULL,    -- e.g., 'Apple Scab'
    cause TEXT,                            -- Cause description
    prevention_steps TEXT[] NOT NULL,      -- Array of prevention/cure tips
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SCANS TABLE
-- Stores the user leaf scanning history and analysis results.
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    image_path VARCHAR(500) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    predicted_disease VARCHAR(100) REFERENCES treatments(disease_key),
    confidence NUMERIC(5, 2) NOT NULL,     -- Percentage, e.g., 98.45
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatments_crop ON treatments(crop);
