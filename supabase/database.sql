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

-- =========================================================
-- ADMIN HELPER (CRITICAL: PREVENTS RLS RECURSION)
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- =========================================================
-- ENABLE RLS ON ALL TABLES
-- =========================================================
alter table public.profiles enable row level security;
alter table public.availability enable row level security;
alter table public.booking_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.events enable row level security;

-- =========================================================
-- PROFILES
-- Users manage own profile; admins manage all
-- =========================================================
drop policy if exists "users or admin can manage profiles" on public.profiles;

create policy "users or admin can manage profiles"
on public.profiles
for all
using (
  auth.uid() = id
  or public.is_admin()
)
with check (
  auth.uid() = id
  or public.is_admin()
);

-- =========================================================
-- AVAILABILITY
-- Public read; authenticated full CRUD
-- =========================================================
drop policy if exists "public can read availability" on public.availability;
drop policy if exists "authenticated full access" on public.availability;

create policy "public can read availability"
on public.availability
for select
using (true);

create policy "authenticated full access"
on public.availability
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

-- =========================================================
-- BOOKING_SLOTS
-- Owned via bookings; admins manage all
-- =========================================================
drop policy if exists "users or admin can manage booking_slots" on public.booking_slots;

create policy "users or admin can manage booking_slots"
on public.booking_slots
for all
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_slots.booking_id
      and (
        b.user_id = auth.uid()
        or public.is_admin()
      )
  )
)
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_slots.booking_id
      and (
        b.user_id = auth.uid()
        or public.is_admin()
      )
  )
);

-- =========================================================
-- BOOKINGS
-- Users manage own; admins manage all
-- =========================================================
drop policy if exists "users or admin can manage bookings" on public.bookings;

create policy "users or admin can manage bookings"
on public.bookings
for all
using (
  auth.uid() = user_id
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or public.is_admin()
);

-- =========================================================
-- PRODUCTS
-- Public read; authenticated full CRUD
-- =========================================================
drop policy if exists "public can read products" on public.products;
drop policy if exists "authenticated full access" on public.products;

create policy "public can read products"
on public.products
for select
using (true);

create policy "authenticated full access"
on public.products
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);

-- =========================================================
-- ORDERS
-- Users manage own; admins manage all
-- =========================================================
drop policy if exists "users or admin can manage orders" on public.orders;

create policy "users or admin can manage orders"
on public.orders
for all
using (
  auth.uid() = user_id
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or public.is_admin()
);

-- =========================================================
-- EVENTS
-- Public read; authenticated full CRUD
-- =========================================================
drop policy if exists "public can read events" on public.events;
drop policy if exists "authenticated full access" on public.events;

create policy "public can read events"
on public.events
for select
using (true);

create policy "authenticated full access"
on public.events
for all
using (auth.uid() is not null)
with check (auth.uid() is not null);
