create type public.app_role as enum ('owner', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create policy "View own or owner views all profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'owner'));
create policy "Update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "View own roles or owner views all" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'owner'));
create policy "Owner grants roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'owner'));
create policy "Owner revokes roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'owner') and user_id <> auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(new.email, ''));
  if not exists (select 1 from public.user_roles where role = 'owner') then
    insert into public.user_roles (user_id, role) values (new.id, 'owner');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text not null default '',
  service_type text not null default 'other',
  payment_method text not null default 'cash' check (payment_method in ('cash','mpesa')),
  quantity integer not null default 1 check (quantity >= 1),
  amount numeric(12,2) not null check (amount > 0),
  mpesa_code text not null default '',
  date date not null default current_date,
  time text not null default '12:00',
  notes text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create index transactions_date_idx on public.transactions (date desc, time desc);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;

create policy "Members view transactions" on public.transactions for select to authenticated
  using (public.is_member(auth.uid()));
create policy "Members record transactions" on public.transactions for insert to authenticated
  with check (public.is_member(auth.uid()) and created_by = auth.uid());
create policy "Owner edits transactions" on public.transactions for update to authenticated
  using (public.has_role(auth.uid(), 'owner'));
create policy "Owner deletes transactions" on public.transactions for delete to authenticated
  using (public.has_role(auth.uid(), 'owner'));