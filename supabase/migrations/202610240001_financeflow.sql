-- FinanceFlow: tenant-scoped reads, server-only controlled writes.
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, email text not null, created_at timestamptz not null default now());
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,email) values(new.id,lower(new.email)) on conflict(id) do update set email=excluded.email; return new; end $$;
create trigger on_auth_user_created after insert or update of email on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id,email) select id,lower(email) from auth.users where email is not null on conflict do nothing;
create table public.workspaces (id uuid primary key default gen_random_uuid(), name text not null, owner_id uuid not null references auth.users(id), created_at timestamptz not null default now());
create table public.workspace_members (workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, email text not null, roles text[] not null default '{}', is_admin boolean not null default false, primary key(workspace_id,user_id));
create function public.is_workspace_member(ws uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.workspace_members where workspace_id=ws and user_id=auth.uid()) $$;
create function public.is_workspace_admin(ws uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.workspace_members where workspace_id=ws and user_id=auth.uid() and is_admin) $$;
create table public.workflow_templates (id uuid primary key, workspace_id uuid not null references public.workspaces(id), definition jsonb not null, created_by uuid not null references auth.users(id), updated_at timestamptz not null default now());
create table public.workflow_stages (template_id uuid not null references public.workflow_templates(id) on delete cascade, workspace_id uuid not null references public.workspaces(id), stage_id text not null, position integer not null, definition jsonb not null, primary key(template_id,stage_id));
create table public.workflow_instances (id uuid primary key, workspace_id uuid not null references public.workspaces(id), template_id uuid not null references public.workflow_templates(id), state jsonb not null, version integer not null default 0, created_by uuid not null references auth.users(id), updated_at timestamptz not null default now());
create table public.stage_executions (instance_id uuid not null references public.workflow_instances(id) on delete cascade, workspace_id uuid not null references public.workspaces(id), stage_id text not null, execution jsonb not null, primary key(instance_id,stage_id));
create table public.documents (id uuid primary key, workspace_id uuid not null references public.workspaces(id), instance_id uuid not null references public.workflow_instances(id) on delete cascade, stage_id text not null, storage_path text, payload jsonb not null);
create table public.activity_logs (id uuid primary key, workspace_id uuid not null references public.workspaces(id), instance_id uuid references public.workflow_instances(id) on delete cascade, actor_id uuid references auth.users(id), request_id uuid not null, event jsonb not null, created_at timestamptz not null default now(), unique(instance_id,request_id));
create table public.approvals (id uuid primary key references public.activity_logs(id), workspace_id uuid not null references public.workspaces(id), instance_id uuid not null references public.workflow_instances(id), stage_id text not null, decision text not null, actor_id uuid not null references auth.users(id), comment text not null, created_at timestamptz not null default now());
create table public.ai_action_proposals (id uuid primary key, workspace_id uuid not null references public.workspaces(id), instance_id uuid not null references public.workflow_instances(id), proposed_by uuid not null references auth.users(id), based_on_version integer not null, status text not null default 'pending' check(status in ('pending','applied')), proposal jsonb not null, created_at timestamptz not null default now());
create table public.ai_messages (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), instance_id uuid not null references public.workflow_instances(id), user_id uuid not null references auth.users(id), question text not null, response jsonb not null, created_at timestamptz not null default now());
create table public.workspace_invitations (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), email text not null, roles text[] not null, token_hash text unique not null, expires_at timestamptz not null, accepted_at timestamptz, created_by uuid not null references auth.users(id));
create table public.api_usage (user_id uuid not null references auth.users(id), minute_bucket timestamptz not null, calls integer not null default 0, primary key(user_id,minute_bucket));

alter table public.profiles enable row level security;
create policy profiles_own on public.profiles for select to authenticated using(id=auth.uid());
alter table public.workspaces enable row level security;
create policy workspace_read on public.workspaces for select to authenticated using(public.is_workspace_member(id));
do $$ declare t text; begin foreach t in array array['workspace_members','workflow_templates','workflow_stages','workflow_instances','stage_executions','documents','activity_logs','approvals','ai_action_proposals','ai_messages'] loop execute format('alter table public.%I enable row level security',t); execute format('create policy tenant_read on public.%I for select to authenticated using(public.is_workspace_member(workspace_id))',t); end loop; end $$;
alter table public.workspace_invitations enable row level security;
alter table public.api_usage enable row level security;
-- No client write policies. All mutations go through authenticated Next.js handlers and the engine.
revoke all on public.profiles,public.workspaces,public.workspace_members,public.workflow_templates,public.workflow_stages,public.workflow_instances,public.stage_executions,public.documents,public.activity_logs,public.approvals,public.ai_action_proposals,public.ai_messages,public.workspace_invitations,public.api_usage from anon, authenticated;
grant select on public.profiles,public.workspaces,public.workspace_members,public.workflow_templates,public.workflow_stages,public.workflow_instances,public.stage_executions,public.documents,public.activity_logs,public.approvals,public.ai_action_proposals,public.ai_messages to authenticated;
grant all on public.profiles,public.workspaces,public.workspace_members,public.workflow_templates,public.workflow_stages,public.workflow_instances,public.stage_executions,public.documents,public.activity_logs,public.approvals,public.ai_action_proposals,public.ai_messages,public.workspace_invitations,public.api_usage to service_role;

create function public.create_workspace(p_name text,p_user uuid,p_email text,p_roles text[]) returns uuid language plpgsql security definer set search_path=public as $$ declare ws uuid; begin insert into workspaces(name,owner_id) values(p_name,p_user) returning id into ws; insert into workspace_members values(ws,p_user,p_email,p_roles,true); return ws; end $$;
create function public.save_workflow_template(p_workspace uuid,p_user uuid,p_definition jsonb) returns void language plpgsql security definer set search_path=public as $$ declare s jsonb; pos int:=0; tid uuid:=(p_definition->>'id')::uuid; begin
 if not exists(select 1 from workspace_members where workspace_id=p_workspace and user_id=p_user and is_admin) then raise exception 'Administrator required'; end if;
 if exists(select 1 from workflow_templates where id=tid and workspace_id<>p_workspace) then raise exception 'Workspace mismatch'; end if;
 insert into workflow_templates(id,workspace_id,definition,created_by) values(tid,p_workspace,p_definition,p_user) on conflict(id) do update set definition=excluded.definition,updated_at=now();
 delete from workflow_stages where template_id=tid;
 for s in select value from jsonb_array_elements(p_definition->'stages') loop insert into workflow_stages values(tid,p_workspace,s->>'id',pos,s);pos:=pos+1;end loop;
 insert into activity_logs(id,workspace_id,actor_id,request_id,event) values(gen_random_uuid(),p_workspace,p_user,gen_random_uuid(),jsonb_build_object('action','save_template','templateId',tid));
end $$;
create function public.persist_workflow(p_state jsonb,p_expected integer,p_actor uuid,p_request uuid,p_proposal uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare existing workflow_instances%rowtype; wid uuid:=(p_state->>'workspaceId')::uuid; iid uuid:=(p_state->>'id')::uuid; item jsonb; begin
 if not exists(select 1 from workspace_members where workspace_id=wid and user_id=p_actor) then raise exception 'Membership required'; end if;
 if p_expected=-1 then
  select * into existing from workflow_instances where id=iid for update;
  if found then if existing.workspace_id=wid and existing.created_by=p_actor then return existing.state;else raise exception 'Workflow identity conflict';end if;end if;
  if not exists(select 1 from workflow_templates where id=(p_state->'template'->>'id')::uuid and workspace_id=wid) then raise exception 'Template workspace mismatch';end if;
  insert into workflow_instances values(iid,wid,(p_state->'template'->>'id')::uuid,p_state,0,p_actor,now());
 else
  select * into existing from workflow_instances where id=iid for update;
  if not found or existing.workspace_id<>wid then raise exception 'Workflow not found';end if;
  if exists(select 1 from activity_logs where instance_id=iid and request_id=p_request) then return existing.state;end if;
  if existing.version<>p_expected or (p_state->>'version')::int<>p_expected+1 then raise exception 'VERSION_CONFLICT';end if;
  if p_proposal is not null then
   perform 1 from ai_action_proposals where id=p_proposal and instance_id=iid and workspace_id=wid and status='pending' and based_on_version=p_expected for update;
   if not found then raise exception 'Proposal expired or already applied';end if;
   update ai_action_proposals set status='applied' where id=p_proposal;
  end if;
  update workflow_instances set state=p_state,version=(p_state->>'version')::int,updated_at=now() where id=iid;
 end if;
 for item in select value from jsonb_array_elements(p_state->'executions') loop insert into stage_executions values(iid,wid,item->>'stageId',item) on conflict(instance_id,stage_id) do update set execution=excluded.execution;end loop;
 for item in select value from jsonb_array_elements(p_state->'documents') loop
  if exists(select 1 from documents where id=(item->>'id')::uuid and (workspace_id<>wid or instance_id<>iid)) then raise exception 'Document workspace mismatch';end if;
  insert into documents values((item->>'id')::uuid,wid,iid,item->>'stageId',item->>'storagePath',item) on conflict(id) do update set payload=excluded.payload;
 end loop;
 for item in select value from jsonb_array_elements(p_state->'history') loop
  insert into activity_logs(id,workspace_id,instance_id,actor_id,request_id,event,created_at) values((item->>'id')::uuid,wid,iid,(item->>'actorId')::uuid,(item->>'requestId')::uuid,item,(item->>'at')::timestamptz) on conflict(instance_id,request_id) do nothing;
  if item->>'action' in ('approve','reject','request_changes') then insert into approvals values((item->>'id')::uuid,wid,iid,item->>'stageId',item->>'action',(item->>'actorId')::uuid,item->>'comment',(item->>'at')::timestamptz) on conflict(id) do nothing;end if;
 end loop;
 return p_state;
end $$;
create function public.accept_invitation(p_hash text,p_user uuid,p_email text) returns uuid language plpgsql security definer set search_path=public as $$ declare inv workspace_invitations%rowtype; begin
 select * into inv from workspace_invitations where token_hash=p_hash for update;
 if not found or inv.accepted_at is not null or inv.expires_at<now() or lower(inv.email)<>lower(p_email) then raise exception 'Invitation is invalid, expired, or for a different email';end if;
 insert into workspace_members values(inv.workspace_id,p_user,p_email,inv.roles,false) on conflict(workspace_id,user_id) do nothing;
 update workspace_invitations set accepted_at=now() where id=inv.id;
 return inv.workspace_id;
end $$;
create function public.consume_ai_quota(p_user uuid) returns boolean language plpgsql security definer set search_path=public as $$ declare used int; begin insert into api_usage values(p_user,date_trunc('minute',now()),1) on conflict(user_id,minute_bucket) do update set calls=api_usage.calls+1 returning calls into used;return used<=12;end $$;
revoke execute on function public.handle_new_user(),public.is_workspace_member(uuid),public.is_workspace_admin(uuid),public.create_workspace(text,uuid,text,text[]),public.save_workflow_template(uuid,uuid,jsonb),public.persist_workflow(jsonb,integer,uuid,uuid,uuid),public.accept_invitation(text,uuid,text),public.consume_ai_quota(uuid) from public,anon,authenticated;
grant execute on function public.is_workspace_member(uuid), public.is_workspace_admin(uuid) to authenticated;
grant execute on function public.is_workspace_member(uuid),public.is_workspace_admin(uuid),public.create_workspace(text,uuid,text,text[]),public.save_workflow_template(uuid,uuid,jsonb),public.persist_workflow(jsonb,integer,uuid,uuid,uuid),public.accept_invitation(text,uuid,text),public.consume_ai_quota(uuid) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('financeflow-documents','financeflow-documents',false,4194304,array['application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) on conflict(id) do nothing;
-- Storage is served via short-lived signed URLs after membership checks. No anonymous access.
create policy financeflow_private_read on storage.objects for select to authenticated using(bucket_id='financeflow-documents' and exists(select 1 from public.documents d where d.storage_path=name and public.is_workspace_member(d.workspace_id)));
create index workflow_workspace on public.workflow_instances(workspace_id,updated_at desc);
create index documents_workflow on public.documents(instance_id);
create index audit_workflow on public.activity_logs(instance_id,created_at);
