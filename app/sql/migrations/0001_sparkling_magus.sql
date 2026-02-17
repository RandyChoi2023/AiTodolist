ALTER TABLE "core_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "todo_list_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "core_list_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "todo_list" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "todo_list" ADD COLUMN "profile_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "seen_by" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "seen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "todo_list" ADD CONSTRAINT "todo_list_profile_id_profiles_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_list" DROP COLUMN "createdAt";--> statement-breakpoint
CREATE POLICY "core-tasks-insert-policy" ON "core_tasks" AS PERMISSIVE FOR INSERT TO "authenticatedRole" WITH CHECK ((auth.uid()) = (SELECT user_id FROM goals WHERE id = "core_tasks"."goal_id"));