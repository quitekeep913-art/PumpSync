-- 1. Users Table (each role login here)
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'attendant', 'manager', 'driver', 'inspector')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pumps Table (Owners table)
CREATE TABLE Pumps (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100),
    tolerance_amount DECIMAL(10,2) DEFAULT 50.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fleet Companies (Transport companies record)
CREATE TABLE Fleet_Companies (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);