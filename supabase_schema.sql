-- BarberApp — Schema Supabase
-- Execute no SQL Editor do Supabase (projeto > SQL Editor > New query)

-- 1. Convites (controla quem é barbeiro)
create table if not exists convites (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- 2. Barbearias (uma por barbeiro)
create table if not exists barbearias (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  nome text,
  endereco text,
  telefone text,
  slug text unique,
  created_at timestamptz default now()
);

-- 3. Serviços
create table if not exists servicos (
  id uuid default gen_random_uuid() primary key,
  barbearia_id uuid references barbearias(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null,
  duracao_minutos int not null,
  created_at timestamptz default now()
);

-- 4. Agendamentos
create table if not exists agendamentos (
  id uuid default gen_random_uuid() primary key,
  barbearia_id uuid references barbearias(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  servico_id uuid references servicos(id) on delete set null,
  nome_cliente text,
  data_hora timestamptz not null,
  status text default 'pendente' check (status in ('pendente','confirmado','cancelado')),
  created_at timestamptz default now()
);

-- 5. Horários bloqueados
create table if not exists horarios_bloqueados (
  id uuid default gen_random_uuid() primary key,
  barbearia_id uuid references barbearias(id) on delete cascade,
  data_hora_inicio timestamptz not null,
  data_hora_fim timestamptz not null,
  motivo text default 'Horário bloqueado',
  created_at timestamptz default now()
);

-- ── RLS (Row Level Security) ──
-- Habilita segurança por linha em todas as tabelas
alter table convites           enable row level security;
alter table barbearias         enable row level security;
alter table servicos           enable row level security;
alter table agendamentos       enable row level security;
alter table horarios_bloqueados enable row level security;

-- Convites: apenas leitura autenticada
create policy "Leitura autenticada" on convites
  for select using (auth.role() = 'authenticated');

-- Barbearias: dono lê e edita a sua; clientes leem todas
create policy "Barbeiro gerencia sua barbearia" on barbearias
  for all using (auth.uid() = owner_id);
create policy "Clientes leem barbearias" on barbearias
  for select using (auth.role() = 'authenticated');

-- Serviços: barbeiro gerencia os seus; clientes leem
create policy "Barbeiro gerencia servicos" on servicos
  for all using (
    exists (select 1 from barbearias b where b.id = barbearia_id and b.owner_id = auth.uid())
  );
create policy "Clientes leem servicos" on servicos
  for select using (auth.role() = 'authenticated');

-- Agendamentos: cliente cria e lê os seus; barbeiro lê e atualiza os da sua barbearia
create policy "Cliente cria agendamento" on agendamentos
  for insert with check (auth.uid() = user_id);
create policy "Cliente le seus agendamentos" on agendamentos
  for select using (auth.uid() = user_id);
create policy "Barbeiro le agendamentos da barbearia" on agendamentos
  for select using (
    exists (select 1 from barbearias b where b.id = barbearia_id and b.owner_id = auth.uid())
  );
create policy "Barbeiro atualiza agendamentos" on agendamentos
  for update using (
    exists (select 1 from barbearias b where b.id = barbearia_id and b.owner_id = auth.uid())
  );

-- Horários bloqueados: barbeiro gerencia os seus; clientes leem
create policy "Barbeiro gerencia bloqueios" on horarios_bloqueados
  for all using (
    exists (select 1 from barbearias b where b.id = barbearia_id and b.owner_id = auth.uid())
  );
create policy "Clientes leem bloqueios" on horarios_bloqueados
  for select using (auth.role() = 'authenticated');

-- ── Inserir primeiro barbeiro (exemplo) ──
-- Troque pelo e-mail real do barbeiro
-- insert into convites (email) values ('seuemail@exemplo.com');
