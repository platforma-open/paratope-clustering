export const similarityTypeOptions = [
  { label: 'Exact Match', value: 'sequence-identity' },
  { label: 'BLOSUM40', value: 'blosum40' },
  { label: 'BLOSUM50', value: 'blosum50' },
  { label: 'BLOSUM62', value: 'blosum62' },
  { label: 'BLOSUM80', value: 'blosum80' },
  { label: 'BLOSUM90', value: 'blosum90' },
] as const;

type SimilarityType = (typeof similarityTypeOptions)[number]['value'];

export function getDefaultBlockLabel(data: {
  paratopeThreshold?: number;
  similarityType?: SimilarityType;
  identity?: number;
  coverageThreshold?: number;
}) {
  const parts: string[] = [];

  parts.push(`Paratope ${data.paratopeThreshold ?? 0.5}`);

  if (data.similarityType) {
    const label = similarityTypeOptions.find((o) => o.value === data.similarityType)?.label ?? 'BLOSUM62';
    parts.push(label);
  }

  if (data.identity !== undefined) {
    parts.push(`ident:${data.identity}`);
  }

  if (data.coverageThreshold !== undefined) {
    parts.push(`cov:${data.coverageThreshold}`);
  }

  return parts.filter(Boolean).join(', ');
}
