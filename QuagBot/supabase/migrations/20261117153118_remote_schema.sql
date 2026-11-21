SET local check_function_bodies = off;

CREATE SCHEMA "drizzle";

CREATE SEQUENCE "drizzle"."__drizzle_migrations_id_seq" AS integer INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1 NO CYCLE;

CREATE TABLE "drizzle"."__drizzle_migrations" (
  "id"         integer NOT NULL DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass),
  "hash"       text    NOT NULL,
  "created_at" bigint,
  CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."chat_messages" (
  "message_id"      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"      uuid                     NOT NULL,
  "sender_role"     text                     NOT NULL DEFAULT 'student'::text,
  "message_content" text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY (message_id),
  CONSTRAINT "chat_messages_sender_role_check" CHECK ((sender_role = ANY (ARRAY['user'::text, 'assistant'::text])))
);

CREATE TABLE "public"."chat_sessions" (
  "session_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL,
  "class_id"   uuid,
  "title"      text NOT NULL,
  CONSTRAINT "chat_sessions_pkey" PRIMARY KEY (session_id)
);

CREATE TABLE "public"."classroom_members" (
  "class_id" uuid NOT NULL,
  "user_id"  uuid NOT NULL,
  CONSTRAINT "classroom_members_pkey" PRIMARY KEY (class_id, user_id)
);

CREATE TABLE "public"."classrooms" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "join_code"  text                     NOT NULL,
  "owner_id"   uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "classrooms_join_code_key" UNIQUE (join_code),
  CONSTRAINT "classrooms_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "display_name" text,
  "role"         text                     NOT NULL DEFAULT 'student'::text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";

CREATE TYPE "public"."sender_role" AS ENUM (
  'user',
  'assistant'
);

CREATE TYPE "public"."user_role" AS ENUM (
  'student',
  'teacher',
  'admin'
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$function$;

ALTER TABLE "public"."chat_messages"
  ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE;

ALTER TABLE "public"."chat_sessions"
  ADD CONSTRAINT "chat_sessions_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classrooms(id) ON DELETE CASCADE;

ALTER TABLE "public"."classroom_members"
  ADD CONSTRAINT "classroom_members_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classrooms(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."chat_sessions"
  ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."classroom_members"
  ADD CONSTRAINT "classroom_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."classrooms"
  ADD CONSTRAINT "classrooms_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "read own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "update own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_messages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."chat_messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_messages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_messages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_sessions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."chat_sessions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_sessions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_sessions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classroom_members" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."classroom_members" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classroom_members" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classroom_members" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classrooms" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."classrooms" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classrooms" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."classrooms" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

