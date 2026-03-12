-- AI Content Factory: Initial Schema
-- Run this in Supabase SQL Editor

-- 1. profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  template TEXT NOT NULL CHECK (template IN ('motivation', 'informative', 'quotes', 'horror', 'health')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. project_steps
CREATE TABLE IF NOT EXISTS project_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  step TEXT NOT NULL CHECK (step IN ('script', 'scenes', 'images', 'tts', 'video', 'metadata')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, step)
);

-- 4. credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'admin_adjust', 'refund')),
  reference_id TEXT,
  reference_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lemon_squeezy_order_id TEXT UNIQUE,
  lemon_squeezy_variant_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  credits_granted INTEGER,
  amount_cents INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. generation_logs
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  provider TEXT,
  input_summary TEXT,
  error_message TEXT,
  credits_used INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- profiles: user reads/updates own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- projects: user CRUD own
CREATE POLICY "projects_all_own" ON projects FOR ALL USING (auth.uid() = user_id);

-- project_steps: via projects
CREATE POLICY "project_steps_select" ON project_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_steps.project_id AND p.user_id = auth.uid()));
CREATE POLICY "project_steps_insert" ON project_steps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_steps.project_id AND p.user_id = auth.uid()));
CREATE POLICY "project_steps_update" ON project_steps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_steps.project_id AND p.user_id = auth.uid()));

-- credit_transactions: user reads own
CREATE POLICY "credit_transactions_select_own" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- orders: user reads own
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);

-- generation_logs: admin only (service role inserts)
CREATE POLICY "generation_logs_select_admin" ON generation_logs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
