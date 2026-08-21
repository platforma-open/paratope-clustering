---
'@platforma-open/milaboratories.paratope-clustering.model': minor
'@platforma-open/milaboratories.paratope-clustering.workflow': minor
'@platforma-open/milaboratories.paratope-clustering': minor
---

Accept imported antibody sets keyed on `pl7.app/variantKey`

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
