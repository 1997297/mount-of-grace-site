-- =====================================================================
--  MOUNT OF GRACE OUTREACH — SUPABASE NOTES
--  Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================
--
--  READ THIS FIRST
--  ---------------
--  Your database was NOT the problem. Row Level Security is configured
--  correctly and anonymous INSERT already works on all three tables.
--  The forms were broken in the website's own code:
--
--    1. contact.html    wrote to  "contact_messages"
--                       real table: "Contact_Messages"   (capitalised)
--
--    2. sponsorship.html wrote to  "sponsorship_submissions"
--                       real table: "sponsorship_submission"  (SINGULAR)
--
--       Both returned PostgREST error PGRST205 ("Could not find the table
--       in the schema cache") and nothing was ever saved.
--
--    3. involved.html   used the right table name, but a second submit
--                       handler ran first and called form.reset(), wiping
--                       every field before the values were read. Blank
--                       rows went in instead of real ones.
--
--  All three are fixed in the site code. Section 1 below is the only part
--  you may want to run; the rest is reference and cleanup.
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. CLEAN UP TEST ROWS   <-- the one thing worth running
-- ---------------------------------------------------------------------
--  Verifying the fix meant submitting the real forms against the live
--  database, so a handful of test rows were written. They are listed here
--  so you can see and remove them. Run the SELECTs first if you want to
--  eyeball them before deleting.

select id, created_at, name, email, subject
from public."Contact_Messages"
where name in ('ZZ_AUTOMATED_TEST', 'Test Person', 'PROBE', 'PROBE2', 'ZZ_CURL_NOREP')
order by created_at;

select id, created_at, name, email
from public.interest_submissions
where name in ('ZZ_AUTOMATED_TEST', 'Test Person')
order by created_at;

select id, created_at, name, email
from public.sponsorship_submission
where name in ('ZZ_AUTOMATED_TEST', 'Test Org')
order by created_at;

-- Then delete them:
delete from public."Contact_Messages"
 where name in ('ZZ_AUTOMATED_TEST', 'Test Person', 'PROBE', 'PROBE2', 'ZZ_CURL_NOREP');

delete from public.interest_submissions
 where name in ('ZZ_AUTOMATED_TEST', 'Test Person');

delete from public.sponsorship_submission
 where name in ('ZZ_AUTOMATED_TEST', 'Test Org');

-- The interest form also wrote BLANK rows for as long as the reset() bug
-- was live. Review and remove them if you see any:
select id, created_at from public.interest_submissions
 where coalesce(name, '') = '' and coalesce(email, '') = '';

-- delete from public.interest_submissions
--  where coalesce(name,'') = '' and coalesce(email,'') = '';


-- ---------------------------------------------------------------------
--  2. REFERENCE — how the tables are actually named and shaped
-- ---------------------------------------------------------------------
--  "Contact_Messages"        id, created_at, inquiry_type, name, email,
--                            subject, message
--  interest_submissions      id, created_at, name, email,
--                            area_of_interest, about_you
--  sponsorship_submission    id, created_at, name, email,
--                            project_interest, additional_info
--
--  The site now writes to exactly these names and columns.


-- ---------------------------------------------------------------------
--  3. REFERENCE — current policy behaviour (no action needed)
-- ---------------------------------------------------------------------
--  INSERT : allowed for anon. This is what the website needs. Working.
--  SELECT : anon can call the endpoint but sees zero rows. This is good —
--           it means nobody can read your visitors' names, emails and
--           messages using the public key that ships in the page source.
--           Read submissions through the Supabase dashboard instead.
--
--  One consequence worth knowing: because anon cannot SELECT, an insert
--  that asks for the row back (PostgREST's "Prefer: return=representation",
--  which supabase-js sends whenever you chain .select() after .insert())
--  will fail with 42501 even though the insert itself is permitted. The
--  site's code deliberately does NOT chain .select(), so it is unaffected.
--  Keep it that way, or add a SELECT policy if you ever need the row back.

-- Inspect the current policies:
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('Contact_Messages', 'interest_submissions', 'sponsorship_submission')
order by tablename, cmd;
