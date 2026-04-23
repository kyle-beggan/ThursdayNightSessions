-- CONSOLIDATED SECURITY MITIGATION MIGRATION
-- Date: 2026-03-20
-- Purpose: Address 22 errors and 2 warnings from Supabase Security Counselor
-- Robust Version 2: Standardized policy names and improved existence checks

-- ==========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==========================================
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- ==========================================
-- 2. REFRESH POLICIES (RESTRICTIVE)
-- ==========================================

-- USERS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP POLICY IF EXISTS "Users can view their own record" ON users;
        CREATE POLICY "Users can view their own record" ON users FOR SELECT USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Admins can view all users" ON users;
        CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));

        DROP POLICY IF EXISTS "Admins can manage users" ON users;
        CREATE POLICY "Admins can manage users" ON users FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- CAPABILITIES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'capabilities') THEN
        DROP POLICY IF EXISTS "Approved users can view capabilities" ON capabilities;
        DROP POLICY IF EXISTS "Authenticated users can view capabilities" ON capabilities;
        CREATE POLICY "Authenticated users can view capabilities" ON capabilities FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage capabilities" ON capabilities;
        CREATE POLICY "Admins can manage capabilities" ON capabilities FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- USER CAPABILITIES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_capabilities') THEN
        DROP POLICY IF EXISTS "Users can view all user capabilities" ON user_capabilities;
        DROP POLICY IF EXISTS "Authenticated users can view user capabilities" ON user_capabilities;
        CREATE POLICY "Authenticated users can view user capabilities" ON user_capabilities FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage user capabilities" ON user_capabilities;
        CREATE POLICY "Admins can manage user capabilities" ON user_capabilities FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- SESSIONS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        DROP POLICY IF EXISTS "Approved users can view sessions" ON sessions;
        DROP POLICY IF EXISTS "Authenticated users can view sessions" ON sessions;
        CREATE POLICY "Authenticated users can view sessions" ON sessions FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage sessions" ON sessions;
        CREATE POLICY "Admins can manage sessions" ON sessions FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- SESSION SONGS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_songs') THEN
        DROP POLICY IF EXISTS "Approved users can view session songs" ON session_songs;
        DROP POLICY IF EXISTS "Authenticated users can view session songs" ON session_songs;
        CREATE POLICY "Authenticated users can view session songs" ON session_songs FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage session songs" ON session_songs;
        CREATE POLICY "Admins can manage session songs" ON session_songs FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- SESSION COMMITMENTS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_commitments') THEN
        DROP POLICY IF EXISTS "Approved users can view commitments" ON session_commitments;
        DROP POLICY IF EXISTS "Authenticated users can view commitments" ON session_commitments;
        CREATE POLICY "Authenticated users can view commitments" ON session_commitments FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage their own commitments" ON session_commitments;
        CREATE POLICY "Users can manage their own commitments" ON session_commitments FOR ALL USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Admins can manage any commitment" ON session_commitments;
        DROP POLICY IF EXISTS "Admins can manage commitments" ON session_commitments;
        CREATE POLICY "Admins can manage commitments" ON session_commitments FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- NOTIFICATIONS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DROP POLICY IF EXISTS "Admins can view and create notifications" ON notifications;
        DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
        CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- SONGS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'songs') THEN
        DROP POLICY IF EXISTS "Everyone can view active songs" ON songs;
        DROP POLICY IF EXISTS "Authenticated users can view songs" ON songs;
        CREATE POLICY "Authenticated users can view songs" ON songs FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Approved users can add songs" ON songs;
        DROP POLICY IF EXISTS "Users can update their own songs" ON songs;
        DROP POLICY IF EXISTS "Users can manage own songs" ON songs;
        CREATE POLICY "Users can manage own songs" ON songs FOR ALL USING (created_by = auth.uid());

        DROP POLICY IF EXISTS "Admins can manage songs" ON songs;
        CREATE POLICY "Admins can manage songs" ON songs FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- FEEDBACK
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
        DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
        DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
        DROP POLICY IF EXISTS "Users can manage own feedback" ON feedback;
        CREATE POLICY "Users can manage own feedback" ON feedback FOR ALL USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
        DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;
        DROP POLICY IF EXISTS "Admins can manage feedback" ON feedback;
        CREATE POLICY "Admins can manage feedback" ON feedback FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- FEEDBACK REPLIES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback_replies') THEN
        DROP POLICY IF EXISTS "Everyone can view replies" ON feedback_replies;
        DROP POLICY IF EXISTS "Authenticated users can view replies" ON feedback_replies;
        CREATE POLICY "Authenticated users can view replies" ON feedback_replies FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage own replies" ON feedback_replies;
        CREATE POLICY "Users can manage own replies" ON feedback_replies FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- FEEDBACK VOTES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback_votes') THEN
        DROP POLICY IF EXISTS "Everyone can view votes" ON feedback_votes;
        DROP POLICY IF EXISTS "Authenticated users can view feedback votes" ON feedback_votes;
        CREATE POLICY "Authenticated users can view feedback votes" ON feedback_votes FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage own feedback votes" ON feedback_votes;
        CREATE POLICY "Users can manage own feedback votes" ON feedback_votes FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- CHAT MESSAGES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        DROP POLICY IF EXISTS "Authenticated users can select chat messages" ON chat_messages;
        CREATE POLICY "Authenticated users can select chat messages" ON chat_messages FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON chat_messages;
        DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;
        CREATE POLICY "Users can manage own messages" ON chat_messages FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- CHAT REACTIONS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_reactions') THEN
        DROP POLICY IF EXISTS "Everyone can view reactions" ON chat_reactions;
        DROP POLICY IF EXISTS "Authenticated users can view reactions" ON chat_reactions;
        CREATE POLICY "Authenticated users can view reactions" ON chat_reactions FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage own reactions" ON chat_reactions;
        CREATE POLICY "Users can manage own reactions" ON chat_reactions FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- CHAT READ RECEIPTS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_read_receipts') THEN
        DROP POLICY IF EXISTS "Users can manage own read receipts" ON chat_read_receipts;
        CREATE POLICY "Users can manage own read receipts" ON chat_read_receipts FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- SONG COMMENTS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'song_comments') THEN
        DROP POLICY IF EXISTS "Everyone can view song comments" ON song_comments;
        DROP POLICY IF EXISTS "Authenticated users can view song comments" ON song_comments;
        CREATE POLICY "Authenticated users can view song comments" ON song_comments FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage own song comments" ON song_comments;
        CREATE POLICY "Users can manage own song comments" ON song_comments FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- SONG VOTES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'song_votes') THEN
        DROP POLICY IF EXISTS "Everyone can view votes" ON song_votes;
        DROP POLICY IF EXISTS "Authenticated users can view song votes" ON song_votes;
        CREATE POLICY "Authenticated users can view song votes" ON song_votes FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage own song votes" ON song_votes;
        CREATE POLICY "Users can manage own song votes" ON song_votes FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- SESSION PHOTOS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_photos') THEN
        DROP POLICY IF EXISTS "Public read access for session photos" ON session_photos;
        DROP POLICY IF EXISTS "Authenticated users can view session photos" ON session_photos;
        CREATE POLICY "Authenticated users can view session photos" ON session_photos FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage own photos" ON session_photos;
        CREATE POLICY "Users can manage own photos" ON session_photos FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- SESSION RECORDINGS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_recordings') THEN
        DROP POLICY IF EXISTS "Public read access" ON session_recordings;
        DROP POLICY IF EXISTS "Authenticated users can view session recordings" ON session_recordings;
        CREATE POLICY "Authenticated users can view session recordings" ON session_recordings FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Users can manage own recordings" ON session_recordings;
        CREATE POLICY "Users can manage own recordings" ON session_recordings FOR ALL USING (auth.uid() = created_by);
    END IF;
END $$;

-- SONG CAPABILITIES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'song_capabilities') THEN
        DROP POLICY IF EXISTS "Public read for song_capabilities" ON song_capabilities;
        DROP POLICY IF EXISTS "Authenticated users can view song capabilities" ON song_capabilities;
        CREATE POLICY "Authenticated users can view song capabilities" ON song_capabilities FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage song capabilities" ON song_capabilities;
        CREATE POLICY "Admins can manage song capabilities" ON song_capabilities FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- SESSION COMMITMENT CAPABILITIES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_commitment_capabilities') THEN
        DROP POLICY IF EXISTS "Approved users can view commitment capabilities" ON session_commitment_capabilities;
        DROP POLICY IF EXISTS "Authenticated users can view commitment capabilities" ON session_commitment_capabilities;
        CREATE POLICY "Authenticated users can view commitment capabilities" ON session_commitment_capabilities FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage commitment capabilities" ON session_commitment_capabilities;
        CREATE POLICY "Admins can manage commitment capabilities" ON session_commitment_capabilities FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- SESSION VISIBILITY
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_visibility') THEN
        DROP POLICY IF EXISTS "Authenticated users can view session visibility" ON session_visibility;
        CREATE POLICY "Authenticated users can view session visibility" ON session_visibility FOR SELECT USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admins can manage session visibility" ON session_visibility;
        CREATE POLICY "Admins can manage session visibility" ON session_visibility FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'));
    END IF;
END $$;

-- ==========================================
-- 3. STORAGE POLICIES
-- ==========================================

-- Standardized storage policies for all buckets
-- Note: 'storage.objects' policies must match the bucket_id

DO $$
DECLARE
    b_id text;
BEGIN
    FOR b_id IN SELECT id FROM storage.buckets LOOP
        -- SELECT
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated select %s" ON storage.objects', b_id);
        EXECUTE format('CREATE POLICY "Allow authenticated select %s" ON storage.objects FOR SELECT USING (bucket_id = %L AND auth.role() = %L)', b_id, b_id, 'authenticated');
        
        -- INSERT
        EXECUTE format('DROP POLICY IF EXISTS "Allow owner insert %s" ON storage.objects', b_id);
        EXECUTE format('CREATE POLICY "Allow owner insert %s" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND auth.role() = %L)', b_id, b_id, 'authenticated');
        
        -- UPDATE/DELETE (Owner only)
        EXECUTE format('DROP POLICY IF EXISTS "Allow owner delete %s" ON storage.objects', b_id);
        EXECUTE format('CREATE POLICY "Allow owner delete %s" ON storage.objects FOR DELETE USING (bucket_id = %L AND auth.uid() = owner)', b_id, b_id);
    END LOOP;
END $$;

-- ==========================================
-- 4. FUNCTION SECURITY (Warnings)
-- ==========================================

-- Fix 'role mutable search_path' for update_updated_at_column
-- This resolves the warning: "Function public.update_updated_at_column has a role mutable search_path"
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
    END IF;
END $$;
