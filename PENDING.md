now let's continue thinking about the customization approach; I think it should be similar to the tab like the one we have for 'email templates' but within the app 'settings', what do you think ?

pending:
- test without waitlist enabled - working OK
- test claiming name, email, verifying email - in progress:
    - some issues: 23:19hrs 24-oct-25
        - the credits are assigned only after email is verified - FIXED
        - verification link has token and email, and this should be just the token, since when we arrive to the page we have the fingerprint to make the match. - FIXED
        - we need an admin UI page to see the users with their details and referrals.
        
- test spending with dollars

todo:
- add fingerprint tracking event on sdk 
- add more info about the browser on each usage
- add support for answering forms linked to fingerprint (to earn credits)
- add some UI auto-branding support to sdk hook (since it has access to the rest of the webpage, it could grab the page colors and UI language) 
- add some default UI templates locations with branding (like bottom bar with logo and credits; floating icon with menu with credits, etc)
- add a way to stop giving more credits for an app, or pause it.