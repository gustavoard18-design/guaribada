-- ============================================================
--  Guaribada Lava-Jato — Schema Supabase
--  Execute no SQL Editor do painel do Supabase
-- ============================================================

-- 1. Extensão UUID (já ativa por padrão, mas por segurança)
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (estende auth.users)
-- ============================================================
create table public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  name      text not null default '',
  email     text,
  phone     text,
  role      text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz default now()
);

-- Trigger: cria perfil automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SERVICES
-- ============================================================
create table public.services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price > 0),
  duration    integer not null check (duration > 0),
  icon        text default '🚗',
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references public.profiles(id) on delete set null,
  guest_name    text,
  guest_phone   text,
  service_id    uuid not null references public.services(id),
  date          timestamptz not null,
  status        text not null default 'pending'
                  check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  vehicle_plate text,
  vehicle_model text,
  vehicle_color text,
  notes         text,
  total_price   numeric(10,2),
  created_at    timestamptz default now()
);

create index idx_bookings_date_status on public.bookings(date, status);

-- ============================================================
-- RLS (Row Level Security)
-- O backend usa a service role key, que ignora RLS.
-- As políticas abaixo protegem acesso direto pelo anon key.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.services  enable row level security;
alter table public.bookings  enable row level security;

create policy "Profiles: acesso pelo service role" on public.profiles using (true);
create policy "Services: leitura pública"          on public.services for select using (true);
create policy "Bookings: acesso pelo service role" on public.bookings using (true);

-- ============================================================
-- Para tornar um usuário admin:
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'seu@email.com';
-- ============================================================
