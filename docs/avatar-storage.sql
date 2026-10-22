-- Private storage. Users can access only their own single avatar object.
begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('paddock-avatars', 'paddock-avatars', false, 131072, array['image/webp'])
on conflict (id) do update set public = false, file_size_limit = 131072, allowed_mime_types = array['image/webp'];

create policy "paddock_avatar_read_own" on storage.objects for select to authenticated
using (bucket_id = 'paddock-avatars' and name = (select auth.uid())::text || '/avatar.webp');
create policy "paddock_avatar_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'paddock-avatars' and name = (select auth.uid())::text || '/avatar.webp');
create policy "paddock_avatar_update_own" on storage.objects for update to authenticated
using (bucket_id = 'paddock-avatars' and name = (select auth.uid())::text || '/avatar.webp')
with check (bucket_id = 'paddock-avatars' and name = (select auth.uid())::text || '/avatar.webp');
create policy "paddock_avatar_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'paddock-avatars' and name = (select auth.uid())::text || '/avatar.webp');
commit;
