ALTER TABLE businesses ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 5);
ALTER TABLE tourist_points ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 5);

ALTER TABLE notifications ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tourist_point_id UUID REFERENCES tourist_points(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'business' CHECK (entity_type IN ('business', 'tourist_point'));
CREATE INDEX IF NOT EXISTS idx_notifications_tourist_point ON notifications (tourist_point_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications (entity_type);
