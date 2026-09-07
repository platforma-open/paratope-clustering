---
'@platforma-open/milaboratories.paratope-clustering.model': minor
'@platforma-open/milaboratories.paratope-clustering.ui': minor
'@platforma-open/milaboratories.paratope-clustering': minor
'@platforma-open/milaboratories.paratope-clustering.workflow': patch
'@platforma-open/milaboratories.paratope-clustering.software': patch
---

Migrate onto the block-tools structurer and the V3 block model, and declare the mandatory block kind. Rides a full SDK upgrade (block-tools 2.14.6, tengo-builder 4.0.25, model/ui-vue 1.83.x, workflow-tengo 6.8.3), replaces eslint with oxlint/oxfmt, turns `block/` into the slim published facade and moves CI to node 22.x.

The persisted shape is unchanged: a legacy upgrader flattens V1 `args` and `uiState` field-for-field into the unified `data`, and the workflow-facing args keep the V1 field set and order, so existing projects do not re-run. UI bindings move to `app.model.data`.

The kind's init-params contract is the dataset, the paratope probability threshold, the mmseqs2 similarity type, minimal identity, coverage threshold and coverage mode, the block subtitle and the memory/CPU knobs — so a project template can seed a configured Paratope Clustering block.
