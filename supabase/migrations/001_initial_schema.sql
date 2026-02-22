-- ============================================
-- Talk Reminder: 초기 스키마
-- ============================================

-- UUID 확장
create extension if not exists "uuid-ossp";

-- ============================================
-- NextAuth.js 필수 테이블
-- (Auth.js Supabase adapter가 요구하는 구조)
-- ============================================

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique not null,
  "emailVerified" timestamptz,
  image text,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  unique(provider, "providerAccountId")
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  "sessionToken" text unique not null,
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text unique not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- ============================================
-- 도메인 테이블
-- ============================================

create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  message_body text,
  template_id uuid,
  cron_expression text not null,
  timezone text not null default 'Asia/Seoul',
  is_active boolean not null default true,
  next_send_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists channel_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  channel_type text not null check (channel_type in ('slack', 'kakao')),
  access_token text not null,
  refresh_token text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, channel_type)
);

create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- reminders.template_id FK (templates 테이블 생성 후)
alter table reminders
  add constraint fk_reminders_template
  foreign key (template_id) references templates(id) on delete set null;

create table if not exists reminder_logs (
  id uuid primary key default uuid_generate_v4(),
  reminder_id uuid not null references reminders(id) on delete cascade,
  channel_type text not null check (channel_type in ('slack', 'kakao')),
  status text not null check (status in ('success', 'failure')),
  sent_at timestamptz not null default now(),
  error_message text
);

-- ============================================
-- RLS 정책
-- ============================================

alter table users enable row level security;
alter table reminders enable row level security;
alter table channel_connections enable row level security;
alter table templates enable row level security;
alter table reminder_logs enable row level security;

-- users: 본인 데이터만 조회/수정
create policy "Users can view own data" on users
  for select using (auth.uid() = id);
create policy "Users can update own data" on users
  for update using (auth.uid() = id);

-- reminders: 본인 데이터만 CRUD
create policy "Users can manage own reminders" on reminders
  for all using (auth.uid() = user_id);

-- channel_connections: 본인 데이터만 CRUD
create policy "Users can manage own connections" on channel_connections
  for all using (auth.uid() = user_id);

-- templates: 본인 데이터만 CRUD
create policy "Users can manage own templates" on templates
  for all using (auth.uid() = user_id);

-- reminder_logs: 본인 알람 로그만 조회
create policy "Users can view own logs" on reminder_logs
  for select using (
    reminder_id in (select id from reminders where user_id = auth.uid())
  );

-- ============================================
-- 인덱스
-- ============================================

create index idx_reminders_user_id on reminders(user_id);
create index idx_reminders_next_send_at on reminders(next_send_at) where is_active = true;
create index idx_channel_connections_user_id on channel_connections(user_id);
create index idx_templates_user_id on templates(user_id);
create index idx_reminder_logs_reminder_id on reminder_logs(reminder_id);
create index idx_reminder_logs_sent_at on reminder_logs(sent_at);
