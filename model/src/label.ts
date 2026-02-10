export function getDefaultBlockLabel(data: {
  paratopeThreshold?: number;
  similarityType?: 'alignment-score' | 'sequence-identity';
  identity?: number;
  coverageThreshold?: number;
}) {
  const parts: string[] = [];

  parts.push(`Paratope ${data.paratopeThreshold ?? 0.5}`);

  const similarityLabels: Record<string, string> = {
    'alignment-score': 'BLOSUM',
    'sequence-identity': 'Exact Match',
  };
  if (data.similarityType) {
    parts.push(similarityLabels[data.similarityType] ?? '');
  }

  if (data.identity !== undefined) {
    parts.push(`ident:${data.identity}`);
  }

  if (data.coverageThreshold !== undefined) {
    parts.push(`cov:${data.coverageThreshold}`);
  }

  return parts.filter(Boolean).join(', ');
}
