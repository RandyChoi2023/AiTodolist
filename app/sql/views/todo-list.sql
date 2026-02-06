CREATE OR REPLACE VIEW todo_list_test_view AS
SELECT
  id,
  text,
  done,
  created_at,
  profile_id
FROM todo_list;