CREATE TABLE IF NOT EXISTS tourist_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  photos TEXT[] DEFAULT '{}',
  website TEXT,
  importance VARCHAR(20) DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'must-see')),
  estimated_duration_minutes INTEGER,
  season VARCHAR(20) CHECK (season IN ('all', 'spring', 'summer', 'autumn', 'winter')),
  is_free BOOLEAN DEFAULT TRUE,
  tips TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tourist_points_coords ON tourist_points (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tourist_points_category ON tourist_points (category);
CREATE INDEX IF NOT EXISTS idx_tourist_points_active ON tourist_points (is_active) WHERE is_active = TRUE;
