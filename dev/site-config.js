/* ============================================================
   NORFOX  —  SITE CONFIG
   ------------------------------------------------------------
   This is the ONLY file you normally need to edit on GitHub.

   1)  TURN THE PASSWORD ON / OFF
       passwordEnabled: true   ->  visitors must enter the code
       passwordEnabled: false  ->  site is open to everyone

   2)  CHANGE THE PASSWORD
       Edit the "password" value below. Keep the quotes.

   After editing, just commit/save on GitHub. No other file
   needs to change. Works the same whether the site lives at
   norfox.se/dev  or  later at  norfox.se  (root).
   ============================================================ */

window.NORFOX_CONFIG = {

  // ---- Password gate -------------------------------------
  passwordEnabled: true,        // true = locked,  false = open
  password: "1635",             // the access code visitors type

  // ---- Optional wording on the lock screen ---------------
  lockKicker:  "UNDER DEVELOPMENT",
  lockTitle:   "PRIVATE PREVIEW",
  lockMessage: "This area is under development. Enter your access code to continue.",
  lockFooter:  "NORFOX AB · AUTHORIZED ACCESS ONLY"

};
