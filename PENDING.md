now let's continue thinking about the customization approach; I think it should be similar to the tab like the one we have for 'email templates' but within the app 'settings', what do you think ?

pending:
- test without waitlist enabled - working OK
- test claiming name, email, verifying email - in progress:
    - some issues: 23:19hrs 24-oct-25
        - the credits are assigned only after email is verified - FIXED
        - verification link has token and email, and this should be just the token, since when we arrive to the page we have the fingerprint to make the match. - FIXED
        - we need an admin UI page to see the users with their details and referrals. - READY
        
- test spending with dollars - DONE

todo:
- add a way to stop giving more credits for an app, or pause it. - DONE
- add fingerprint tracking event on sdk  (for tracking 'activities' on an app) - DONE ✅
    - Phase 1: SDK + API endpoint with browser context - DONE ✅
    - Phase 2: Dashboard visualizations (activity feed, analytics, unified timeline) - DONE ✅
- add support for answering forms linked to fingerprint (to earn credits)
- add some UI auto-branding support to sdk hook (since it has access to the rest of the webpage, it could grab the page colors and UI language) - add some growthkit default branding to the widget
- admin, add a way to send an email to some/all users/leads that have emails, from the admin.
- admin, add a way of seeing the fingerprint usage across apps
- admin, add admin users management owner of groups of apps
- admin, add a way of grouping apps with a single apikey, so they share credits consumption and earnings (like a passport by topic)
- admin. add app description field and keywords, to have better insights as to why a user wanted to use them (tracking)
- sdk: add localization support for widget, and expose method so the client can switch the active language (for example, if the client app handles the locale)