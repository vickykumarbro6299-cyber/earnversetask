<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Start timed referral promotions from verified publish webhooks and persist the first publication; preview visits and republishing must not restart an event.
- Pay referral event rewards through an atomic database function with a unique event/referral key so duplicate approvals cannot pay twice.
- Keep referral event eligibility in a browser-safe module with tests; the database payout must enforce the same title and time window.
- Keep rewarded-ad completion checks in a browser-safe adapter; only completed, error-free ads may invoke the existing spin function.
- Keep Telegram identity verification in private expiring sessions; only verified bot webhooks may attest contacts, and atomic database consumption enforces signup uniqueness independently of client fields.
- Use the separate TELEGRAM_API_KEY_1 connection for linking, webhook verification, and registration; retain TELEGRAM_API_KEY for task alerts so switching identity bots cannot redirect alerts.
- Activate mandatory Telegram signup only after an admin verifies the published webhook receiver and registers the bot; this avoids breaking the currently published signup during rollout.
