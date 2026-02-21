CREATE OR REPLACE VIEW message_view AS
SELECT
  m1.room_id,
  profiles.name,
  (
    SELECT content
    FROM messages
    WHERE room_id = m1.room_id
    ORDER BY message_id DESC
    LIMIT 1
  ) AS last_message,
  m1.profile_id AS profile_id,
  m2.profile_id AS other_profile_id
  profiles.avatar,
FROM message_room_member m1
INNER JOIN message_room_member m2 ON m1.room_id = m2.room_id
INNER JOIN profiles ON profiles.profile_id = m2.profile_id;