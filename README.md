# Division Notebook

Play instantly: https://jdhier12-bit.github.io/division-notebook-web/

Notebook-paper long division with multiplication, borrowing, compare, and bring-down scaffolds. No football, installs, PWA manifest, service worker, or paid services.

## Modes
- **Practice:** choose dividend length and divisor difficulty; learn at your own pace.
- **Boss battle:** start with 100 HP. Wrong answers cost 20 HP and 15 score (minimum zero); correct steps restore 5 HP and earn 10 score. Each completed problem deals 34 boss damage. Defeat the boss in three problems; lose at zero HP. Win/lose screens offer a fresh battle.
- **Two players / Pass & Play:** enter a friend's username and pass the device for them to accept. Each player taps Ready before their timer starts. Players alternate solving fresh problems at the same selected difficulty. The faster completed solve earns one point per round (times within 0.05 seconds tie). Three rounds decide the match. Different problems prevent copying a previous solution, but difficulty can vary slightly. Mistakes remain on the clock. The whole match runs on one device.

## Username sign-in
Create/use a 2–20 character nickname (letters, numbers, underscores, hyphens). Profiles and the active nickname are stored in this browser's localStorage only. There are no passwords or verified accounts. Sign-out resets the active nickname to Guest. Do not use sensitive information as your nickname.

## Online coming soon / needs free Firebase
**Cross-device username lookup, invitations, presence, and battles are NOT implemented.** The invite form is for a friend physically sharing the same device; it does not contact another browser. GitHub Pages cannot run a shared database. A future free Firebase project (or equivalent free shared backend), security rules, authenticated/unique usernames, invitation acceptance, and server-validated results would be needed for online matching. No project, paid API, or external account was created for this release.

## Verification
JavaScript syntax checked with Node. Headless Chrome at a 390px mobile viewport verified nickname persistence, boss damage/healing, victory/defeat, invitation acceptance, all six alternating timed turns, final match result, and a return to practice without browser errors.
