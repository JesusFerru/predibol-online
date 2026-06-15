--(Whitelist)
CREATE TABLE public.authorized_users (
  email text NOT NULL,
  name text NOT NULL,
  alias text NOT NULL UNIQUE,
  isadmin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  phonenumber text,
  receipturl text,
  CONSTRAINT authorized_users_pkey PRIMARY KEY (email)
);

-- USERS TABLE (Users logged and Credit Control)
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  alias text NOT NULL UNIQUE,
  phonenumber text,
  haspaidentry boolean NOT NULL DEFAULT false,
  availablepoolcredits integer NOT NULL DEFAULT 0,
  isadmin boolean NOT NULL DEFAULT false,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);


-- MATCH RESULTS 
-- Resultados oficiales de cada partido
CREATE TABLE public.matchresults (
  matchid text NOT NULL,
  team1 text NOT NULL,
  team2 text NOT NULL,
  goal1 integer,
  goal2 integer,
  matchstatus text NOT NULL DEFAULT 'PENDING'::text CHECK (matchstatus = ANY (ARRAY['PENDING'::text, 'FINISHED'::text, 'CANCELED'::text])),
  hasextrapool boolean NOT NULL DEFAULT false,
  scheduleat timestamp with time zone,
  CONSTRAINT matchresults_pkey PRIMARY KEY (matchid)
);
-- =====================================================
-- MATCH BETS
-- =====================================================
-- Se permiten múltiples apuestas por usuario
-- para el mismo partido.
-- Cada fila representa una apuesta independiente.

CREATE TABLE public.matchbets (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  userid uuid NOT NULL,
  matchid text NOT NULL,
  betgoalteam1 integer NOT NULL,
  betgoalteam2 integer NOT NULL,
  penaltywinnerteam integer CHECK (penaltywinnerteam IS NULL OR (penaltywinnerteam = ANY (ARRAY[1, 2]))),
  haspaidextrapool boolean NOT NULL DEFAULT false,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  updatedat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT matchbets_pkey PRIMARY KEY (id),
  CONSTRAINT matchbets_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id),
  CONSTRAINT matchbets_matchid_fkey FOREIGN KEY (matchid) REFERENCES public.matchresults(matchid)
);

-- Si un usuario hace una apuesta extra a un partido
CREATE TABLE public.extrapoolentries (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  betid bigint NOT NULL UNIQUE,
  amountbs numeric NOT NULL,
  receipturl text,
  paymentvalidated boolean NOT NULL DEFAULT false,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT extrapoolentries_pkey PRIMARY KEY (id),
  CONSTRAINT extrapoolentries_betid_fkey FOREIGN KEY (betid) REFERENCES public.matchbets(id)
);

-- =====================================================
--  MATCH POOLS
-- =====================================================
-- Guarda info de las pozas diarias por partido
-- Cuanto es el porcentaje para ese partido para el mantenimiento (5% o 10%)
-- Cuanto es el total registrado de todos los participantes para esta poza diaria
-- Si nadie ganó cuanto se añade del anterior partido al nuevo
-- Cuanto se distribuye al o a los ganadores
-- Cuanto queda para el mantenimiento de la plataforma

CREATE TABLE public.matchpools (
  matchid text NOT NULL,
  entryfeebs numeric NOT NULL,
  maintenancepercentage numeric NOT NULL,
  rolloveramountbs numeric NOT NULL DEFAULT 0,
  totalcollectedbs numeric NOT NULL DEFAULT 0,
  totaldistributedbs numeric NOT NULL DEFAULT 0,
  maintenanceamountbs numeric NOT NULL DEFAULT 0,
  minimumplayers integer NOT NULL DEFAULT 3,
  poolstatus text NOT NULL DEFAULT 'OPEN'::text CHECK (poolstatus = ANY (ARRAY['OPEN'::text, 'COMPLETED'::text, 'CANCELED'::text, 'ROLLED_OVER'::text])),
  processedat timestamp with time zone,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT matchpools_pkey PRIMARY KEY (matchid),
  CONSTRAINT matchpools_matchid_fkey FOREIGN KEY (matchid) REFERENCES public.matchresults(matchid)
);

-- =====================================================
--  WINNERS BETS
-- =====================================================
-- Una predicción de podio por usuario.

CREATE TABLE public.winnersbets (
  userid uuid NOT NULL,
  winner1stplace text NOT NULL,
  winner2ndplace text NOT NULL,
  winner3rdplace text NOT NULL,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  updatedat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT winnersbets_pkey PRIMARY KEY (userid),
  CONSTRAINT winnersbets_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);
-- =====================================================
-- CASH INFLOW
-- =====================================================
-- Registro de dinero recibido.
-- No representa apuestas.
-- Representa movimientos financieros.

CREATE TABLE public.cashinflow (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  userid uuid,
  createdby uuid,
  amountbs numeric NOT NULL,
  concept text NOT NULL,
  receipturl text,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cashinflow_pkey PRIMARY KEY (id),
  CONSTRAINT cashinflow_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id),
  CONSTRAINT cashinflow_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id)
);

-- =====================================================
-- DAILY PAYOUTS
-- =====================================================
-- Registro de premios pagados.

CREATE TABLE public.dailypayouts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  matchid text,
  userid uuid,
  amountpaidbs numeric NOT NULL,
  paymentstatus boolean NOT NULL DEFAULT false,
  payoutdate timestamp with time zone NOT NULL DEFAULT now(),
  paidat timestamp with time zone,
  CONSTRAINT dailypayouts_pkey PRIMARY KEY (id),
  CONSTRAINT dailypayouts_matchid_fkey FOREIGN KEY (matchid) REFERENCES public.matchresults(matchid),
  CONSTRAINT dailypayouts_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- =====================================================
-- TOURNAMENT RANKING
-- =====================================================
-- CRanking con más puntos
CREATE TABLE public.tournamentranking (
  userid uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  updatedat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tournamentranking_pkey PRIMARY KEY (userid),
  CONSTRAINT tournamentranking_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_matchbets_userid
ON public.MatchBets(userid);

CREATE INDEX idx_matchbets_matchid
ON public.MatchBets(matchid);

CREATE INDEX idx_cashinflow_userid
ON public.CashInflow(userid);

CREATE INDEX idx_dailypayouts_userid
ON public.DailyPayouts(userid);

CREATE INDEX idx_extrapoolentries_betid
ON public.ExtraPoolEntries(betid);

CREATE INDEX idx_ranking_userid
ON public.TournamentRanking(userid);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchresults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchbets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extrapoolentries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchpools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winnersbets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.CashInflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.DailyPayouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.TournamentRanking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Users: users can read their own row; admins can read all
CREATE POLICY "Users can read own row"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.isadmin = TRUE
    ));

-- Users: users can update their own row (except hasPaidEntry and isAdmin)
CREATE POLICY "Users can update own row"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- MatchResults: any authenticated user can read
CREATE POLICY "Authenticated users can read match results"
    ON public.matchresults
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- MatchBets: users can read their own bets
CREATE POLICY "Users can read own bets"
    ON public.matchbets
    FOR SELECT
    TO authenticated
    USING (userid = auth.uid());

-- MatchBets: users can insert their own bets
CREATE POLICY "Users can insert own bets"
    ON public.matchbets
    FOR INSERT
    TO authenticated
    WITH CHECK (userid = auth.uid());

-- MatchBets: users can update their own bets
CREATE POLICY "Users can update own bets"
    ON public.matchbets
    FOR UPDATE
    TO authenticated
    USING (userid = auth.uid())
    WITH CHECK (userid = auth.uid());

-- MatchBets: users can delete their own bets
CREATE POLICY "Users can delete own bets"
    ON public.matchbets
    FOR DELETE
    TO authenticated
    USING (userid = auth.uid());

-- ExtraPoolEntries: users can read their own entries
CREATE POLICY "Users can read own pool entries"
    ON public.extrapoolentries
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.matchbets b
        WHERE b.id = betId AND b.userid = auth.uid()
    ));

-- ExtraPoolEntries: users can insert entries for their own bets
CREATE POLICY "Users can insert own pool entries"
    ON public.extrapoolentries
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.matchbets b
        WHERE b.id = betId AND b.userid = auth.uid()
    ));

-- MatchPools: any authenticated user can read
CREATE POLICY "Authenticated users can read match pools"
    ON public.matchpools
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- WinnersBets: any authenticated user can read
CREATE POLICY "Authenticated users can read winners bets"
    ON public.winnersbets
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- WinnersBets: users can insert/update their own podium prediction
CREATE POLICY "Users can insert own winners bet"
    ON public.winnersbets
    FOR INSERT
    TO authenticated
    WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can update own winners bet"
    ON public.winnersbets
    FOR UPDATE
    TO authenticated
    USING (userid = auth.uid())
    WITH CHECK (userid = auth.uid());

-- CashInflow: users can read their own records
CREATE POLICY "Users can read own cash inflow"
    ON public.CashInflow
    FOR SELECT
    TO authenticated
    USING (userid = auth.uid());

-- DailyPayouts: users can read their own payouts
CREATE POLICY "Users can read own payouts"
    ON public.dailypayouts
    FOR SELECT
    TO authenticated
    USING (userid = auth.uid());

-- TournamentRanking: any authenticated user can read
CREATE POLICY "Authenticated users can read tournament ranking"
    ON public.tournamentranking
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- authorized_users: authenticated users can read their own row
CREATE POLICY "Authenticated users can read own authorized record"
    ON public.authorized_users
    FOR SELECT
    TO authenticated
    USING (email = auth.jwt() ->> 'email');

-- =====================================================
-- AUTH TRIGGER: auto-create Users row on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    auth_user public.authorized_users%ROWTYPE;
BEGIN
    SELECT * INTO auth_user
    FROM public.authorized_users
    WHERE email = NEW.email
      AND active = TRUE;

    IF FOUND THEN
        INSERT INTO public.users (
            id,
            email,
            name,
            alias,
            haspaidentry,
            "isadmin"
        )
        VALUES (
            NEW.id,
            auth_user.email,
            auth_user.name,
            auth_user.alias,
            FALSE,
            auth_user.isadmin
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_user_from_auth()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_auth auth.users%ROWTYPE;
        v_authorized authorized_users%ROWTYPE;
    BEGIN

        SELECT *
        INTO v_auth
        FROM auth.users
        WHERE id = auth.uid();

        IF v_auth.id IS NULL THEN
            RETURN;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM users
            WHERE id = v_auth.id
        ) THEN
            RETURN;
        END IF;

        SELECT *
        INTO v_authorized
        FROM authorized_users
        WHERE email = v_auth.email
        AND active = TRUE;

        IF NOT FOUND THEN
            RETURN;
        END IF;

        INSERT INTO users (
            id,
            email,
            name,
            alias,
            phonenumber,
            haspaidentry,
            isadmin
        )
        VALUES (
            v_auth.id,
            v_authorized.email,
            v_authorized.name,
            v_authorized.alias,
            v_authorized.phonenumber,
            TRUE,
            v_authorized.isadmin
        );

    END;
$$;

-- =====================================================
-- POOL CREDIT FUNCTIONS
-- =====================================================
-- Atomic credit operations for Daily Pool entries.
-- SECURITY DEFINER ensures users can consume/refund
-- credits without being able to set arbitrary values.

CREATE OR REPLACE FUNCTION public.consume_pool_credit(p_userid uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        v_credits integer;
    BEGIN
        SELECT availablepoolcredits INTO v_credits
        FROM users
        WHERE id = p_userid;

        IF v_credits IS NULL THEN
            RAISE EXCEPTION 'User not found';
        END IF;

        IF v_credits < 1 THEN
            RAISE EXCEPTION 'Insufficient credits';
        END IF;

        UPDATE users
        SET availablepoolcredits = availablepoolcredits - 1
        WHERE id = p_userid;
    END;
$$;

CREATE OR REPLACE FUNCTION public.refund_pool_credit(p_userid uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
        UPDATE users
        SET availablepoolcredits = availablepoolcredits + 1
        WHERE id = p_userid;
    END;
$$;

-- =====================================================
-- ENSURE MATCH POOL
-- =====================================================
-- Auto-creates a matchpools row when a MOTD match is
-- detected but no pool exists yet. Returns the pool's
-- entryfeebs and poolstatus for the caller.
-- SECURITY DEFINER bypasses RLS (no INSERT policy on matchpools).

CREATE OR REPLACE FUNCTION public.ensure_match_pool(
    p_matchid text,
    p_entryfeebs numeric DEFAULT 50,
    p_maintenancepercentage numeric DEFAULT 10,
    p_minimumplayers integer DEFAULT 3
)
    RETURNS TABLE(entryfeebs numeric, poolstatus text)
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        v_pool record;
    BEGIN
        SELECT mp.entryfeebs, mp.poolstatus
        INTO v_pool
        FROM matchpools mp
        WHERE mp.matchid = p_matchid;

        IF FOUND THEN
            entryfeebs := v_pool.entryfeebs;
            poolstatus := v_pool.poolstatus;
            RETURN NEXT;
        ELSE
            INSERT INTO matchpools (
                matchid,
                entryfeebs,
                maintenancepercentage,
                minimumplayers,
                poolstatus,
                rolloveramountbs,
                totalcollectedbs,
                totaldistributedbs,
                maintenanceamountbs
            )
            VALUES (
                p_matchid,
                p_entryfeebs,
                p_maintenancepercentage,
                p_minimumplayers,
                'OPEN',
                0,
                0,
                0,
                0
            );

            entryfeebs := p_entryfeebs;
            poolstatus := 'OPEN';
            RETURN NEXT;
        END IF;
    END;
$$;