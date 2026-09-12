# Maintenance Mode

## What will be built
- Add a Maintenance Mode switch inside Admin Console settings.
- Save the switch state in the existing app settings data.
- When enabled, replace signed-in user pages with a branded maintenance notice.
- Keep the full site and Admin Console available to admin accounts.
- Turning the switch off restores normal access immediately after refresh/navigation.

## Technical details
- Extend the authenticated user layout to gate its content using the existing profile/settings response.
- Extend the existing admin settings action to securely update the maintenance flag after admin verification.
- Reuse current design tokens and branding for the maintenance screen.
