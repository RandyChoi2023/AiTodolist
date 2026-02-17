create or replace function public.notify_goals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    source_id,
    goal_id,
    target_id,
    type,
    seen,
    created_at
  )
  values (
    new.profile_id,
    new.id,
    new.profile_id,
    'goal'::public.notification_type,
    false,
    now()
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_goals on public.goals;

create trigger trg_notify_goals
after insert on public.goals
for each row
execute function public.notify_goals();


create or replace function public.notify_todo_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    source_id,
    todo_list_id,
    target_id,
    type,
    seen,
    created_at
  )
  values (
    new.profile_id,
    new.id,
    new.profile_id,
    'todo'::public.notification_type,
    false,
    now()
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_todo_list on public.todo_list;

create trigger trg_notify_todo_list
after insert on public.todo_list
for each row
execute function public.notify_todo_list();




지금 notification 페이지 작업하고 있어 
1. trigger 만들기 public.goals and public.todo_list 에 
   데이터가 생성 되면 public.notifications 에 데이터 생성. 
   # when create goals 
   CREATE FUNCTION pulbic.notify_goals()
   RETURNS trigger
   SECURITY DEFINER SET search_path = ''
   LANGUAGE plpgsql
   AS $$
   BEGIN
        INSERT INTO public.notifications () 여기 나머지 만들어줘
   END;
   $$;

   # when create todo_list
   CREATE FUNCTION pulbic.notify_todo_list()
   RETURNS trigger
   SECURITY DEFINER SET search_path = ''
   LANGUAGE plpgsql
   AS $$
   BEGIN
        INSERT INTO public.notifications () 여기 나머지 만들어줘
   END;
   $$;
2. Notifications page 에서 
   notifications table 읽어서 표시

3. see-notification-page.tsx 생성 
   update notifications set seen =true
   fetcher 로 notification-card.tsx 에서 눌렀었을때 확인으로 변경. 

4. countNotification 만들어서 있을때  notification.count > seen 있으면 root.tsx 의  notiifcation=true;
   