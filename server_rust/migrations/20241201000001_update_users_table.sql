-- Update users table to match User model
-- Add missing fields and make wallet_address unique and not null

-- First, drop the old unique constraint on username if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;

-- Make wallet_address not null and unique, add missing fields
ALTER TABLE users 
    ALTER COLUMN wallet_address SET NOT NULL,
    ADD CONSTRAINT users_wallet_address_unique UNIQUE (wallet_address),
    ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS total_tokens_created INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_volume_traded DECIMAL(20, 8) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Make username nullable since it can be auto-generated from wallet address
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Create user follows table for social features
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- Create triggers to update follower counts
CREATE OR REPLACE FUNCTION update_user_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for the followed user
        UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        -- Increment following count for the follower
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count for the unfollowed user
        UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
        -- Decrement following count for the unfollower
        UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_user_follow_counts') THEN
        CREATE TRIGGER trigger_update_user_follow_counts
            AFTER INSERT OR DELETE ON user_follows
            FOR EACH ROW
            EXECUTE FUNCTION update_user_follow_counts();
    END IF;
END $$; 