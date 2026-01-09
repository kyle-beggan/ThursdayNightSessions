-- Variable declaration isn't straightforward in plain SQL script execution via Dashboard usually.
-- Using a DO block for logic.

DO $$
DECLARE
    session_curr RECORD;
    user_curr RECORD;
    capability_curr RECORD;
    new_commitment_id UUID;
    should_attend BOOLEAN;
    num_capabilities INT;
    caps_added INT;
BEGIN
    -- Loop through ALL sessions
    FOR session_curr IN SELECT id FROM sessions LOOP
        
        -- Loop through ALL users
        FOR user_curr IN SELECT id FROM users WHERE status = 'approved' LOOP
            
            -- 60% chance for a user to attend a session
            should_attend := (random() < 0.6);
            
            IF should_attend THEN
                
                -- Check if commitment already exists to avoid duplicates if re-ran (though this is for fake data)
                -- We'll just try insert and ignore conflicts if unique constraint existed, 
                -- or just check first.
                IF NOT EXISTS (SELECT 1 FROM session_commitments WHERE session_id = session_curr.id AND user_id = user_curr.id) THEN
                    
                    INSERT INTO session_commitments (session_id, user_id)
                    VALUES (session_curr.id, user_curr.id)
                    RETURNING id INTO new_commitment_id;
                    
                    -- Assign 1 to 3 random capabilities
                    num_capabilities := floor(random() * 3 + 1)::int;
                    caps_added := 0;
                    
                    FOR capability_curr IN SELECT id FROM capabilities ORDER BY random() LOOP
                        IF caps_added < num_capabilities THEN
                            INSERT INTO session_commitment_capabilities (session_commitment_id, capability_id)
                            VALUES (new_commitment_id, capability_curr.id);
                            caps_added := caps_added + 1;
                        ELSE
                            EXIT;
                        END IF;
                    END LOOP;
                    
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;
