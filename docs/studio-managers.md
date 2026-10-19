# Studio managers

Managers are assigned per studio; they keep their existing student, instructor or owner account role. Assignment does not grant ownership or access to other studios.

## Owner workflow

1. Open My studios and choose Manage managers on the intended studio.
2. Enter the email of an existing active account that has completed onboarding.
3. Assign the manager. They use their own normal login; this does not send an invitation or create a shared password.
4. Remove a manager from the same panel to revoke access. The API checks current membership on every operational request, including requests using older login tokens.

The panel also shows the latest 20 studio activity entries with actor names and timestamps. The API exposes paginated history for older entries. Activity includes assignments/removals, booking decisions and blockout changes made through the updated endpoints.

## Manager workflow

Managed studios is a separate workspace page, available from navigation to signed-in accounts with a completed role. Accounts without assignments see an empty-state explanation. Personal bookings remain in Bookings; owner controls remain in My studios.

Select an assigned studio to review booking requests and manage unavailable times. Managers can approve/reject pending requests, inspect bookings and create/edit/remove blockouts. Confirmed bookings have no manager cancellation action. They cannot edit listings, prices, policies or opening hours, delete studios, or manage access. Existing personal booker permissions are unaffected.

Failed operations remain visible and do not optimistically mark requests as successful. After access removal, refresh clears the assigned studio; any attempted mutation is denied by the API immediately. A displayed page can remain stale until refreshed.

## Deployment and tests

The UI requires the companion backend manager endpoints and additive migration. Deploy the backend first; this UI does not emulate authorization locally. Global auth roles and OTP setup are unchanged. No production personas are assigned automatically.

Desktop/mobile fixture tests cover owner assignment/removal, manager controls, failed decisions and empty state after removal. The real-backend journey covers assignment → approval → blockout → revocation and retained account role. Both use synthetic identities, not real Google/OTP sign-in.

Until the backend change is merged, run the Full stack integration workflow manually with companion_ref set to feat/studio-managers. Its default companion main must be green after the backend merges and before this frontend merges.
