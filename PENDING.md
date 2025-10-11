pending:
- [ ] test without waitlist enabled - working OK
- [x] test claiming name, email, verifying email - DONE:
    - some issues: 23:19hrs 24-oct-25
        - the credits are assigned only after email is verified - FIXED
        - verification link has token and email, and this should be just the token, since when we arrive to the page we have the fingerprint to make the match. - FIXED
        - we need an admin UI page to see the users with their details and referrals. - READY
        
- [x] test spending with dollars - DONE

todo:
- [x] add a way to stop giving more credits for an app, or pause it. - DONE
- [x] add fingerprint tracking event on sdk  (for tracking 'activities' on an app) - DONE ✅
    - [x] Phase 1: SDK + API endpoint with browser context - DONE ✅
    - [x] Phase 2: Dashboard visualizations (activity feed, analytics, unified timeline) - DONE ✅
- [ ] add support for answering forms linked to fingerprint (to earn credits)
- [ ] add support for signing with google auth and associating the active fingerprint to that same account (so multiple fingerprints can belong to the same account)
- [ ] add some UI auto-branding support to sdk hook (since it has access to the rest of the webpage, it could grab the page colors and UI language) - add some growthkit default branding to the widget - FOR THE FUTURE NOT NOW
- [ ] admin, add a way to send an email to some/all users/leads that have emails, from the admin.
- [ ] admin, add a way of seeing the fingerprint usage across apps
    - [ ] add a way of nurturing an anonymous fingerprint of an app, using the info of that fingerprint from other apps...
- [x] admin, add admin users management owner of groups of apps - orgs have apps DONE
- [x] add waitlist mode that doesn't replace the full page, but embeds it on an ID or generates the UI where you define. The widget could search and replace. Essentially a waitlist for a 'product' the dev can embed on a page. - DONE as 'embed layout' and using 'product waitlists'.
- [ ] enable editing the info of a 'user' on the 'users & lead' tab (sometimes I know who that is before they tell me, and I want to mark them: like the name and/or email - also I would like to add metadata not visible to them, like if I know it's my brother etc).
- [ ] add a way to 'block' a given user from using an app, optionally specifying a reason. And to unblock them (likw a 'pause').

- [x] ✅ **COMPLETED** - admin, add a way of grouping apps with a single apikey or public token, so they share credits consumption and earnings (like a passport by group, or by kind of apps) - I think this should be a menu option like 'Groups' to create groups and add them there maybe even with a color tag, so when we see the apps on the sidebar we can identify their group by 'chip' tag or color. The idea here in terms of the widget is that the user can earn some credits using an app, and spend them on another different app or within the same group of apps, and all earnings go to the same balance.
    
    **✅ IMPLEMENTED SOLUTION**: Added `isolatedAccounts` boolean setting to apps (defaults to `true`). When set to `false`, apps within the same organization share user accounts and credit balances while maintaining detailed per-app tracking of earnings/spending.
    
    **What was built**:
    - ✅ Database: Added `isolatedAccounts` field to App model 
    - ✅ Admin UI: Toggle in App Settings → Basic Info for existing apps
    - ✅ App Creation: Automatic inclusion in new app creation flow
    - ✅ SDK Widgets: Updated both `/api/v1/*` and `/api/public/*` endpoints for shared credit calculation
    - ✅ Users View: Added "🔗 Shared" indicators in Users & Leads tab
    - ✅ KISS Implementation: Virtual aggregation (no data model changes), fingerprint-based identity, organization-scoped sharing

- [ ] admin. add app description field (OK) and keywords, to have better insights as to why a user wanted to use them (tracking)
- [x] sdk: add localization support for widget, and expose method so the client can switch the active language (for example, if the client app handles the locale) - DONE
- [x] add public token generation so we can use the widget without exposing the apikey and without needing a middleware (to use it on simple static reactjs webapps or other web based apps later) - DONE
- [ ] add support for showing widget as a chat bot box (setting on admin controllable (from the admin we can chose to show it as a chatbox or standard)):
    - [ ] each app could define a knowledge DB to use as a RAG with chromaDB or upstash vector (let's keep it simple)
        - when starting the chat, we should send as context the info the user is seeing on the page (the widget should grab the rendered page, compress it and send it to the server - the server would use an llm call to summarize it and use it as context).
        - all messages to the bot should be sent to our backend, and our backend  perform the calls to the AI model (using groq.com with openai oss-gpt model)
        - create an internal calendar, so to enable scheduling capabilities for each app, for example, for showing a demo, scheduling a consulting, or service about the page, we can schedule slots through the chat, checking availability first (to not book twice on the same time slots).
    - [ ] each chat session, should extract metadata from each conversation and attach it as the activities of that user. Then (future) on the dashboard we should be able to search users interested in x things, to send them an email.
    - [ ] we should be able from the 'Users & Leads' option, to initiate a chat with the active user (replacing the bot with the admin user, until the admin quits the chat session).

- [ ] hide 'Offline' label if slim_labels is false.
- [x] improve the waitlist screen to show the app title and description and the growthkit logo. - DONE
- [x] add location info from user fingerprint data being tracked - DONE ✅
    - Added browser, device, and location tracking using geoip-lite
    - Updated Users & Leads UI with fingerprint icon, browser/device info, and location column
    - Privacy-friendly: city-level location only, no invasive tracking

- [ ] add support for showing ads in exchange for credits. These ads would be managed from the growthkit admin, from a 'Campaigns' sidebar menu option, managed per organization.