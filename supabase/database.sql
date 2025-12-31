-- profiles table
create table public.profiles (
  id uuid not null,
  name text not null,
  birth_month text not null,
  over_18 boolean not null,
  phone text not null,
  contact_method text not null,
  created_at timestamp with time zone null default now(),
  role text null default 'user'::text,
  email text not null default ''::text,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- availability table
create table public.availability (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  service_type text null,
  available_from timestamp with time zone not null,
  available_to timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  constraint availability_pkey primary key (id),
  constraint availability_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint availability_service_type_check check (
    (
      (service_type is null)
      or (
        service_type = any (
          array[
            'tarot'::text,
            'reiki'::text,
            'consultation'::text
          ]
        )
      )
    )
  )
) TABLESPACE pg_default;

-- booking_slots table
create table public.booking_slots (
  booking_id uuid not null,
  availability_id uuid not null,
  constraint booking_slots_pkey primary key (booking_id, availability_id),
  constraint booking_slots_availability_id_fkey foreign KEY (availability_id) references availability (id) on delete CASCADE,
  constraint booking_slots_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE
) TABLESPACE pg_default;

-- bookings table
create table public.bookings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  service_type text null,
  booked_at timestamp with time zone null default now(),
  marked_read boolean not null default false,
  constraint bookings_pkey primary key (id),
  constraint bookings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint bookings_service_type_check check (
    (
      service_type = any (
        array[
          'tarot'::text,
          'reiki'::text,
          'combo'::text,
          'consultation'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- products table
create table public.products (
  id bigserial not null,
  name text not null,
  type text null,
  description text null,
  price numeric(10, 2) not null,
  quantity integer not null default 0,
  image text null,
  created_at timestamp with time zone null default now(),
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;

-- orders table
create table public.orders (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  status text not null default 'pending'::text,
  amount numeric not null,
  items jsonb not null,
  stripe_session_id text null,
  shipping_address jsonb null,
  created_at timestamp with time zone null default now(),
  customer_name text null,
  customer_phone text null,
  marked_read boolean not null default false,
  constraint orders_pkey primary key (id),
  constraint orders_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

-- events table
create table public.events (
  id uuid not null,
  title text not null,
  description text not null,
  start_date timestamp with time zone not null,
  image text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  location text null,
  address text null,
  end_date timestamp with time zone null,
  constraint events_pkey primary key (id)
) TABLESPACE pg_default;

-- =====================================================
-- 1) PROFILES (identity protection)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles owner only" ON public.profiles;
CREATE POLICY "profiles owner only"
ON public.profiles
FOR ALL
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- =====================================================
-- 2) ORDERS (money protection)
-- =====================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders owner only" ON public.orders;
CREATE POLICY "orders owner only"
ON public.orders
FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 3) BOOKINGS (core business logic)
-- =====================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings owner only" ON public.bookings;
CREATE POLICY "bookings owner only"
ON public.bookings
FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 4) BOOKING_SLOTS (integrity protection)
-- =====================================================
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking slots via booking owner" ON public.booking_slots;
CREATE POLICY "booking slots via booking owner"
ON public.booking_slots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_id
      AND b.user_id = (SELECT auth.uid())
  )
);

-- =====================================================
-- 5) AVAILABILITY (schedule abuse prevention)
-- =====================================================
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability owner only" ON public.availability;
CREATE POLICY "availability owner only"
ON public.availability
FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- PRODUCTS (public read, server-only writes)
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products public read" ON public.products;
CREATE POLICY "products public read"
ON public.products
FOR SELECT
TO PUBLIC
USING (true);

-- =====================================================
-- EVENTS (public read, server-only writes)
-- =====================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events public read" ON public.events;
CREATE POLICY "events public read"
ON public.events
FOR SELECT
TO PUBLIC
USING (true);
-- =====================================================