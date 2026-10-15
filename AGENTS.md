# Project rules

- Transactions live in the Cloud `transactions` table, read through `useTransactions` (React Query + realtime); localStorage is only a legacy source for one-time upload — keeps every device in sync.
- Access: first signup becomes owner via trigger; others have no role until the owner grants `staff` in `user_roles` — RLS uses `is_member`/`has_role`, never profile fields, to avoid privilege escalation.
- Only owners may delete/edit sales, export, and manage staff; enforce in RLS and hide in UI.
- Mobile uses a fixed bottom tab bar; inputs use text-base on mobile to prevent iOS zoom.
