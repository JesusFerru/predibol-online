-- ============================================================================
-- get_tiebreaker_counts()
--
-- SECURITY DEFINER function that returns tie-breaker counts for all users
-- with haspaidentry = TRUE. The web app calls this via supabase.rpc() to
-- bypass MatchBets RLS (users can normally only read their own bets).
--
-- Returns:
--   userid                  — UUID of the user
--   alias                   — display alias from Users table
--   exact_score_count       — # of bets that matched the exact final score
--   correct_outcome_count   — # of bets that matched the outcome (win/draw)
--                             but NOT the exact score. Multi-bet suppression
--                             is applied: if user placed >1 bet on a match,
--                             no outcome points are counted for that match.
--   correct_penalty_count   — # of knockout matches that ended in a draw
--                             where the user correctly predicted the
--                             advancing team.
--
-- NOTE — Penalty winner data dependency:
--   correct_penalty_count requires knowing which team actually advanced
--   after a drawn knockout match. The MatchResults table does not currently
--   store this. When a column (e.g. advancing_team) or external data source
--   becomes available, update the penalty loop below.
--   For now, correct_penalty_count always returns 0.
--
-- Usage from Next.js Server Component:
--   const { data } = await supabase.rpc("get_tiebreaker_counts");
--
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tiebreaker_counts()
RETURNS TABLE (
    userid                  UUID,
    alias                   TEXT,
    exact_score_count       INT,
    correct_outcome_count   INT,
    correct_penalty_count   INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_bet       RECORD;
    v_multi_key TEXT;
    v_is_multi  BOOLEAN;
BEGIN
    -- ========================================================================
    -- 1. Temporary table: multi-bet keys
    --    Key format: userid::matchid
    -- ========================================================================
    CREATE TEMP TABLE IF NOT EXISTS _tie_multi_keys (
        key TEXT PRIMARY KEY
    ) ON COMMIT DROP;
    TRUNCATE _tie_multi_keys;

    INSERT INTO _tie_multi_keys (key)
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
    -- 2. Temporary table: per-user counters
    -- ========================================================================
    CREATE TEMP TABLE IF NOT EXISTS _tie_counts (
        uid                     UUID PRIMARY KEY,
        user_alias              TEXT NOT NULL DEFAULT '',
        exact_score             INT NOT NULL DEFAULT 0,
        correct_outcome         INT NOT NULL DEFAULT 0,
        correct_penalty         INT NOT NULL DEFAULT 0
    ) ON COMMIT DROP;
    TRUNCATE _tie_counts;

    -- Seed with all paid users
    INSERT INTO _tie_counts (uid, user_alias)
    SELECT u.id, u.alias
    FROM users u
    WHERE u.haspaidentry = TRUE;

    -- ========================================================================
    -- 3. Exact score count + Correct outcome count
    --    Iterate over every bet on a FINISHED match with known scores.
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
              SELECT 1 FROM _tie_counts tc WHERE tc.uid = mb.userid
          )
    LOOP
        v_multi_key := v_bet.userid::TEXT || '::' || v_bet.matchid::TEXT;
        v_is_multi  := EXISTS (
            SELECT 1 FROM _tie_multi_keys WHERE key = v_multi_key
        );

        -- Exact score match?
        IF v_bet.betgoalteam1 = v_bet.goal1
           AND v_bet.betgoalteam2 = v_bet.goal2 THEN
            UPDATE _tie_counts
            SET exact_score = exact_score + 1
            WHERE uid = v_bet.userid;

        -- Correct outcome (but not exact)?
        -- Multi-bet suppression: skip +1 when user had >1 bet on this match.
        ELSIF NOT v_is_multi
          AND (
              (v_bet.betgoalteam1 > v_bet.betgoalteam2
                   AND v_bet.goal1 > v_bet.goal2)
           OR (v_bet.betgoalteam1 < v_bet.betgoalteam2
                   AND v_bet.goal1 < v_bet.goal2)
           OR (v_bet.betgoalteam1 = v_bet.betgoalteam2
                   AND v_bet.goal1 = v_bet.goal2)
          ) THEN
            UPDATE _tie_counts
            SET correct_outcome = correct_outcome + 1
            WHERE uid = v_bet.userid;
        END IF;
    END LOOP;

    -- ========================================================================
    -- 4. Correct penalty winner count
    --
    --    TODO: Requires actual advancing-team data.
    --    When MatchResults includes an advancing_team column (1 or 2),
    --    uncomment and adapt the loop below to compare against
    --    MatchBets.penaltywinnerteam.
    --
    --    Conditions (normativas.md §2.2):
    --      - Match is a knockout round (matchids 73–104)
    --      - Match ended in a draw (goal1 = goal2, both non-null)
    --      - User's penaltywinnerteam matches the actual advancing team
    -- ========================================================================

    -- Uncomment when advancing-team data is available:
    --
    -- FOR v_bet IN
    --     SELECT
    --         mb.userid,
    --         mb.penaltywinnerteam,
    --         mr.advancing_team   -- <-- column does not exist yet
    --     FROM matchbets mb
    --     JOIN matchresults mr ON mr.matchid = mb.matchid
    --     WHERE mr.matchstatus = 'FINISHED'
    --       AND mr.goal1 IS NOT NULL
    --       AND mr.goal2 IS NOT NULL
    --       AND mr.goal1 = mr.goal2          -- draw after extra time
    --       AND mr.matchid::INT BETWEEN 73 AND 104  -- knockout rounds
    --       AND mb.penaltywinnerteam IS NOT NULL
    --       AND EXISTS (
    --           SELECT 1 FROM _tie_counts tc WHERE tc.uid = mb.userid
    --       )
    -- LOOP
    --     IF v_bet.penaltywinnerteam = v_bet.advancing_team THEN
    --         UPDATE _tie_counts
    --         SET correct_penalty = correct_penalty + 1
    --         WHERE uid = v_bet.userid;
    --     END IF;
    -- END LOOP;

    -- ========================================================================
    -- 5. Return results
    -- ========================================================================
    RETURN QUERY
    SELECT
        tc.uid,
        tc.user_alias,
        tc.exact_score,
        tc.correct_outcome,
        tc.correct_penalty
    FROM _tie_counts tc
    ORDER BY tc.uid;

    -- Temp tables dropped automatically via ON COMMIT DROP
END;
$$;
