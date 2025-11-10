-- =====================================================
-- Auto-generate Class Code and PIN on Insert
-- =====================================================
-- This migration adds a trigger to automatically generate
-- class_code and join_pin when a new class is created

-- Function to generate random alphanumeric class code (6 chars)
create or replace function generate_class_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding confusing chars like 0, O, 1, I
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- Function to generate random 4-digit PIN
create or replace function generate_join_pin()
returns text
language plpgsql
as $$
begin
  return lpad(floor(random() * 10000)::text, 4, '0');
end;
$$;

-- Function to auto-populate class_code and join_pin
create or replace function auto_generate_class_credentials()
returns trigger
language plpgsql
as $$
declare
  max_attempts integer := 10;
  attempt integer := 0;
  new_code text;
  code_exists boolean;
begin
  -- Only generate if not already provided
  if new.class_code is null then
    loop
      -- Generate a new code
      new_code := generate_class_code();

      -- Check if code already exists
      select exists(select 1 from classes where class_code = new_code) into code_exists;

      if not code_exists then
        new.class_code := new_code;
        exit;
      end if;

      attempt := attempt + 1;
      if attempt >= max_attempts then
        raise exception 'Failed to generate unique class code after % attempts', max_attempts;
      end if;
    end loop;
  end if;

  -- Generate PIN if not provided
  if new.join_pin is null then
    new.join_pin := generate_join_pin();
  end if;

  return new;
end;
$$;

-- Create trigger to run before insert
drop trigger if exists trigger_auto_generate_class_credentials on classes;

create trigger trigger_auto_generate_class_credentials
  before insert on classes
  for each row
  execute function auto_generate_class_credentials();

-- Add comment
comment on function auto_generate_class_credentials() is
  'Automatically generates unique class_code and join_pin for new classes';
