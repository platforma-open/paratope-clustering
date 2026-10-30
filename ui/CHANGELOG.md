# @platforma-open/milaboratories.paratope-clustering.ui

## 1.3.1

### Patch Changes

- @platforma-open/milaboratories.paratope-clustering.model@1.3.1

## 1.3.0

### Minor Changes

- 4d39f28: Update the SDK and accept a subset filter (e.g. a Repertoire Labeling label or Lead Selection picks) with the input dataset. The dataset list is built with buildDatasetOptions (requireEnrichments: false). The subset restricts the input before the analysis, so only its clonotypes are scored and clustered, and cluster abundance fractions are relative to the subset. Outputs of a subset run carry pl7.app/inputSubset in their domain (on the cluster axis, and on the per-clonotype distance and paratope columns) and a trace rooted in the subset, so their labels name it. Unfiltered runs are unchanged.

### Patch Changes

- Updated dependencies [4d39f28]
  - @platforma-open/milaboratories.paratope-clustering.model@1.3.0

## 1.1.2

### Patch Changes

- 64cf00e: Release every package through npm trusted publishing (OIDC) so each package's trusted publisher is used before it expires.
- Updated dependencies [64cf00e]
  - @platforma-open/milaboratories.paratope-clustering.model@1.2.2

## 1.1.1

### Patch Changes

- Updated dependencies [90fc04c]
  - @platforma-open/milaboratories.paratope-clustering.model@1.2.1

## 1.1.0

### Minor Changes

- bde910e: Migrate onto the block-tools structurer and the V3 block model, and declare the mandatory block kind. Rides a full SDK upgrade (block-tools 2.14.6, tengo-builder 4.0.25, model/ui-vue 1.83.x, workflow-tengo 6.8.3), replaces eslint with oxlint/oxfmt, turns `block/` into the slim published facade and moves CI to node 22.x.

  The persisted shape is unchanged: a legacy upgrader flattens V1 `args` and `uiState` field-for-field into the unified `data`, and the workflow-facing args keep the V1 field set and order, so existing projects do not re-run. UI bindings move to `app.model.data`.

  The kind's init-params contract is the dataset, the paratope probability threshold, the mmseqs2 similarity type, minimal identity, coverage threshold and coverage mode, the block subtitle and the memory/CPU knobs — so a project template can seed a configured Paratope Clustering block.

### Patch Changes

- Updated dependencies [bde910e]
  - @platforma-open/milaboratories.paratope-clustering.model@1.2.0

## 1.0.7

### Patch Changes

- Updated dependencies [181abfd]
  - @platforma-open/milaboratories.paratope-clustering.model@1.1.0

## 1.0.6

### Patch Changes

- 51a0739: Don't warn about missing CDR columns while the dataset is still computing.
- Updated dependencies [51a0739]
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.4

## 1.0.5

### Patch Changes

- Updated dependencies [69fcc61]
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.3

## 1.0.4

### Patch Changes

- 46a7b7b: update dependencies

## 1.0.3

### Patch Changes

- 9653382: Update cluster label to id

## 1.0.2

### Patch Changes

- 6ebc727: Support various blosum matrices
- Updated dependencies [6ebc727]
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.2

## 1.0.1

### Patch Changes

- bc44c8c: Initial implementation of paratope-clustering block
- Updated dependencies [bc44c8c]
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.1
