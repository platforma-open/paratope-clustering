"""
Parapred pipeline: constructs flanked CDR sequences, runs Parapred inference,
extracts paratope residues above threshold, and outputs FASTA + paratope positions TSV.

Input: TSV with columns clonotypeKey, FR1, CDR1, FR2, CDR2, FR3, CDR3, FR4
       (optionally duplicated for heavy/light chains as FR1_0, CDR1_0, ... FR4_1, CDR1_1, ...)
Output:
  - output.fasta: paratope sequences for MMseqs2 clustering
  - paratope-sequences.tsv: clonotypeKey -> paratope_sequence mapping
"""

import argparse
import os
import sys

import pandas as pd
import numpy as np

try:
    import torch
    from parapred.model import Parapred, clean_output
    from parapred.cnn import generate_mask
    from parapred.preprocessing import encode_batch
except ImportError as e:
    print(
        f"ERROR: parapred-pytorch not installed. This script requires the parapred environment. ({e})",
        file=sys.stderr,
    )
    sys.exit(1)

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights", "parapred_pytorch.h5")


def load_model():
    """Load the Parapred model with pretrained weights."""
    model = Parapred()
    model.load_state_dict(torch.load(WEIGHTS_PATH, map_location="cpu"))
    model.eval()
    return model


def build_flanked_cdrs(row, cdr_cols, fr_cols):
    """
    Build flanked CDR sequences for Parapred from FR and CDR columns.
    Parapred expects CDR sequences flanked by 2 residues from surrounding FRs.

    Returns list of (flanked_cdr, cdr_start, cdr_end) tuples for CDR1, CDR2, CDR3.
    cdr_start/cdr_end are 0-based indices of the actual CDR within the flanked sequence.
    """
    results = []
    flank_pairs = [
        (fr_cols[0], cdr_cols[0], fr_cols[1]),  # FR1, CDR1, FR2
        (fr_cols[1], cdr_cols[1], fr_cols[2]),  # FR2, CDR2, FR3
        (fr_cols[2], cdr_cols[2], fr_cols[3]),  # FR3, CDR3, FR4
    ]

    for left_fr, cdr, right_fr in flank_pairs:
        left_seq = str(row.get(left_fr, "") or "")
        cdr_seq = str(row.get(cdr, "") or "")
        right_seq = str(row.get(right_fr, "") or "")

        if not cdr_seq:
            results.append(("", 0, 0))
            continue

        # Take last 2 residues from left FR, first 2 from right FR
        left_flank = left_seq[-2:] if len(left_seq) >= 2 else left_seq
        right_flank = right_seq[:2] if len(right_seq) >= 2 else right_seq

        flanked = left_flank + cdr_seq + right_flank
        cdr_start = len(left_flank)
        cdr_end = cdr_start + len(cdr_seq)
        results.append((flanked, cdr_start, cdr_end))

    return results


def predict_batch(model, flanked_sequences):
    """
    Run Parapred on a list of flanked CDR sequences.
    Returns list of numpy arrays with per-residue probabilities.
    Empty sequences get empty arrays.
    """
    valid = [(i, seq) for i, seq in enumerate(flanked_sequences) if seq]
    results = [np.array([]) for _ in flanked_sequences]

    if not valid:
        return results

    # Sort by length descending (required for pack_padded_sequence in LSTM)
    valid_sorted = sorted(valid, key=lambda x: len(x[1]), reverse=True)
    indices_sorted = [v[0] for v in valid_sorted]
    seqs_sorted = [v[1] for v in valid_sorted]

    encoded, lengths = encode_batch(seqs_sorted, max_length=40)
    mask = generate_mask(encoded, lengths)

    with torch.no_grad():
        probs = model(encoded, mask, lengths)

    for batch_idx, orig_idx in enumerate(indices_sorted):
        seq_len = len(seqs_sorted[batch_idx])
        seq_probs = clean_output(probs[batch_idx], seq_len)
        results[orig_idx] = seq_probs.numpy().flatten()

    return results


def extract_paratope(cdr_seq, probs, cdr_start, cdr_end, threshold):
    """
    Extract paratope residues from CDR region that exceed the probability threshold.
    Only considers residues within the CDR boundaries (not the flanking residues).
    """
    if not cdr_seq or len(probs) == 0:
        return ""

    paratope_residues = []
    for i in range(cdr_start, min(cdr_end, len(probs))):
        if probs[i] >= threshold:
            residue_idx = i - cdr_start
            if residue_idx < len(cdr_seq):
                paratope_residues.append(cdr_seq[residue_idx])

    return "".join(paratope_residues)


def main():
    parser = argparse.ArgumentParser(
        description="Run Parapred pipeline for paratope extraction"
    )
    parser.add_argument(
        "--threshold", type=float, default=0.5, help="Paratope probability threshold"
    )
    parser.add_argument("--input", type=str, default="input.tsv", help="Input TSV file")
    args = parser.parse_args()

    threshold = args.threshold
    df = pd.read_csv(args.input, sep="\t").fillna("")

    # Detect column naming: chain-indexed (CDR1_0, CDR1_1) or plain (CDR1, CDR2)
    chain_sets = []
    if "CDR1_0" in df.columns:
        chain_idx = 0
        while f"CDR1_{chain_idx}" in df.columns:
            cdr_cols = [
                f"CDR1_{chain_idx}",
                f"CDR2_{chain_idx}",
                f"CDR3_{chain_idx}",
            ]
            fr_cols = [
                f"FR1_{chain_idx}",
                f"FR2_{chain_idx}",
                f"FR3_{chain_idx}",
                f"FR4_{chain_idx}",
            ]
            chain_sets.append((cdr_cols, fr_cols))
            chain_idx += 1
    else:
        chain_sets.append(
            (["CDR1", "CDR2", "CDR3"], ["FR1", "FR2", "FR3", "FR4"])
        )

    model = load_model()

    # Collect all flanked CDR sequences for batch prediction
    all_entries = []  # (flanked_seq, cdr_seq, cdr_start, cdr_end)
    row_chain_cdr_map = {}  # (row_idx, chain_idx, cdr_idx) -> index in all_entries

    for row_idx, row in df.iterrows():
        for chain_idx, (cdr_cols, fr_cols) in enumerate(chain_sets):
            flanked_cdrs = build_flanked_cdrs(row, cdr_cols, fr_cols)
            for cdr_idx, (flanked, cdr_start, cdr_end) in enumerate(flanked_cdrs):
                idx = len(all_entries)
                row_chain_cdr_map[(row_idx, chain_idx, cdr_idx)] = idx
                cdr_seq = str(row.get(cdr_cols[cdr_idx], "") or "")
                all_entries.append(
                    {
                        "flanked": flanked,
                        "cdr_seq": cdr_seq,
                        "cdr_start": cdr_start,
                        "cdr_end": cdr_end,
                    }
                )

    # Batch predict in chunks
    BATCH_SIZE = 512
    all_probs = [np.array([]) for _ in all_entries]
    flanked_seqs = [item["flanked"] for item in all_entries]

    for start in range(0, len(flanked_seqs), BATCH_SIZE):
        end = min(start + BATCH_SIZE, len(flanked_seqs))
        batch_probs = predict_batch(model, flanked_seqs[start:end])
        for i, probs in enumerate(batch_probs):
            all_probs[start + i] = probs

    # Extract paratopes and build outputs
    fasta_lines = []
    paratope_records = []

    for row_idx, row in df.iterrows():
        clonotype_key = str(row["clonotypeKey"])
        all_paratope_parts = []

        for chain_idx, (cdr_cols, _fr_cols) in enumerate(chain_sets):
            for cdr_idx in range(3):
                idx = row_chain_cdr_map[(row_idx, chain_idx, cdr_idx)]
                entry = all_entries[idx]
                probs = all_probs[idx]
                paratope = extract_paratope(
                    entry["cdr_seq"],
                    probs,
                    entry["cdr_start"],
                    entry["cdr_end"],
                    threshold,
                )
                all_paratope_parts.append(paratope)

        paratope_sequence = "====".join(all_paratope_parts)

        if paratope_sequence.replace("====", ""):
            fasta_lines.append(f">s-{clonotype_key}")
            fasta_lines.append(paratope_sequence)

        paratope_records.append(
            {"clonotypeKey": clonotype_key, "paratope_sequence": paratope_sequence}
        )

    # Write FASTA output
    with open("output.fasta", "w") as f:
        f.write("\n".join(fasta_lines) + "\n" if fasta_lines else "")

    # Write paratope sequences TSV
    pd.DataFrame(paratope_records).to_csv(
        "paratope-sequences.tsv", sep="\t", index=False
    )

    print(f"Processed {len(df)} clonotypes")
    print(f"Generated FASTA with {len(fasta_lines) // 2} sequences")
    print(f"Paratope threshold: {threshold}")


if __name__ == "__main__":
    main()
