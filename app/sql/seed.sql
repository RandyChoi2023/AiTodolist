-- Seed data for AI Todo List database
-- Profile ID to use everywhere: 0dbe3274-d439-4926-8c31-f59aa1df27e6
-- Note: profiles table can only have 1 row since profile_id is the primary key

-- 1. Insert user (auth.users) - required before profiles
INSERT INTO "auth"."users" ("id") 
VALUES ('0dbe3274-d439-4926-8c31-f59aa1df27e6')
ON CONFLICT ("id") DO NOTHING;

-- 2. Insert profile (only 1 possible since profile_id is primary key)
INSERT INTO "profiles" ("profile_id", "name", "username", "avatar", "headline", "bio", "todo_style", "motivation_type", "ai_styles", "task_count")
VALUES 
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', 'John Doe', 'johndoe', 'https://avatar.example.com/john.jpg', 'Full Stack Developer', 'Passionate about building great products', 'driver', 'reward', 'soft', 'normal')
ON CONFLICT ("profile_id") DO NOTHING;

-- 3. Insert goals (at least 5)
INSERT INTO "goals" ("id", "profile_id", "title", "why", "category", "target", "status")
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'Learn TypeScript', 'Want to become a better developer', 'Learning', 'Complete 5 TypeScript projects', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'Build a SaaS Product', 'Generate passive income', 'Business', 'Launch MVP within 3 months', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'Get in Shape', 'Improve overall health', 'Health', 'Lose 10kg and run 5km', 'active'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'Read 20 Books', 'Expand knowledge', 'Personal', 'Read one book per month', 'active'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'Master React', 'Advance career', 'Career', 'Build 10 React applications', 'done')
ON CONFLICT DO NOTHING;

-- 4. Insert todo_list (at least 5) - serial ID, will auto-increment
INSERT INTO "todo_list" ("text", "done", "profile_id")
VALUES 
  ('Complete TypeScript tutorial', false, '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('Design database schema', false, '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('Set up CI/CD pipeline', true, '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('Write unit tests', false, '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('Deploy to production', false, '0dbe3274-d439-4926-8c31-f59aa1df27e6');

-- 5. Insert core_tasks (at least 5) - references goals
INSERT INTO "core_tasks" ("id", "goal_id", "title", "notes", "done", "priority", "due")
VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Complete TypeScript basics course', 'Core task for goal: Learn TypeScript', false, 'high', CURRENT_DATE + INTERVAL '7 days'),
  ('f2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Set up project infrastructure', 'Core task for goal: Build a SaaS Product', false, 'medium', CURRENT_DATE + INTERVAL '14 days'),
  ('f3333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Go to gym 3 times per week', 'Core task for goal: Get in Shape', false, 'high', CURRENT_DATE + INTERVAL '1 day'),
  ('f4444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Read "Clean Code" book', 'Core task for goal: Read 20 Books', false, 'low', CURRENT_DATE + INTERVAL '30 days'),
  ('f5555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Build Todo app with React', 'Core task for goal: Master React', true, 'medium', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- 6. Insert follows (at least 5) - using only the specified profile_id (self-follows)
-- Note: Since we only have one profile, these will be self-follows (follower_id = following_id)
INSERT INTO "follows" ("follower_id", "following_id")
VALUES 
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', '0dbe3274-d439-4926-8c31-f59aa1df27e6'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', '0dbe3274-d439-4926-8c31-f59aa1df27e6')
ON CONFLICT DO NOTHING;

-- 7. Insert message_rooms (at least 5) - bigint identity, will auto-increment
INSERT INTO "message_rooms" ("created_at")
VALUES 
  (NOW()),
  (NOW() - INTERVAL '1 day'),
  (NOW() - INTERVAL '2 days'),
  (NOW() - INTERVAL '3 days'),
  (NOW() - INTERVAL '4 days');

-- 8. Insert message_room_member (at least 5) - composite primary key (room_id, profile_id)
-- Using subquery to get actual room_id values, all with the same profile_id
INSERT INTO "message_room_member" ("room_id", "profile_id")
SELECT 
  mr."room_id",
  '0dbe3274-d439-4926-8c31-f59aa1df27e6'
FROM "message_rooms" mr
ORDER BY mr."room_id"
LIMIT 5
ON CONFLICT ("room_id", "profile_id") DO NOTHING;

-- 9. Insert messages (at least 5) - references message_rooms and profiles
INSERT INTO "messages" ("room_id", "sender_id", "content")
SELECT 
  mr."room_id",
  '0dbe3274-d439-4926-8c31-f59aa1df27e6',
  CASE (ROW_NUMBER() OVER (ORDER BY mr."room_id"))
    WHEN 1 THEN 'Hello! How are you doing?'
    WHEN 2 THEN 'Great work on the project!'
    WHEN 3 THEN 'Lets schedule a meeting'
    WHEN 4 THEN 'I have a question about the design'
    ELSE 'Thanks for your help!'
  END
FROM "message_rooms" mr
ORDER BY mr."room_id"
LIMIT 5;

-- 10. Insert notifications (at least 5) - references multiple tables
-- Column order: source_id, goal_id, todo_list_id, core_list_id, target_id, type
INSERT INTO "notifications" ("source_id", "goal_id", "todo_list_id", "core_list_id", "target_id", "type")
VALUES 
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT "id" FROM "todo_list" ORDER BY "id" LIMIT 1 OFFSET 0), 'f1111111-1111-1111-1111-111111111111', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'goal'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT "id" FROM "todo_list" ORDER BY "id" LIMIT 1 OFFSET 1), 'f2222222-2222-2222-2222-222222222222', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'todo'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', 'cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT "id" FROM "todo_list" ORDER BY "id" LIMIT 1 OFFSET 2), 'f3333333-3333-3333-3333-333333333333', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'core'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', 'dddddddd-dddd-dddd-dddd-dddddddddddd', (SELECT "id" FROM "todo_list" ORDER BY "id" LIMIT 1 OFFSET 3), 'f4444444-4444-4444-4444-444444444444', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'mention'),
  ('0dbe3274-d439-4926-8c31-f59aa1df27e6', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', (SELECT "id" FROM "todo_list" ORDER BY "id" LIMIT 1 OFFSET 4), 'f5555555-5555-5555-5555-555555555555', '0dbe3274-d439-4926-8c31-f59aa1df27e6', 'goal');


UPDATE public.todo_list SET profile_id = '0dbe3274-d439-4926-8c31-f59aa1df27e6' WHERE profile_id IS NULL;
UPDATE public.core_tasks SET profile_id = '0dbe3274-d439-4926-8c31-f59aa1df27e6' WHERE profile_id IS NULL;