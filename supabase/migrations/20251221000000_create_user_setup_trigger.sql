-- Migration: Create trigger for automatic user profile and default catalogs setup
-- Purpose: Automatically create user profile and 4 predefined GOT catalogs when new user registers
-- Triggered: After insert on auth.users
-- Special considerations: This ensures US-001 requirements are met (profile + catalogs created on registration)

-- Create function to set up new user profile and default catalogs
create or replace function pathly.handle_new_user()
returns trigger as $$
declare
  v_catalog_id uuid;
begin
  -- Insert user profile with default preferences
  insert into pathly.profiles (id, language, theme, created_at)
  values (new.id, 'pl', 'system', now());

  -- Create 4 predefined GOT catalogs for the new user
  -- 1. Popularna (Popular)
  insert into pathly.catalogs (user_id, name, is_predefined, created_at, updated_at)
  values (new.id, 'Popularna', true, now(), now())
  returning id into v_catalog_id;

  -- 2. Mała Brązowa (Small Bronze)
  insert into pathly.catalogs (user_id, name, is_predefined, created_at, updated_at)
  values (new.id, 'Mała Brązowa', true, now(), now());

  -- 3. Mała Srebrna (Small Silver)
  insert into pathly.catalogs (user_id, name, is_predefined, created_at, updated_at)
  values (new.id, 'Mała Srebrna', true, now(), now());

  -- 4. Mała Złota (Small Gold)
  insert into pathly.catalogs (user_id, name, is_predefined, created_at, updated_at)
  values (new.id, 'Mała Złota', true, now(), now());

  -- Log analytics event for account creation
  insert into pathly.analytics_events (user_id, event_type, created_at)
  values (new.id, 'account_created', now());

  return new;
exception
  when others then
    -- Log error but don't prevent user creation
    raise warning 'Error in handle_new_user trigger: %', sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger that fires after user is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function pathly.handle_new_user();

-- Grant necessary permissions for the trigger function to work
grant usage on schema pathly to postgres, anon, authenticated, service_role;
grant all on all tables in schema pathly to postgres, anon, authenticated, service_role;
grant all on all sequences in schema pathly to postgres, anon, authenticated, service_role;
grant all on all routines in schema pathly to postgres, anon, authenticated, service_role;

