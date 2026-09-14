# Add Guess Color earning game

## Changes
- Set the minimum reward for the Other task category to 20 coins.
- Add Guess Color under Earnings with a two-option random “Find [color]” round.
- Require one rewarded ad to unlock each round and another rewarded ad to collect a correct 10-coin reward.
- Start a persistent 20-second cooldown only after reward collection, surviving back navigation and refresh.
- Limit Guess Color to 10 rounds per day, matching the other earning games.
- Store each round and reward claim securely so coins can only be credited once.

## Validation
- Verify the new page, drawer link, ad states, correct/wrong answer states, reward popup, daily count, and cooldown behavior.
- Verify the Other category accepts 20 coins as its minimum.

## Technical details
- Add a protected Guess Color table and authenticated server functions for state, round creation, answer verification, and one-time collection.
- Reuse the existing rewarded-ad helper flow and timestamp-based cooldown approach from Math Quiz.
