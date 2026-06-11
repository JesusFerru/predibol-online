-- ============================================================================
-- calculate_ranking()
--
-- PostgreSQL function that replicates the logic in scripts/calculate-ranking.ts.
-- Can be executed manually or scheduled via pg_cron / Supabase Cron.
--
-- Recommended schedule (Bolivia time, UTC-4):
--   SELECT cron.schedule(
--     'calculate-ranking',
--     '0 17,21,0 * * *',   -- 17:00, 21:00, 00:00 UTC-4
--     'SELECT calculate_ranking();'
--   );
--
-- NOTE: This function runs with SECURITY DEFINER so it can read/write
-- all tables regardless of RLS policies.
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_ranking()
RETURNS TABLE (userid uuid, points int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_final_match   RECORD;
    v_third_match   RECORD;
    v_champion      TEXT;
    v_runner_up     TEXT;
    v_third_place   TEXT;
    v_bet           RECORD;
    v_wb            RECORD;
    v_multi_key     TEXT;
    v_base_points   INT;
    v_total         INT;
    v_now           TIMESTAMPTZ;
BEGIN
    v_now := NOW();

    -- Clear previous ranking snapshot (optional — upsert handles it below)
    -- We rebuild from scratch each run to keep it idempotent.

    -- ========================================================================
    -- 1. Temporary table: multi-bet keys (userid, matchid) with >1 bet
    -- ========================================================================
    CREATE TEMP TABLE IF NOT EXISTS _multi_bet_keys (
        key TEXT PRIMARY KEY
    ) ON COMMIT DROP;

    TRUNCATE _multi_bet_keys;

    INSERT INTO _multi_bet_keys (key)
    SELECT u || '::' || m
    FROM (
        SELECT
            mb.userid::TEXT AS u,
            mb.matchid::TEXT AS m,
            COUNT(*) AS cnt
        FROM matchbets mb
        GROUP BY mb.userid, mb.matchid
        HAVING COUNT(*) > 1
    ) sub;

    -- ========================================================================
    -- 2. Temporary table: per-user points accumulator
    -- ========================================================================
    CREATE TEMP TABLE IF NOT EXISTS _user_points (
        uid UUID PRIMARY KEY,
        pts INT NOT NULL DEFAULT 0
    ) ON COMMIT DROP;

    TRUNCATE _user_points;

    -- Seed with all paid users
    INSERT INTO _user_points (uid, pts)
    SELECT u.id, 0
    FROM users u
    WHERE u.haspaidentry = TRUE;

    -- ========================================================================
    -- 3. Match points
    -- ========================================================================
    FOR v_bet IN
        SELECT
            mb.userid,
            mb.matchid,
            mb.betgoalteam1,
            mb.betgoalteam2,
            mr.goal1,
            mr.goal2
        FROM matchbets mb
        JOIN matchresults mr ON mr.matchid = mb.matchid
        WHERE mr.matchstatus = 'FINISHED'
          AND mr.goal1 IS NOT NULL
          AND mr.goal2 IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM _user_points up WHERE up.uid = mb.userid
          )
    LOOP
        -- Exact score (+3)
        IF v_bet.betgoalteam1 = v_bet.goal1
           AND v_bet.betgoalteam2 = v_bet.goal2 THEN
            v_base_points := 3;

        -- Correct outcome (+1) — only if not multi-bet
        ELSIF (
            (v_bet.betgoalteam1 > v_bet.betgoalteam2 AND v_bet.goal1 > v_bet.goal2)
            OR (v_bet.betgoalteam1 < v_bet.betgoalteam2 AND v_bet.goal1 < v_bet.goal2)
            OR (v_bet.betgoalteam1 = v_bet.betgoalteam2 AND v_bet.goal1 = v_bet.goal2)
        ) THEN
            v_multi_key := v_bet.userid::TEXT || '::' || v_bet.matchid::TEXT;

            IF EXISTS (SELECT 1 FROM _multi_bet_keys WHERE key = v_multi_key) THEN
                -- Multi-bet suppression: skip +1
                CONTINUE;
            END IF;

            v_base_points := 1;

        ELSE
            -- Incorrect: 0 points
            CONTINUE;
        END IF;

        UPDATE _user_points
        SET pts = pts + v_base_points
        WHERE uid = v_bet.userid;
    END LOOP;

    -- ========================================================================
    -- 4. Podium points
    -- ========================================================================

    -- Resolve podium from Final (matchId 104)
    SELECT * INTO v_final_match
    FROM matchresults
    WHERE matchid = '104'
      AND matchstatus = 'FINISHED'
      AND goal1 IS NOT NULL
      AND goal2 IS NOT NULL;

    IF FOUND THEN
        IF v_final_match.goal1 > v_final_match.goal2 THEN
            v_champion   := v_final_match.team1;
            v_runner_up  := v_final_match.team2;
        ELSE
            v_champion   := v_final_match.team2;
            v_runner_up  := v_final_match.team1;
        END IF;

        -- Resolve third place from matchId 103
        SELECT * INTO v_third_match
        FROM matchresults
        WHERE matchid = '103'
          AND matchstatus = 'FINISHED'
          AND goal1 IS NOT NULL
          AND goal2 IS NOT NULL;

        IF FOUND THEN
            IF v_third_match.goal1 > v_third_match.goal2 THEN
                v_third_place := v_third_match.team1;
            ELSE
                v_third_place := v_third_match.team2;
            END IF;
        ELSE
            v_third_place := '';
        END IF;

        -- Award podium points
        FOR v_wb IN
            SELECT wb.userid, wb.winner1stplace, wb.winner2ndplace, wb.winner3rdplace
            FROM winnersbets wb
            WHERE EXISTS (
                SELECT 1 FROM _user_points up WHERE up.uid = wb.userid
            )
        LOOP
            v_total := 0;

            IF v_wb.winner1stplace = v_champion THEN
                v_total := v_total + 20;   -- POINTS_CHAMPION
            END IF;

            IF v_wb.winner2ndplace = v_runner_up THEN
                v_total := v_total + 10;   -- POINTS_RUNNER_UP
            END IF;

            IF v_wb.winner3rdplace = v_third_place AND v_third_place <> '' THEN
                v_total := v_total + 5;    -- POINTS_THIRD_PLACE
            END IF;

            IF v_total > 0 THEN
                UPDATE _user_points
                SET pts = pts + v_total
                WHERE uid = v_wb.userid;
            END IF;
        END LOOP;
    END IF;

    -- ========================================================================
    -- 5. Upsert into TournamentRanking
    -- ========================================================================
    INSERT INTO tournamentranking (userid, points, updatedat)
    SELECT uid, pts, v_now
    FROM _user_points
    ON CONFLICT (userid) DO UPDATE
    SET points   = EXCLUDED.points,
        updatedat = EXCLUDED.updatedat;

    -- Return the results
    RETURN QUERY
    SELECT up.uid, up.pts
    FROM _user_points up
    ORDER BY up.pts DESC;

    -- Temp tables dropped automatically via ON COMMIT DROP
END;
$$;
