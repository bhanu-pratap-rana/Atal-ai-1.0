-- Add columns for class code and join PIN
alter table classes add column if not exists class_code text unique;
alter table classes add column if not exists join_pin text;

-- Create index for faster lookups
create index if not exists idx_classes_class_code on classes(class_code);

-- Backfill simple codes for existing classes
update classes 
set 
  class_code = upper(substring(md5(id::text) for 6)),
  join_pin = substring(md5(teacher_id::text || id::text) for 4)
where class_code is null;;
