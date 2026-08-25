# Bailando — terrace planner (work in progress)

A browser-based 3D planner for converting the 8th-floor terrace above Bailamos
into Bailando: pool table, PS5 station, lounge seating and bar.

Built so nobody needs Blender or Maya — it publishes as a single self-contained
web page you open, drag things around in, and walk through in first person.

## Why it exists

Before ordering furniture, we need to know whether it physically fits:

- a 9 ft pool table needs a **5.70 × 4.47 m** clear box for the cue swing
- a 65" screen wants players seated **1.6–2.5 m** back
- the stair from the 7th floor is the only escape route and must stay **1.2 m** clear
- a 9 ft table's slate is roughly **480 kg** on four legs — a point load on a terrace slab

The planner checks all of this live as you move things.

## Layout

```
src/lib.js        geometry + material helpers
src/catalog.js    every orderable item, at real dimensions, with clearances,
                  weights and ordering notes
src/scene.js      terrace shell, floor finishes, day/sunset/night lighting,
                  plan / 3D / walkthrough cameras
src/checks.js     clearance, pinch-point, escape-route and load analysis
```

Status: engine complete, interface and build pipeline in progress.
