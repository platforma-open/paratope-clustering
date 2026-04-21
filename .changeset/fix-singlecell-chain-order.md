---
"@platforma-open/milaboratories.paratope-clustering.workflow": patch
---

Fix single-cell paratope clustering producing chimeric chain rows when the input comes from redefine-clonotypes (or any upstream block that returns CDR/FR columns in different per-feature order). Primary-chain columns are now ordered deterministically by `pl7.app/vdj/scClonotypeChain` (A before B), so `feature_0` and `feature_1` consistently refer to the same biological chains across FR1/CDR1/FR2/... Previously, inconsistent ordering mixed heavy and light residues within a single row passed to Parapred, scrambling the clustering output.