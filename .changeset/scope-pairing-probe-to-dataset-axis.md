---
"@platforma-open/milaboratories.paratope-clustering.model": patch
"@platforma-open/milaboratories.paratope-clustering": patch
---

Fix a spurious "missing required columns" warning for bulk datasets. The probe in
`isPairedDataset` searched the whole result pool for a `pl7.app/vdj/sequence` column with
`pl7.app/vdj/scClonotypeChain/index: "primary"`. In a project that also contains a single-cell
block, the probe matched that block's columns and marked every bulk dataset as paired, so
`hasRequiredColumns` looked for CDR columns carrying that domain on the bulk `clonotypeKey` axis,
found none, and warned about a dataset that was in fact complete. The `isSingleCell` output was
wrong in the same projects. The probe is now scoped to the dataset's clonotype axis, in the same
way as the CDR matchers it gates. The workflow computes pairing from its own resolved columns and
was unaffected, so runs were already correct.
