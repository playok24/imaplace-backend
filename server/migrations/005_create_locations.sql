CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_locations_user ON user_locations (user_id);
CREATE INDEX idx_user_locations_time ON user_locations (captured_at DESC);

-- Función haversine para calcular distancia entre puntos en metros
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION = 6371000; -- Radio de la Tierra en metros
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)^2;
  c := 2 * asin(sqrt(a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Keep only last 100 locations per user
CREATE OR REPLACE FUNCTION cleanup_user_locations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_locations
  WHERE id IN (
    SELECT id FROM user_locations
    WHERE user_id = NEW.user_id
    ORDER BY captured_at DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_user_locations ON user_locations;
CREATE TRIGGER trg_cleanup_user_locations
  AFTER INSERT ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_user_locations();
