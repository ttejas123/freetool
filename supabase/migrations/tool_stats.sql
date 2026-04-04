-- Migration: Create tool_stats and tracking tables
-- Run this in your Supabase SQL Editor

-- 1. Create the main stats table
CREATE TABLE IF NOT EXISTS tool_stats (
    id TEXT PRIMARY KEY, -- Tool ID (e.g., 'json-formatter')
    views BIGINT DEFAULT 0,
    upvotes BIGINT DEFAULT 0,
    unique_users BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the unique visitor tracking table
CREATE TABLE IF NOT EXISTS tool_unique_visitors (
    tool_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (tool_id, user_id)
);

-- Enable RLS
ALTER TABLE tool_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_unique_visitors ENABLE ROW LEVEL SECURITY;

-- Allow public read for stats
CREATE POLICY "Allow public read for tool_stats" ON tool_stats FOR SELECT USING (true);

-- Allow public write for stats (Note: In production, limit this to authenticated or via RPC)
CREATE POLICY "Allow public select tool_unique_visitors" ON tool_unique_visitors FOR SELECT USING (true);

-- 3. Create a function to atomically increment stats
-- This handles view/upvote and unique user tracking in one go
CREATE OR REPLACE FUNCTION record_tool_action(
    p_tool_id TEXT,
    p_action TEXT, -- 'view' or 'upvote'
    p_user_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    is_new_user BOOLEAN := FALSE;
BEGIN
    -- Initialize the tool row if it doesn't exist
    INSERT INTO tool_stats (id, views, upvotes, unique_users)
    VALUES (p_tool_id, 0, 0, 0)
    ON CONFLICT (id) DO NOTHING;

    -- Track unique user if provided
    IF p_user_id IS NOT NULL THEN
        INSERT INTO tool_unique_visitors (tool_id, user_id)
        VALUES (p_tool_id, p_user_id)
        ON CONFLICT (tool_id, user_id) DO NOTHING;
        
        -- If the insert happened (didn't conflict), it's a new user
        IF FOUND THEN
            is_new_user := TRUE;
        END IF;
    END IF;

    -- Update the stats
    UPDATE tool_stats
    SET 
        views = CASE WHEN p_action = 'view' THEN views + 1 ELSE views END,
        upvotes = CASE WHEN p_action = 'upvote' THEN upvotes + 1 ELSE upvotes END,
        unique_users = unique_users + (CASE WHEN is_new_user THEN 1 ELSE 0 END),
        updated_at = NOW()
    WHERE id = p_tool_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
