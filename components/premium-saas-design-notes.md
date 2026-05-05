# Premium SaaS UI/UX Refactor

Design-only upgrade. Component APIs, props, imports, exports and business logic are intentionally kept intact.

## What changed
- More premium visual system: layered gradients, glass panels, deeper elevation, softer radii.
- Stronger hierarchy: bigger controls, clearer cards, stronger dashboard shell.
- Better states: hover lift, focus rings, disabled states, active tab treatment.
- Enterprise SaaS feel: cockpit-style panels, polished navigation, refined form surfaces.

## Safety
Run before merging:

```bash
npm run lint
npm run typecheck
npm run dev
```

Do not merge directly to production without visually checking the main dashboard, income cockpit, auth screens, dialogs and mobile header.
