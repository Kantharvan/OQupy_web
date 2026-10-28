# MVP booking and class journeys

Local mobile browser evidence from disposable fixture accounts, not production
users. Screenshots contain generated test names only.

- [Booking cancellation action](cancel-booking-mobile.png)
- [My classes and withdrawal](my-classes-mobile.png)

Four real-backend journeys pass: booking/request/approval/cancellation and slot
release; instructor public class/student enrollment/withdrawal/reload; owner
listing/admin publication/availability; manager assignment/approval/blockout/
revocation. The 52 desktop/mobile fixture tests also pass, along with lint and
TypeScript checks. Local builds used webpack because the environment denied
Turbopack's helper port. CI continues to use the normal project build.

Real Google/SMS login and email delivery are not established by these fixtures.
