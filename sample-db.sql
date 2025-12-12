-- Create a table for the tasks
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own items
CREATE POLICY "Users can see their own items" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to create their own items
CREATE POLICY "Users can create their own items" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own items
CREATE POLICY "Users can update their own items" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own items
CREATE POLICY "Users can delete their own items" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Products table
create table products (
  id bigserial primary key,
  name text not null,
  type text,
  description text,
  price numeric(10,2) not null,
  quantity integer not null default 0,
  image text,
  created_at timestamp with time zone default now()
);

-- Tarot availability table
create table tarot_availability (
  id bigserial primary key,
  date date not null,
  time text not null,
  mode text not null check (mode in ('online', 'in-person')),
  created_at timestamp with time zone default now()
);

-- Reiki availability table
create table reiki_availability (
  id bigserial primary key,
  date date not null,
  time text not null,
  created_at timestamp with time zone default now()
);