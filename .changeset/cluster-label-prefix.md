---
'@platforma-open/milaboratories.paratope-clustering.software': patch
'@platforma-open/milaboratories.paratope-clustering': patch
---

Fix cluster labels: anchor the rewrite, handle `P-`, prefix everything else

A cluster is labelled from its representative record's label. The rewrite that turned a leading
`C-` into `CL-` was wrong in three ways, and the first affects data already in use:

- **The pattern was unanchored.** polars reads it as a regex, so the first `C-` *anywhere* in the
  label was rewritten — `ABC-123` silently became `ABCL-123`. Now anchored to the start.
- **`P-` was never handled**, so peptide labels kept their record prefix and read as records.
- **A label matching neither passed through unchanged.** An imported set's labels are the
  scientist's own identifiers — `AB-001`, `trastuzumab` — so every cluster appeared under a bare
  record name.

Labels carrying no recognised prefix now get `CL-` prepended: `AB-001` becomes `CL-AB-001`.
Prepending keeps the representative's identity visible, which a generated index would lose.
Labels already starting with `CL-` are untouched, so there is no double prefix.

| input | before | after |
|---|---|---|
| `C-0001` | `CL-0001` | `CL-0001` |
| `P-0042` | `P-0042` | `CL-0042` |
| `CL-9` | `CL-9` | `CL-9` |
| `AB-001` | `AB-001` | `CL-AB-001` |
| `ABC-123` | `ABCL-123` | `CL-ABC-123` |
| `Gilvetmab` | `Gilvetmab` | `CL-Gilvetmab` |

This brings the block in line with clonotype-clustering and 3d-structure-clustering, which label
clusters from the same upstream `pl7.app/label` column and can sit beside this block in one
project, so the three have to agree.

`synthetic-repertoire-profiler` labels variants `V-XXXXX`, which the rewrite did not match either,
so amplicon clusters now read `CL-V-XXXXX`. Adding `V` to the rewrite instead would give
`CL-XXXXX` and match MiXCR and peptide, but that changes labels for an existing modality and is
left to whoever owns that call — as in the other two blocks.
