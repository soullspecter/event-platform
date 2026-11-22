--
-- PostgreSQL database dump
--

\restrict BUkIF58x5azJYFemfBDdf6OfeR862TRcmVeBQDLQQ0v6fC7m9VyabzrxhhdCewy

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.answers (
    answer_id integer NOT NULL,
    submission_id integer NOT NULL,
    question_id integer NOT NULL,
    text_value text
);


--
-- Name: answers_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.answers ALTER COLUMN answer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.answers_answer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certificate_template_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_template_fields (
    field_id integer NOT NULL,
    template_id integer NOT NULL,
    x numeric(10,2) NOT NULL,
    y numeric(10,2) NOT NULL,
    unit character varying(10) DEFAULT 'percent'::character varying NOT NULL,
    text_template text DEFAULT '{last_name}
{first_name}
{middle_name}'::text NOT NULL,
    font_name character varying(100) DEFAULT 'Arial'::character varying NOT NULL,
    font_size numeric(5,2) DEFAULT 14 NOT NULL,
    font_style character varying(30) DEFAULT 'normal'::character varying NOT NULL,
    font_color character varying(7) DEFAULT '#000000'::character varying NOT NULL,
    max_width numeric(10,2),
    line_wrap boolean DEFAULT false NOT NULL,
    line_height numeric(5,2) DEFAULT 1.2 NOT NULL,
    CONSTRAINT chk_certificate_template_fields_font_size CHECK ((font_size > (0)::numeric)),
    CONSTRAINT chk_certificate_template_fields_font_style CHECK (((font_style)::text = ANY ((ARRAY['normal'::character varying, 'bold'::character varying, 'italic'::character varying, 'bold_italic'::character varying])::text[]))),
    CONSTRAINT chk_certificate_template_fields_line_height CHECK ((line_height >= 1.0)),
    CONSTRAINT chk_certificate_template_fields_max_width CHECK (((max_width IS NULL) OR (max_width > (0)::numeric))),
    CONSTRAINT chk_certificate_template_fields_unit CHECK (((unit)::text = ANY ((ARRAY['mm'::character varying, 'pt'::character varying, 'percent'::character varying])::text[]))),
    CONSTRAINT chk_certificate_template_fields_x CHECK ((x >= (0)::numeric)),
    CONSTRAINT chk_certificate_template_fields_y CHECK ((y >= (0)::numeric))
);


--
-- Name: certificate_template_fields_field_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.certificate_template_fields ALTER COLUMN field_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.certificate_template_fields_field_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certificate_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_templates (
    template_id integer NOT NULL,
    event_id integer NOT NULL,
    kind character varying(30) DEFAULT 'participant'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    pdf_file_path text NOT NULL,
    page_width numeric(10,2) DEFAULT 210 NOT NULL,
    page_height numeric(10,2) DEFAULT 297 NOT NULL,
    preview_path text,
    CONSTRAINT chk_certificate_templates_kind CHECK (((kind)::text = ANY ((ARRAY['participant'::character varying, 'speaker'::character varying, 'volunteer'::character varying, 'mentor'::character varying, 'winner'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT chk_certificate_templates_page_height CHECK ((page_height > (0)::numeric)),
    CONSTRAINT chk_certificate_templates_page_width CHECK ((page_width > (0)::numeric))
);


--
-- Name: certificate_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.certificate_templates ALTER COLUMN template_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.certificate_templates_template_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    certificate_id integer NOT NULL,
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    template_id integer NOT NULL,
    file_path text
);


--
-- Name: certificates_certificate_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.certificates ALTER COLUMN certificate_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.certificates_certificate_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: common_schedule_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.common_schedule_items (
    common_item_id integer NOT NULL,
    event_id integer NOT NULL,
    location_place_id integer,
    name character varying(255),
    item_date date,
    start_time time without time zone,
    end_time time without time zone,
    CONSTRAINT chk_common_schedule_times CHECK (((start_time IS NULL) OR (end_time IS NULL) OR (end_time > start_time)))
);


--
-- Name: common_schedule_items_common_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.common_schedule_items ALTER COLUMN common_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.common_schedule_items_common_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: document_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_imports (
    import_id integer NOT NULL,
    uploaded_by integer NOT NULL,
    source_filename character varying(255) NOT NULL,
    source_path text NOT NULL,
    pdf_path text,
    status character varying(30) NOT NULL,
    error_message text,
    extracted_data jsonb,
    CONSTRAINT chk_document_imports_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'done'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: document_imports_import_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.document_imports ALTER COLUMN import_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.document_imports_import_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    title character varying(255),
    description text,
    start_date date,
    end_date date,
    created_by integer NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    CONSTRAINT chk_events_dates CHECK (((start_date IS NULL) OR (end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT chk_events_status CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying])::text[])))
);


--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.events ALTER COLUMN event_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.events_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: imported_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imported_events (
    import_id integer NOT NULL,
    event_id integer NOT NULL
);


--
-- Name: location_places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_places (
    location_place_id integer NOT NULL,
    location_id integer NOT NULL,
    place text
);


--
-- Name: location_places_location_place_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.location_places ALTER COLUMN location_place_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.location_places_location_place_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    location_id integer NOT NULL,
    name character varying(255),
    address text
);


--
-- Name: locations_location_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.locations ALTER COLUMN location_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.locations_location_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: program_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_schedule (
    program_id integer NOT NULL,
    schedule_item_id integer NOT NULL
);


--
-- Name: program_selections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_selections (
    registration_id integer NOT NULL,
    program_id integer NOT NULL
);


--
-- Name: programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programs (
    program_id integer NOT NULL,
    event_id integer NOT NULL,
    name character varying(255),
    description text
);


--
-- Name: programs_program_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.programs ALTER COLUMN program_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.programs_program_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qr_codes (
    qr_code_id integer NOT NULL,
    event_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: qr_codes_qr_code_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.qr_codes ALTER COLUMN qr_code_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.qr_codes_qr_code_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: questionnaire_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questionnaire_submissions (
    submission_id integer NOT NULL,
    questionnaire_id integer NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: questionnaire_submissions_submission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.questionnaire_submissions ALTER COLUMN submission_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.questionnaire_submissions_submission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: questionnaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questionnaires (
    questionnaire_id integer NOT NULL,
    event_id integer NOT NULL
);


--
-- Name: questionnaires_questionnaire_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.questionnaires ALTER COLUMN questionnaire_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.questionnaires_questionnaire_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    question_id integer NOT NULL,
    questionnaire_id integer NOT NULL,
    type character varying(30) DEFAULT 'text'::character varying NOT NULL,
    text text NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT chk_question_type CHECK (((type)::text = ANY ((ARRAY['text'::character varying, 'single_choice'::character varying])::text[])))
);


--
-- Name: questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.questions ALTER COLUMN question_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.questions_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    registration_id integer NOT NULL,
    user_id integer NOT NULL,
    event_id integer NOT NULL,
    qr_code_id integer
);


--
-- Name: registrations_registration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.registrations ALTER COLUMN registration_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.registrations_registration_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    review_id integer NOT NULL,
    submission_id integer NOT NULL,
    review_text text NOT NULL
);


--
-- Name: reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reviews ALTER COLUMN review_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reviews_review_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id smallint NOT NULL,
    role_name character varying(100) NOT NULL
);


--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schedule_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_items (
    schedule_item_id integer NOT NULL,
    location_place_id integer,
    name character varying(255),
    item_date date,
    start_time time without time zone,
    end_time time without time zone,
    CONSTRAINT chk_schedule_items_times CHECK (((start_time IS NULL) OR (end_time IS NULL) OR (end_time > start_time)))
);


--
-- Name: schedule_items_schedule_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.schedule_items ALTER COLUMN schedule_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.schedule_items_schedule_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sentiment_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sentiment_analyses (
    analysis_id integer NOT NULL,
    review_id integer NOT NULL,
    sentiment_class_id smallint NOT NULL
);


--
-- Name: sentiment_analyses_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sentiment_analyses ALTER COLUMN analysis_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sentiment_analyses_analysis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sentiment_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sentiment_classes (
    sentiment_class_id smallint NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: sentiment_classes_sentiment_class_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sentiment_classes ALTER COLUMN sentiment_class_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sentiment_classes_sentiment_class_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    middle_name character varying(100),
    birth_date date NOT NULL,
    role_id smallint NOT NULL
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.answers (answer_id, submission_id, question_id, text_value) FROM stdin;
\.


--
-- Data for Name: certificate_template_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate_template_fields (field_id, template_id, x, y, unit, text_template, font_name, font_size, font_style, font_color, max_width, line_wrap, line_height) FROM stdin;
\.


--
-- Data for Name: certificate_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate_templates (template_id, event_id, kind, name, pdf_file_path, page_width, page_height, preview_path) FROM stdin;
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (certificate_id, event_id, user_id, template_id, file_path) FROM stdin;
\.


--
-- Data for Name: common_schedule_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.common_schedule_items (common_item_id, event_id, location_place_id, name, item_date, start_time, end_time) FROM stdin;
2	1	\N	фыв	2026-11-18	03:02:00	03:24:00
1	1	3	фывфыв	2026-11-18	11:16:00	13:16:00
3	1	1	\N	2026-11-18	\N	\N
4	2	7	Работа ЭКСПО и информационной стойки IRONSTAR	2025-06-13	11:00:00	20:00:00
5	2	7	Выдача стартовых пакетов	2025-06-13	11:00:00	20:00:00
6	2	7	Технический сервис велосипедов	2025-06-13	11:00:00	20:00:00
7	2	7	Информационный центр IRONSTAR	2025-06-14	10:00:00	20:00:00
8	2	7	Спортивная выставка-ярмарка ЭКСПО	2025-06-14	10:00:00	20:00:00
9	2	7	Работа транзитной зоны, постановка велосипедов IRONSTAR 113 & OLYMPIC	2025-06-14	11:00:00	20:00:00
10	2	6	Камера хранения	2025-06-14	12:00:00	18:00:00
11	2	7	Гравировка медалей	2025-06-14	13:20:00	18:00:00
12	2	7	Церемония награждения SWIMSTAR, IRONLADY, награждение в номинации "Клубы по рейтингу ALL STARS"	2025-06-14	17:50:00	18:50:00
13	2	7	Брифинг участников IRONSTAR 113 & OLYMPIC	2025-06-14	19:00:00	20:00:00
14	2	6	Работа раздевалок и камеры хранения	2025-06-15	05:30:00	20:00:00
15	2	7	Информационный центр IRONSTAR	2025-06-15	05:30:00	20:00:00
16	2	7	Спортивная выставка-ярмарка ЭКСПО	2025-06-15	05:30:00	20:00:00
17	2	7	Перекрытие автомобильных дорог	2025-06-15	06:00:00	17:00:00
18	2	7	Финишное питание участников триатлона	2025-06-15	10:20:00	18:30:00
19	2	7	Время работы зоны восстановления и выдачи футболок финишёров	2025-06-15	10:20:00	18:30:00
20	3	15	Открытие форума	2025-11-28	14:00:00	14:30:00
21	3	15	Пленарная сессия	2025-11-28	17:00:00	18:00:00
\.


--
-- Data for Name: document_imports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_imports (import_id, uploaded_by, source_filename, source_path, pdf_path, status, error_message, extracted_data) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (event_id, title, description, start_date, end_date, created_by, status) FROM stdin;
1	\N	sadas	2026-11-18	2026-11-19	2	draft
2	Фестиваль спорта «IRONSTAR TYUMEN 2025»	\N	2025-06-13	2025-06-15	2	draft
3	Форум тюменской молодежи «МОСТ-2025»	\N	2025-11-28	2025-11-28	2	draft
\.


--
-- Data for Name: imported_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.imported_events (import_id, event_id) FROM stdin;
\.


--
-- Data for Name: location_places; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.location_places (location_place_id, location_id, place) FROM stdin;
1	1	фыв
2	2	вап
3	3	цук
4	4	\N
5	5	вход с ул. Республики
6	6	\N
7	7	Площадь у мультицентра
8	8	сервисная зона
9	8	Зал "Амфитеатр"
10	9	6 этаж зал «Повод»
11	8	Кино-зал
12	8	Конференц-зал
13	8	«Кино-зал»
14	8	«Конференц-зал»
15	10	Зал "Амфитеатр"
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (location_id, name, address) FROM stdin;
1	фыв	фыв
2	вап	вап
3	цукцу	цукцу
4	площадь у мультицентра «Контора пароходства А.В. Колмакова»	г. Тюмень, ул. 25 Октября, 23А, стр. 1
5	Набережная реки Тура	г. Тюмень, Береговая 77/2
6	Набережная реки Тура	Береговая 77/2, вход с ул. Республики
7	Мультицентр «Контора пароходства А.В. Колмакова»	ул. 25 Октября, 23А, стр. 1
8	Музейный комплекс им.И.Я.Словцова	г.Тюмень, ул.Советская, 63
9	Молодёжная резиденция «БАШНЯ»	ул.Орджоникидзе, 56 к 2
10	Музейный комплекс им.И.Я.Словцова	г. Тюмень, ул. Советская, 63
\.


--
-- Data for Name: program_schedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.program_schedule (program_id, schedule_item_id) FROM stdin;
1	6
2	7
2	8
2	9
3	10
4	11
4	12
5	13
5	14
6	15
6	16
6	17
6	18
6	19
6	20
6	21
7	22
7	16
7	17
7	18
7	19
7	20
7	23
7	24
7	25
7	26
7	27
7	28
7	29
7	30
7	31
8	32
8	33
8	34
9	35
9	36
10	37
10	38
11	39
12	40
12	41
13	42
\.


--
-- Data for Name: program_selections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.program_selections (registration_id, program_id) FROM stdin;
\.


--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.programs (program_id, event_id, name, description) FROM stdin;
1	1	asdasdas	\N
2	2	Работа ЭКСПО, выдача стартовых пакетов и технический сервис (13 июня)	В пятницу, 13 июня, на площади у мультицентра «Контора пароходства» проходит работа спортивной выставки-ярмарки ЭКСПО. В течение дня осуществляется выдача стартовых пакетов для всех дистанций, включая детские забеги STARKIDS, MANSTAR, IRONLADY, а также соревнования по триатлону и плаванию. Дополнительно организован технический сервис для велосипедов участников.
3	2	Соревнования по плаванию SWIMSTAR ONE MILE TYUMEN 2025 (14 июня)	14 июня на акватории реки Тура состоятся соревнования по плаванию на открытой воде SWIMSTAR ONE MILE. Участники преодолеют дистанцию в 1 морскую милю (1,7 км). Старт заплыва запланирован на 13:00, а лимит времени на прохождение дистанции составляет 1 час 10 минут.
4	2	Женский и мужской забеги IRONLADY и MANSTAR (14 июня)	В субботу, 14 июня, на набережной пройдут забеги на дистанцию 5 км. В 15:00 стартует женский забег IRONLADY, а в 16:00 — мужской забег MANSTAR. Для обеих дистанций установлен лимит времени в 40 минут. Участники соревнуются в различных возрастных группах, а для сильнейших выделена категория «Элита».
5	2	Традиционный детский забег STARKIDS (14 июня)	14 июня в рамках фестиваля состоятся детские забеги STARKIDS для участников до 12 лет. В 17:00 стартуют дети в возрасте от 7 до 12 лет на дистанции 1 км, а в 17:20 — самые юные участники до 6 лет на дистанции 0,5 км. Забеги проходят на площади у мультицентра.
6	2	Соревнования по триатлону IRONSTAR 113 TYUMEN 2025 (15 июня)	В воскресенье, 15 июня, начинаются соревнования по триатлону на средней дистанции IRONSTAR 113. Программа включает плавание на 1,7 км, велогонку на 90 км и беговой этап. Общий лимит времени на преодоление всей дистанции составляет 8 часов. Старт первой волны (Элита) назначен на 07:00.
7	2	Соревнования по триатлону IRONSTAR OLYMPIC TYUMEN 2025 (15 июня)	15 июня также проходят соревнования по олимпийскому триатлону IRONSTAR OLYMPIC. Дистанция состоит из плавания на 1,7 км, велогонки на 39 км и бега. Общий лимит времени для участников — 4 часа 40 минут. Старт соревнований запланирован на 08:20, сразу после старта участников дистанции 113.
8	3	Ярмарка молодёжных сообществ (28.11.2025)	Площадка для обеспечения взаимодействия и обмена опытом между молодёжными сообществами. Включает интерактивные зоны: гик-зону, фиджитал-спорт, адаптивные игры, а также стенды различных движений («ЛизаАлерт», «Движения Первых», «Юнармия» и др.). В рамках площадки также пройдёт стратегическая сессия по развитию молодёжной политики, где команды обсудят пространства, мероприятия и городскую инфраструктуру.
9	3	Молодёжь. Служение Отечеству (28.11.2025)	Просветительская площадка, посвященная исторической памяти и патриотизму. Включает открытый диалог с актером Егором Бероевым о связи поколений и воспитании, а также итоговую встречу участников проекта «Молодежная администрация Тюмени» с награждением, показом спектакля и интеллектуальной игрой.
10	3	Молодёжь. Будущее (28.11.2025)	Тематическая площадка, посвященная практическому применению искусственного интеллекта. Состоит из мастер-класса по использованию ИИ в учебном процессе и образовательного форсайта, на котором участники будут проектировать варианты будущего с помощью инструментов ИИ.
11	3	Молодёжь. Предпринимательство (28.11.2025)	Практикум, направленный на формирование навыков ведения бизнеса у молодежи. Эксперты и предприниматели обсудят работу с поколением Z, создание амбассадоров бренда, преодоление кризисов, государственную поддержку и запуск подкастов. Спикеры представят реальные кейсы и инструменты для развития проектов.
12	3	Молодёжь. Диалог (28.11.2025)	Площадка для межкультурного обмена и раскрытия потенциала молодёжи. Включает презентацию проектов платформы «Россия – страна возможностей», выступления иностранных студентов, этно-квиз и флешмоб, направленные на установление диалога между представителями разных культур.
13	3	Молодёжь. Медиа (28.11.2025)	Мастерская сторителлинга, посвященная созданию подкастов. Участники изучат принципы структурирования контента, выбора тем и взаимодействия с аудиторией, а также получат практические навыки для запуска собственного проекта.
\.


--
-- Data for Name: qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.qr_codes (qr_code_id, event_id, token_hash, expires_at, is_active) FROM stdin;
\.


--
-- Data for Name: questionnaire_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questionnaire_submissions (submission_id, questionnaire_id, user_id) FROM stdin;
\.


--
-- Data for Name: questionnaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questionnaires (questionnaire_id, event_id) FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questions (question_id, questionnaire_id, type, text, is_required, sort_order) FROM stdin;
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registrations (registration_id, user_id, event_id, qr_code_id) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (review_id, submission_id, review_text) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (role_id, role_name) FROM stdin;
1	user
2	admin
\.


--
-- Data for Name: schedule_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schedule_items (schedule_item_id, location_place_id, name, item_date, start_time, end_time) FROM stdin;
6	\N	\N	2026-11-18	\N	\N
7	4	Работа ЭКСПО и информационной стойки IRONSTAR	2025-06-13	11:00:00	20:00:00
8	4	Выдача стартовых пакетов STARKIDS, MANSTAR, IRONLADY, IRONSTAR 113 & OLYMPIC, SWIMSTAR	2025-06-13	11:00:00	20:00:00
9	4	Технический сервис велосипедов	2025-06-13	11:00:00	20:00:00
10	5	Заплыв SWIMSTAR MILE	2025-06-14	13:00:00	\N
11	4	Забег IRONLADY	2025-06-14	15:00:00	\N
12	4	Забег MANSTAR	2025-06-14	16:00:00	\N
13	4	Забег STARKIDS (мальчики и девочки 7-12 лет)	2025-06-14	17:00:00	\N
14	4	Забег STARKIDS (мальчики и девочки 0-6 лет)	2025-06-14	17:20:00	\N
15	4	Открыта транзитная зона IRONSTAR 113. Постановки велосипедов нет!	2025-06-15	05:30:00	06:10:00
16	6	Старт Элита мужчины IRONSTAR 113	2025-06-15	07:00:00	\N
17	6	Старт Элита женщины IRONSTAR 113	2025-06-15	07:03:00	\N
18	6	Старт возрастные группы мужчины, женщины IRONSTAR 113	2025-06-15	07:10:00	\N
19	6	Старт эстафетных команд IRONSTAR 113	2025-06-15	07:25:00	\N
20	6	Старт параатлетов IRONSTAR 113	2025-06-15	07:30:00	\N
21	4	Финиш лидера IRONSTAR 113	2025-06-15	10:50:00	\N
22	4	Открыта транзитная зона IRONSTAR 113. Постановки велосипедов нет!	2025-06-15	07:00:00	\N
23	4	Открыта транзитная зона IRONSTAR OLYMPIC. Постановки велосипедов нет!	2025-06-15	08:20:00	\N
24	6	Старт Элита мужчины IRONSTAR OLYMPIC	2025-06-15	08:20:00	\N
25	6	Старт Элита женщины IRONSTAR OLYMPIC	2025-06-15	08:23:00	\N
26	6	Старт возрастные группы мужчины, женщины IRONSTAR OLYMPIC	2025-06-15	08:25:00	\N
27	6	Старт эстафетных команд IRONSTAR OLYMPIC	2025-06-15	08:45:00	\N
28	6	Старт параатлетов IRONSTAR OLYMPIC	2025-06-15	08:50:00	\N
29	4	Финиш лидера IRONSTAR OLYMPIC	2025-06-15	10:20:00	\N
30	4	Финишное питание участников триатлона	2025-06-15	10:20:00	18:30:00
31	4	Время работы зоны восстановления и выдачи футболок финишёров	2025-06-15	10:20:00	18:30:00
32	8	Площадка «Ярмарка молодёжных сообществ»	2025-11-28	13:00:00	14:30:00
33	8	Площадка «Ярмарка молодёжных сообществ»	2025-11-28	15:00:00	16:15:00
34	8	Площадка «Ярмарка молодёжных сообществ»	2025-11-28	16:30:00	18:00:00
35	9	Открытый диалог: «Связь ВОВ и СВО, историческая справедливость и правда, патриотическое воспитание новых поколений»	2025-11-28	14:40:00	15:40:00
36	10	Итоговая встреча участников проекта «Молодежная администрация Тюмени», награждение, показ спектакля и интеллектуальная игра	2025-11-28	18:00:00	21:00:00
37	11	Мастер-класс "Практическое применение искусственного интеллекта в образовании: методы и инструменты"	2025-11-28	14:40:00	15:20:00
38	9	Форсайт "Возможные варианты будущего и сопроектирование при помощи инструментов искусственного интеллекта"	2025-11-28	15:50:00	16:50:00
39	12	Практикум «Правильная команда – залог успеха»	2025-11-28	14:40:00	15:40:00
40	13	Презентация «Всероссийский проект президентской платформы «Россия – страна возможностей» и «Международное молодежное сотрудничество»	2025-11-28	15:30:00	16:00:00
41	14	Выступление иностранных студентов, Этно-квиз, Флешмоб	2025-11-28	16:00:00	17:00:00
42	11	Мастерская сторителлинга: как придумать идею для своего подкаста и начать что-то делать	2025-11-28	16:10:00	16:50:00
\.


--
-- Data for Name: sentiment_analyses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sentiment_analyses (analysis_id, review_id, sentiment_class_id) FROM stdin;
\.


--
-- Data for Name: sentiment_classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sentiment_classes (sentiment_class_id, code, name) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, email, password_hash, first_name, last_name, middle_name, birth_date, role_id) FROM stdin;
1	test@mail.com	$2b$12$zmyBIqTOGqm2x52p6b/rqeDbYV9J6fT/ISv5DB8MAQ0JRcZlDOggy	Test	Test	\N	2002-12-12	1
2	admin@test.com	$2b$12$UlPABrUyAWbTPOo79sK2e.8KTxn9SHslrJj.iUA8jtOGwguxN/PhO	Admin	User	\N	1995-05-15	2
\.


--
-- Name: answers_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.answers_answer_id_seq', 1, false);


--
-- Name: certificate_template_fields_field_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certificate_template_fields_field_id_seq', 1, false);


--
-- Name: certificate_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certificate_templates_template_id_seq', 1, false);


--
-- Name: certificates_certificate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certificates_certificate_id_seq', 1, false);


--
-- Name: common_schedule_items_common_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.common_schedule_items_common_item_id_seq', 21, true);


--
-- Name: document_imports_import_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_imports_import_id_seq', 1, false);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_event_id_seq', 3, true);


--
-- Name: location_places_location_place_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.location_places_location_place_id_seq', 15, true);


--
-- Name: locations_location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.locations_location_id_seq', 10, true);


--
-- Name: programs_program_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.programs_program_id_seq', 13, true);


--
-- Name: qr_codes_qr_code_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.qr_codes_qr_code_id_seq', 1, false);


--
-- Name: questionnaire_submissions_submission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questionnaire_submissions_submission_id_seq', 1, false);


--
-- Name: questionnaires_questionnaire_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questionnaires_questionnaire_id_seq', 1, false);


--
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questions_question_id_seq', 1, false);


--
-- Name: registrations_registration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.registrations_registration_id_seq', 1, false);


--
-- Name: reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_review_id_seq', 1, false);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 2, true);


--
-- Name: schedule_items_schedule_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schedule_items_schedule_item_id_seq', 42, true);


--
-- Name: sentiment_analyses_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sentiment_analyses_analysis_id_seq', 1, false);


--
-- Name: sentiment_classes_sentiment_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sentiment_classes_sentiment_class_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 2, true);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (answer_id);


--
-- Name: certificate_template_fields certificate_template_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_template_fields
    ADD CONSTRAINT certificate_template_fields_pkey PRIMARY KEY (field_id);


--
-- Name: certificate_templates certificate_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_pkey PRIMARY KEY (template_id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (certificate_id);


--
-- Name: common_schedule_items common_schedule_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.common_schedule_items
    ADD CONSTRAINT common_schedule_items_pkey PRIMARY KEY (common_item_id);


--
-- Name: document_imports document_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_imports
    ADD CONSTRAINT document_imports_pkey PRIMARY KEY (import_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: imported_events imported_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imported_events
    ADD CONSTRAINT imported_events_pkey PRIMARY KEY (import_id, event_id);


--
-- Name: location_places location_places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_places
    ADD CONSTRAINT location_places_pkey PRIMARY KEY (location_place_id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (location_id);


--
-- Name: program_schedule program_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_schedule
    ADD CONSTRAINT program_schedule_pkey PRIMARY KEY (program_id, schedule_item_id);


--
-- Name: program_selections program_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_selections
    ADD CONSTRAINT program_selections_pkey PRIMARY KEY (registration_id, program_id);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (program_id);


--
-- Name: qr_codes qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_pkey PRIMARY KEY (qr_code_id);


--
-- Name: qr_codes qr_codes_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_token_hash_key UNIQUE (token_hash);


--
-- Name: questionnaire_submissions questionnaire_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_submissions
    ADD CONSTRAINT questionnaire_submissions_pkey PRIMARY KEY (submission_id);


--
-- Name: questionnaires questionnaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaires
    ADD CONSTRAINT questionnaires_pkey PRIMARY KEY (questionnaire_id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (registration_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: schedule_items schedule_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_items
    ADD CONSTRAINT schedule_items_pkey PRIMARY KEY (schedule_item_id);


--
-- Name: sentiment_analyses sentiment_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_analyses
    ADD CONSTRAINT sentiment_analyses_pkey PRIMARY KEY (analysis_id);


--
-- Name: sentiment_classes sentiment_classes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_classes
    ADD CONSTRAINT sentiment_classes_code_key UNIQUE (code);


--
-- Name: sentiment_classes sentiment_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_classes
    ADD CONSTRAINT sentiment_classes_pkey PRIMARY KEY (sentiment_class_id);


--
-- Name: answers uq_answers_submission_question; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT uq_answers_submission_question UNIQUE (submission_id, question_id);


--
-- Name: certificate_templates uq_certificate_templates_event_kind; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT uq_certificate_templates_event_kind UNIQUE (event_id, kind);


--
-- Name: certificate_templates uq_certificate_templates_event_template; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT uq_certificate_templates_event_template UNIQUE (event_id, template_id);


--
-- Name: certificates uq_certificates_user_template; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT uq_certificates_user_template UNIQUE (user_id, template_id);


--
-- Name: registrations uq_registrations_user_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT uq_registrations_user_event UNIQUE (user_id, event_id);


--
-- Name: reviews uq_reviews_submission; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT uq_reviews_submission UNIQUE (submission_id);


--
-- Name: questionnaire_submissions uq_submissions_questionnaire_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_submissions
    ADD CONSTRAINT uq_submissions_questionnaire_user UNIQUE (questionnaire_id, user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_answers_question; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_answers_question ON public.answers USING btree (question_id);


--
-- Name: idx_certificate_template_fields_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_template_fields_template ON public.certificate_template_fields USING btree (template_id);


--
-- Name: idx_certificate_templates_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_templates_event ON public.certificate_templates USING btree (event_id);


--
-- Name: idx_certificate_templates_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificate_templates_kind ON public.certificate_templates USING btree (kind);


--
-- Name: idx_certificates_event_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificates_event_user ON public.certificates USING btree (event_id, user_id);


--
-- Name: idx_certificates_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificates_template ON public.certificates USING btree (template_id);


--
-- Name: idx_common_schedule_event_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_common_schedule_event_date ON public.common_schedule_items USING btree (event_id, item_date, start_time);


--
-- Name: idx_document_imports_extracted_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_imports_extracted_data ON public.document_imports USING gin (extracted_data);


--
-- Name: idx_document_imports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_imports_status ON public.document_imports USING btree (status);


--
-- Name: idx_document_imports_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_imports_uploaded_by ON public.document_imports USING btree (uploaded_by);


--
-- Name: idx_imported_events_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imported_events_event ON public.imported_events USING btree (event_id);


--
-- Name: idx_location_places_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_places_location ON public.location_places USING btree (location_id);


--
-- Name: idx_locations_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_name ON public.locations USING btree (name);


--
-- Name: idx_program_schedule_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_program_schedule_slot ON public.program_schedule USING btree (schedule_item_id);


--
-- Name: idx_program_selections_program; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_program_selections_program ON public.program_selections USING btree (program_id);


--
-- Name: idx_programs_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programs_event ON public.programs USING btree (event_id);


--
-- Name: idx_qr_codes_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_codes_event ON public.qr_codes USING btree (event_id);


--
-- Name: idx_questionnaires_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questionnaires_event ON public.questionnaires USING btree (event_id);


--
-- Name: idx_questions_questionnaire_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_questionnaire_order ON public.questions USING btree (questionnaire_id, sort_order);


--
-- Name: idx_registrations_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_event ON public.registrations USING btree (event_id);


--
-- Name: idx_schedule_items_dedup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_items_dedup ON public.schedule_items USING btree (item_date, start_time, end_time, name, location_place_id);


--
-- Name: idx_sentiment_analyses_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_analyses_class ON public.sentiment_analyses USING btree (sentiment_class_id);


--
-- Name: idx_submissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_user ON public.questionnaire_submissions USING btree (user_id);


--
-- Name: idx_users_names; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_names ON public.users USING btree (last_name, first_name);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- Name: uq_qr_one_active_per_event; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_qr_one_active_per_event ON public.qr_codes USING btree (event_id) WHERE (is_active = true);


--
-- Name: answers fk_answers_question; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: answers fk_answers_submission; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT fk_answers_submission FOREIGN KEY (submission_id) REFERENCES public.questionnaire_submissions(submission_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: certificate_template_fields fk_certificate_template_fields_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_template_fields
    ADD CONSTRAINT fk_certificate_template_fields_template FOREIGN KEY (template_id) REFERENCES public.certificate_templates(template_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: certificate_templates fk_certificate_templates_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT fk_certificate_templates_event FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: certificates fk_certificates_registration; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_certificates_registration FOREIGN KEY (user_id, event_id) REFERENCES public.registrations(user_id, event_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: certificates fk_certificates_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_certificates_template FOREIGN KEY (event_id, template_id) REFERENCES public.certificate_templates(event_id, template_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: common_schedule_items fk_common_schedule_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.common_schedule_items
    ADD CONSTRAINT fk_common_schedule_event FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON DELETE CASCADE;


--
-- Name: common_schedule_items fk_common_schedule_location; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.common_schedule_items
    ADD CONSTRAINT fk_common_schedule_location FOREIGN KEY (location_place_id) REFERENCES public.location_places(location_place_id) ON DELETE SET NULL;


--
-- Name: document_imports fk_document_imports_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_imports
    ADD CONSTRAINT fk_document_imports_user FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: events fk_events_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_user FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE RESTRICT;


--
-- Name: imported_events fk_imported_events_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imported_events
    ADD CONSTRAINT fk_imported_events_event FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: imported_events fk_imported_events_import; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imported_events
    ADD CONSTRAINT fk_imported_events_import FOREIGN KEY (import_id) REFERENCES public.document_imports(import_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: location_places fk_location_places_location; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_places
    ADD CONSTRAINT fk_location_places_location FOREIGN KEY (location_id) REFERENCES public.locations(location_id) ON DELETE RESTRICT;


--
-- Name: program_schedule fk_program_schedule_program; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_schedule
    ADD CONSTRAINT fk_program_schedule_program FOREIGN KEY (program_id) REFERENCES public.programs(program_id) ON DELETE CASCADE;


--
-- Name: program_schedule fk_program_schedule_slot; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_schedule
    ADD CONSTRAINT fk_program_schedule_slot FOREIGN KEY (schedule_item_id) REFERENCES public.schedule_items(schedule_item_id) ON DELETE CASCADE;


--
-- Name: program_selections fk_program_selections_program; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_selections
    ADD CONSTRAINT fk_program_selections_program FOREIGN KEY (program_id) REFERENCES public.programs(program_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: program_selections fk_program_selections_registration; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_selections
    ADD CONSTRAINT fk_program_selections_registration FOREIGN KEY (registration_id) REFERENCES public.registrations(registration_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: programs fk_programs_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT fk_programs_event FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON DELETE CASCADE;


--
-- Name: qr_codes fk_qr_codes_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT fk_qr_codes_event FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questionnaires fk_questionnaires_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaires
    ADD CONSTRAINT fk_questionnaires_event FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions fk_questions_questionnaire; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT fk_questions_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES public.questionnaires(questionnaire_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registrations fk_registrations_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: registrations fk_registrations_qr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT fk_registrations_qr FOREIGN KEY (qr_code_id) REFERENCES public.qr_codes(qr_code_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registrations fk_registrations_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews fk_reviews_submission; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_reviews_submission FOREIGN KEY (submission_id) REFERENCES public.questionnaire_submissions(submission_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_items fk_schedule_items_location; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_items
    ADD CONSTRAINT fk_schedule_items_location FOREIGN KEY (location_place_id) REFERENCES public.location_places(location_place_id) ON DELETE SET NULL;


--
-- Name: sentiment_analyses fk_sentiment_analyses_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_analyses
    ADD CONSTRAINT fk_sentiment_analyses_class FOREIGN KEY (sentiment_class_id) REFERENCES public.sentiment_classes(sentiment_class_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sentiment_analyses fk_sentiment_analyses_review; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_analyses
    ADD CONSTRAINT fk_sentiment_analyses_review FOREIGN KEY (review_id) REFERENCES public.reviews(review_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questionnaire_submissions fk_submissions_questionnaire; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_submissions
    ADD CONSTRAINT fk_submissions_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES public.questionnaires(questionnaire_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questionnaire_submissions fk_submissions_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_submissions
    ADD CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict BUkIF58x5azJYFemfBDdf6OfeR862TRcmVeBQDLQQ0v6fC7m9VyabzrxhhdCewy

