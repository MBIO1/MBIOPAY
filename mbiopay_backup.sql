--
-- PostgreSQL database dump
--

\restrict vcpR1L9jgfHSzrwQ6Wk00HQCbS4nd57VBDCaT2eR24Cfcq7LLALOq2uhTWstZ6Z

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    totp_secret text NOT NULL,
    device_hash text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_login_at timestamp without time zone
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: fraud_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fraud_events (
    id integer NOT NULL,
    user_id integer,
    order_id integer,
    phone text,
    event_type text NOT NULL,
    severity text DEFAULT 'medium'::text NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fraud_events OWNER TO postgres;

--
-- Name: fraud_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fraud_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fraud_events_id_seq OWNER TO postgres;

--
-- Name: fraud_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fraud_events_id_seq OWNED BY public.fraud_events.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    phone text NOT NULL,
    network text NOT NULL,
    amount real,
    ugx_amount real,
    status text DEFAULT 'waiting'::text NOT NULL,
    txid text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    deposit_address text,
    encrypted_pk text,
    expires_at timestamp without time zone
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id integer NOT NULL,
    email text NOT NULL,
    otp_hash text NOT NULL,
    expires_at bigint NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 5 NOT NULL,
    used boolean DEFAULT false NOT NULL,
    ip text,
    created_at bigint NOT NULL
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: otp_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_codes_id_seq OWNER TO postgres;

--
-- Name: otp_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_codes_id_seq OWNED BY public.otp_codes.id;


--
-- Name: phone_blocklist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phone_blocklist (
    phone text NOT NULL,
    reason text DEFAULT 'Manual block'::text NOT NULL,
    blocked_by text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.phone_blocklist OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    uid text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    display_name text,
    avatar_url text,
    username_set boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp without time zone,
    risk_score integer DEFAULT 0 NOT NULL,
    is_frozen boolean DEFAULT false NOT NULL,
    frozen_at timestamp without time zone,
    frozen_reason text,
    email_verified boolean DEFAULT false NOT NULL,
    email_verify_code text,
    email_verify_expires timestamp without time zone,
    totp_secret text,
    totp_enabled boolean DEFAULT false NOT NULL,
    password_reset_token text,
    password_reset_expires timestamp without time zone,
    google_id text,
    phone text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: fraud_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_events ALTER COLUMN id SET DEFAULT nextval('public.fraud_events_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: otp_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes ALTER COLUMN id SET DEFAULT nextval('public.otp_codes_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password_hash, totp_secret, device_hash, is_active, created_at, last_login_at) FROM stdin;
1	admin@mbiopay.com	$2b$12$miUzZ0lY.x85L7wOg6TU9euW06SWZ0vx1wEjy.CQB0lfUT/uu0OJS	IE7XUYSCJFCTC6ZJHE2HERTNKJVSGQC5	\N	t	2026-03-23 18:10:58.124305	2026-03-24 19:31:59.594
\.


--
-- Data for Name: fraud_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fraud_events (id, user_id, order_id, phone, event_type, severity, details, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, phone, network, amount, ugx_amount, status, txid, created_at, updated_at, user_id, deposit_address, encrypted_pk, expires_at) FROM stdin;
1	256700000000	MTN	\N	\N	expired	\N	2026-03-22 15:47:33.025761	2026-03-23 12:36:42.254279	\N	\N	\N	\N
2	256786848184	MTN	\N	\N	expired	\N	2026-03-22 16:23:32.204941	2026-03-23 12:36:42.254279	\N	\N	\N	\N
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, email, otp_hash, expires_at, attempts, max_attempts, used, ip, created_at) FROM stdin;
1	otp-test-1774379826@example.com	822f61ce0d599289ccc21d5386dd3c1e1ab238a48483bddc9121f291ab8e6f18	1774380727242	1	5	f	::1	1774379827242
\.


--
-- Data for Name: phone_blocklist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phone_blocklist (phone, reason, blocked_by, created_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, created_at) FROM stdin;
8	1	6eee639e849c5f8600c78aa9b2690c01058f7e9bf53fd33347e7d84c74adb3f1	2026-03-30 16:52:28.995	2026-03-23 16:52:28.996274
14	3	6ec11e0694adbfcc7335a50e0181c6844e20b4777d2ccc302f5fa3522581a31c	2026-03-30 18:19:18.52	2026-03-23 18:19:18.52089
17	1	c46f6478d6a67542750bde8bb066d5b633a65f900a87e3d8d43a1834f3a599ce	2026-03-31 02:33:16.349	2026-03-24 02:33:16.350387
20	1	af4eef50fb0ef90993237b069dab2ec023e0b3c5f395994c836f0c374091855a	2026-03-31 02:52:20.328	2026-03-24 02:52:20.329325
23	1	bc6eedcd9582c61d5a0df9e5ce1f4bdfdc20b3333017f3790560daa8ab0b1ac1	2026-03-31 05:29:51.893	2026-03-24 05:29:51.894295
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, uid, email, username, password_hash, created_at, display_name, avatar_url, username_set, updated_at, failed_attempts, locked_until, risk_score, is_frozen, frozen_at, frozen_reason, email_verified, email_verify_code, email_verify_expires, totp_secret, totp_enabled, password_reset_token, password_reset_expires, google_id, phone) FROM stdin;
2	FD0F082B	demo@mbioapay.com	demoboss	$2b$12$jvuWd1rRVqvTPKkGOhbayeKsFc0mZMUDBZOiec4MfdN3sjdn.XUWC	2026-03-23 10:41:41.472771	\N	\N	f	2026-03-23 10:41:41.472771	0	\N	0	f	\N	\N	f	\N	\N	\N	f	\N	\N	\N	\N
3	D99EBBEA	test@mbiopay.com	testuser	$2b$12$24My50rvUajvNOZKasAFRutPMDJMc2RrYpK7dIUmPoEuqcZM5gL8O	2026-03-23 18:19:18.490386	\N	\N	f	2026-03-23 18:19:18.490386	0	\N	0	f	\N	\N	f	\N	\N	\N	f	\N	\N	\N	\N
5	9D5895A5	fevic2@gmail.com	Feva	$2b$12$Vli0.hWefQpW1Ea2GpV1yOCFgPq6pDpUVJQhUxQrHbw2XwPHc.oKi	2026-03-24 07:14:57.503124	\N	\N	f	2026-03-24 07:14:57.503124	0	\N	0	f	\N	\N	f	484583	2026-03-24 07:29:57.501	\N	f	\N	\N	\N	\N
1	7AB745C9	pikaq@duck.com	Buon	$2b$12$JMpVpKIevhGsjkEQqlMMoOPODH8Kn3sn1aE8FO48KbaT4EBcYBOlq	2026-03-23 09:19:11.250203	Buon	data:image/jpeg;base64,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	f	2026-03-24 10:18:58.569	2	\N	0	f	\N	\N	f	\N	\N	\N	f	\N	\N	\N	\N
6	465659B4	otp-test-1774379826@example.com	otptestuser1774379826	$2b$12$H/tWZSy8ob0cpRneDrQG3eqW4O7ag5NCuU.v0NH2Ef8jNejHyvWVO	2026-03-24 19:17:07.210295	\N	\N	f	2026-03-24 19:17:07.210295	0	\N	0	f	\N	\N	f	\N	\N	\N	f	\N	\N	\N	\N
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: fraud_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fraud_events_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 2, true);


--
-- Name: otp_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_codes_id_seq', 1, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 23, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: fraud_events fraud_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fraud_events
    ADD CONSTRAINT fraud_events_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: phone_blocklist phone_blocklist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_blocklist
    ADD CONSTRAINT phone_blocklist_pkey PRIMARY KEY (phone);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uid_unique UNIQUE (uid);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_admins_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_email ON public.admins USING btree (email);


--
-- Name: idx_fraud_events_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fraud_events_created_at ON public.fraud_events USING btree (created_at DESC);


--
-- Name: idx_fraud_events_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fraud_events_phone ON public.fraud_events USING btree (phone);


--
-- Name: idx_fraud_events_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fraud_events_user_id ON public.fraud_events USING btree (user_id);


--
-- Name: idx_otp_codes_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_codes_email ON public.otp_codes USING btree (email);


--
-- Name: idx_otp_codes_email_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_codes_email_created ON public.otp_codes USING btree (email, created_at);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: users_google_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_google_id_unique ON public.users USING btree (google_id) WHERE (google_id IS NOT NULL);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vcpR1L9jgfHSzrwQ6Wk00HQCbS4nd57VBDCaT2eR24Cfcq7LLALOq2uhTWstZ6Z

