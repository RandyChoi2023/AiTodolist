-- 1. 테이블 삭제 (삭제 순서는 관계없음 CASCADE 덕분)
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "message_room_member" CASCADE;
DROP TABLE IF EXISTS "message_rooms" CASCADE;
DROP TABLE IF EXISTS "follows" CASCADE;
DROP TABLE IF EXISTS "todo_list" CASCADE;
DROP TABLE IF EXISTS "core_tasks" CASCADE;
DROP TABLE IF EXISTS "goals" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;
-- auth.users는 외부(Supabase 등)에서 관리된다면 제외, 직접 생성했다면 포함
-- DROP TABLE IF EXISTS "auth"."users" CASCADE; 

-- 2. 생성된 커스텀 타입(Enum) 삭제
DROP TYPE IF EXISTS "public"."task_priority";
DROP TYPE IF EXISTS "public"."goal_status";
DROP TYPE IF EXISTS "public"."ai_styles";
DROP TYPE IF EXISTS "public"."motivation_type";
DROP TYPE IF EXISTS "public"."notification_type";
DROP TYPE IF EXISTS "public"."task_count";
DROP TYPE IF EXISTS "public"."todo_style";

-- 3. drizzle 마이그레이션 메타데이터 삭제 (선택 사항이나 추천)
DROP TABLE IF EXISTS "__drizzle_migrations";

CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'done');--> statement-breakpoint
CREATE TYPE "public"."ai_styles" AS ENUM('soft', 'strict', 'playful');--> statement-breakpoint
CREATE TYPE "public"."motivation_type" AS ENUM('reward', 'progress', 'meaning');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('goal', 'todo', 'core', 'mention');--> statement-breakpoint
CREATE TYPE "public"."task_count" AS ENUM('few', 'normal', 'many');--> statement-breakpoint
CREATE TYPE "public"."todo_style" AS ENUM('driver', 'dreamer', 'developer', 'drifter');--> statement-breakpoint
CREATE TABLE "core_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"done" boolean DEFAULT false NOT NULL,
	"priority" "task_priority" DEFAULT 'low' NOT NULL,
	"due" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"why" text NOT NULL,
	"category" text,
	"target" text,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"done" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" uuid,
	"following_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_room_member" (
	"room_id" bigint,
	"profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "message_room_members_pk" PRIMARY KEY("room_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "message_rooms" (
	"room_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_rooms_room_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"message_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"room_id" bigint,
	"sender_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notification_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source_id" uuid,
	"goal_id" uuid,
	"todo_list_id" integer NOT NULL,
	"core_list_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"avatar" text,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"headline" text,
	"bio" text,
	"todo_style" "todo_style" DEFAULT 'driver',
	"motivation_type" "motivation_type" DEFAULT 'reward',
	"ai_styles" "ai_styles" DEFAULT 'soft',
	"task_count" "task_count" DEFAULT 'few',
	"histories" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "core_tasks" ADD CONSTRAINT "core_tasks_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_profiles_profile_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_profiles_profile_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_room_member" ADD CONSTRAINT "message_room_member_room_id_message_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."message_rooms"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_room_member" ADD CONSTRAINT "message_room_member_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_message_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."message_rooms"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_profile_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_source_id_profiles_profile_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_todo_list_id_todo_list_id_fk" FOREIGN KEY ("todo_list_id") REFERENCES "public"."todo_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_core_list_id_core_tasks_id_fk" FOREIGN KEY ("core_list_id") REFERENCES "public"."core_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_id_profiles_profile_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;


ALTER TABLE public.todo_list ADD COLUMN profile_id uuid;
ALTER TABLE public.core_tasks ADD COLUMN profile_id uuid;

