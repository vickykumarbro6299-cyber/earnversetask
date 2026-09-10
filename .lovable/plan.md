# Fix rewarded ads and cooldown persistence

## Changes
- Remove the global Telegram link interception that can interfere with the ad provider’s own click handling.
- Use the rewarded popup format consistently in Telegram so the advertiser action remains inside the supported ad flow.
- Do not treat opening the ad alone as reward completion; only continue after the provider’s rewarded promise completes.
- Store each game’s cooldown as an expiry timestamp in browser storage, so leaving and returning cannot reset the 20-second wait.
- Apply the same behavior to Spin & Win and Math Quiz.

## Validation
- Check both pages load and the controls remain disabled for the remaining cooldown after navigation.
- Confirm no app-level click handler blocks or replaces Monetag’s advertiser links.

## Technical details
- Cooldowns use separate timestamp keys and derive remaining seconds from `Date.now()`.
- The Monetag SDK remains loaded directly in the document head.
