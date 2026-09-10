# @platforma-open/milaboratories.paratope-clustering

## 1.2.1

### Patch Changes

- 90fc04c: Fix a spurious "missing required columns" warning for bulk datasets. The probe in
  `isPairedDataset` searched the whole result pool for a `pl7.app/vdj/sequence` column with
  `pl7.app/vdj/scClonotypeChain/index: "primary"`. In a project that also contains a single-cell
  block, the probe matched that block's columns and marked every bulk dataset as paired, so
  `hasRequiredColumns` looked for CDR columns carrying that domain on the bulk `clonotypeKey` axis,
  found none, and warned about a dataset that was in fact complete. The `isSingleCell` output was
  wrong in the same projects. The probe is now scoped to the dataset's clonotype axis, in the same
  way as the CDR matchers it gates. The workflow computes pairing from its own resolved columns and
  was unaffected, so runs were already correct.

## 1.2.0

### Minor Changes

- bde910e: Migrate onto the block-tools structurer and the V3 block model, and declare the mandatory block kind. Rides a full SDK upgrade (block-tools 2.14.6, tengo-builder 4.0.25, model/ui-vue 1.83.x, workflow-tengo 6.8.3), replaces eslint with oxlint/oxfmt, turns `block/` into the slim published facade and moves CI to node 22.x.

  The persisted shape is unchanged: a legacy upgrader flattens V1 `args` and `uiState` field-for-field into the unified `data`, and the workflow-facing args keep the V1 field set and order, so existing projects do not re-run. UI bindings move to `app.model.data`.

  The kind's init-params contract is the dataset, the paratope probability threshold, the mmseqs2 similarity type, minimal identity, coverage threshold and coverage mode, the block subtitle and the memory/CPU knobs — so a project template can seed a configured Paratope Clustering block.

## 1.1.0

### Minor Changes

- 181abfd: Accept imported antibody sets keyed on `pl7.app/variantKey`

  The dataset selector admitted only `pl7.app/vdj/clonotypeKey` and `pl7.app/vdj/scClonotypeKey`
  row axes. `import-vdj-data` emits imported sets — amino-acid variable domains with no gene calls
  and no counts — on the shared `pl7.app/variantKey` axis, so such a set never appeared in the
  picker at all.

  The data itself needs nothing: the block asks for `FR1, CDR1, FR2, CDR2, FR3, CDR3, FR4` as
  amino-acid `pl7.app/vdj/sequence` columns on the record axis, which is exactly what an imported
  set emits, under the same feature names.

  The axis name alone cannot admit them. Three producers key on `pl7.app/variantKey` and only the
  run-id in the axis domain separates them: `pl7.app/peptide/extractionRunId` for
  peptide-extraction, `pl7.app/repertoire/extractionRunId` for synthetic-repertoire-profiler, and
  `pl7.app/vdj/clonotypingRunId` for imported receptor sets. Only the last has CDRs, and matching on
  the name would offer peptides to a paratope predictor. That run-id's value is the producing
  block's id, so it cannot be written into a declarative axis selector — the selector is now a
  predicate.

  **Paired detection now reads the columns, not the axis.** A paired imported set carries its two
  chains in the `pl7.app/vdj/scClonotypeChain` column domain on a `variantKey` axis, so the old
  `axesSpec[1].name === scClonotypeKey` test called it bulk. That is not cosmetic here:
  `normalizePrimaryChainOrder` in the workflow keeps each feature's primary chain and orders them
  A-before-B, and parapred consumes chains positionally as `CDR1_0` / `CDR1_1`. Skipped, the chain
  at index 0 can differ from one feature to the next, and parapred would score a chimera of heavy
  and light regions. The model and the workflow both probe for a per-chain column instead.

  Bulk and legacy single-cell inputs are unaffected: both still take the paths they always took.

  **Cluster labels.** A cluster is labelled from its representative record's label, and a leading
  `C-` (MiXCR) became `CL-`. An imported set's labels are the scientist's own identifiers, so
  nothing was rewritten and every cluster appeared under a bare record name. Labels carrying no
  recognised prefix now get `CL-` prepended: `AB-001` becomes `CL-AB-001`.

  A label already shaped like `CL-01` is prepended too, giving `CL-CL-01`. An imported set's labels
  are arbitrary, so `CL-01` is a record the scientist named that way; leaving it alone would show a
  cluster and a record under one identical string — the confusion this change exists to remove.

  The rewrite is also anchored now. polars reads the pattern as a regex and it was unanchored, so
  the first `C-` anywhere in a label was rewritten — an imported label `ABC-123` silently became
  `ABCL-123`. **MiXCR labels are unchanged either way**, since theirs start with `C-`; the anchor
  only affects labels the old expression was corrupting.

  `P-` (peptide) and `V-` (amplicon) are deliberately left alone. Neither producer can reach this
  block — both key on `pl7.app/variantKey` without `pl7.app/vdj/clonotypingRunId`, so the selector
  excludes them, and neither emits the CDR columns the block requires.

### Patch Changes

- Updated dependencies [181abfd]
  - @platforma-open/milaboratories.paratope-clustering.model@1.1.0
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.1.0
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.7

## 1.0.13

### Patch Changes

- Updated dependencies [51a0739]
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.4
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.11
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.6

## 1.0.12

### Patch Changes

- 427a8f2: Set clustering block order

## 1.0.11

### Patch Changes

- Updated dependencies [69fcc61]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.10
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.3
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.5

## 1.0.10

### Patch Changes

- Updated dependencies [3283172]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.9

## 1.0.9

### Patch Changes

- Updated dependencies [10540fc]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.8

## 1.0.8

### Patch Changes

- Updated dependencies [127d2cd]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.7

## 1.0.7

### Patch Changes

- e06286e: Fix: for single-cell data, only primary chains are fed to Parapred and MMSeqs2 clustering. Previously, MiXCR single-cell input leaked both primary and secondary chains into the clustering input, which inflated the per-clonotype paratope and produced incorrect clusters. CellRanger and bulk inputs are unaffected.
- Updated dependencies [e06286e]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.6

## 1.0.6

### Patch Changes

- Updated dependencies [46a7b7b]
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.4

## 1.0.5

### Patch Changes

- Updated dependencies [9653382]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.5
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.3

## 1.0.4

### Patch Changes

- @platforma-open/milaboratories.paratope-clustering.workflow@1.0.4

## 1.0.3

### Patch Changes

- @platforma-open/milaboratories.paratope-clustering.workflow@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [d1ae953]
- Updated dependencies [6ebc727]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.2
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.2
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.2

## 1.0.1

### Patch Changes

- bc44c8c: Initial implementation of paratope-clustering block
- Updated dependencies [bc44c8c]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.1
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.1
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.1
