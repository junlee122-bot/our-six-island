-- Provisioning is complete. The public Auth function no longer contains a
-- bootstrap handler; remove its one-time service-only database helpers too.
drop function public.hh_setup(text);
drop table hohyeon.secrets;
