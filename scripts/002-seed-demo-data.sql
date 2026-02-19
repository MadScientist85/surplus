-- HBU Recovery - Demo Data Seed Script
-- This creates sample data for testing the dashboard

-- Insert a demo user (you'll want to replace this with real Clerk user ID)
INSERT INTO "User" ("id", "email", "name", "imageUrl", "createdAt", "updatedAt")
VALUES 
    ('demo_user_001', 'demo@hbu.recovery', 'Demo Commander', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Insert default settings for demo user
INSERT INTO "UserSettings" ("id", "userId", "emailNotifications", "smsNotifications", "theme", "timezone", "defaultState")
VALUES 
    ('settings_demo_001', 'demo_user_001', true, false, 'dark', 'America/Chicago', 'OK')
ON CONFLICT ("userId") DO NOTHING;

-- Insert a demo team
INSERT INTO "Team" ("id", "name", "slug", "description", "ownerId", "plan", "monthlyLeadLimit")
VALUES 
    ('team_demo_001', 'Demo Recovery Team', 'demo-team', 'Sample team for testing HBU Recovery features', 'demo_user_001', 'professional', 1000)
ON CONFLICT ("id") DO NOTHING;

-- Add demo user as team owner
INSERT INTO "TeamMember" ("id", "teamId", "userId", "role", "joinedAt")
VALUES 
    ('member_demo_001', 'team_demo_001', 'demo_user_001', 'owner', CURRENT_TIMESTAMP)
ON CONFLICT ("teamId", "userId") DO NOTHING;

-- Insert sample activity logs
INSERT INTO "ActivityLog" ("id", "userId", "action", "resource", "metadata", "createdAt")
VALUES 
    ('activity_001', 'demo_user_001', 'login', 'user', '{"method": "clerk"}', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    ('activity_002', 'demo_user_001', 'settings_updated', 'user_settings', '{"theme": "dark"}', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('activity_003', 'demo_user_001', 'team_created', 'team', '{"name": "Demo Recovery Team"}', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('activity_004', 'demo_user_001', 'api_key_created', 'api_key', '{"name": "Production Key"}', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('activity_005', 'demo_user_001', 'lead_created', 'lead', '{"state": "OK", "amount": 28500}', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT ("id") DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Demo data seeded successfully!';
END $$;
