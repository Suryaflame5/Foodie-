-- Complete signup metadata handling and safe pickup contact exchange.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_role text;
begin
  v_role := case
    when new.raw_user_meta_data->>'account_type' = 'organisation' then 'organisation'
    else 'member'
  end;
  insert into public.profiles(id, full_name, preferred_language, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1), 'FOODIE member'),
    case when new.raw_user_meta_data->>'preferred_language' in ('en','ta','te')
      then new.raw_user_meta_data->>'preferred_language' else 'ta' end,
    v_role
  );
  return new;
end;
$$;

create or replace function public.get_request_contact(p_request_id uuid)
returns table(contact_name text, phone text, area text, city text)
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_request public.food_requests;
  v_donor uuid;
  v_other uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select r.* into v_request
  from public.food_requests r
  where r.id = p_request_id
    and (r.requester_id = auth.uid()
      or exists(select 1 from public.food_listings l where l.id=r.listing_id and l.donor_id=auth.uid()));
  if not found then raise exception 'Request not found'; end if;
  if v_request.status <> 'accepted' then raise exception 'Contact details are shared after the donor accepts the request'; end if;
  select l.donor_id into v_donor from public.food_listings l where l.id=v_request.listing_id;
  v_other := case when auth.uid()=v_request.requester_id then v_donor else v_request.requester_id end;
  return query select p.full_name,p.phone,p.area,p.city from public.profiles p where p.id=v_other;
end;
$$;
revoke all on function public.get_request_contact(uuid) from public, anon;
grant execute on function public.get_request_contact(uuid) to authenticated;
