export interface NutritionAnalysisResult {
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  items: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  confidence: number; // 0-100
  source: 'gemini-text' | 'gemini-vision';
  detectedPortionSizes: string[];
  warnings?: string[];
  explanation?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toFiniteNumber = (
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number }
): number => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid nutrition response: "${fieldName}" must be a number`);
  }
  if (options?.min !== undefined && num < options.min) {
    throw new Error(`Invalid nutrition response: "${fieldName}" must be >= ${options.min}`);
  }
  if (options?.max !== undefined && num > options.max) {
    throw new Error(`Invalid nutrition response: "${fieldName}" must be <= ${options.max}`);
  }
  return num;
};

function parseNutritionItem(raw: unknown, index: number): NutritionAnalysisResult['items'][number] {
  if (!isRecord(raw)) {
    throw new Error(`Invalid nutrition response: item ${index} is not an object`);
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const quantity = typeof raw.quantity === 'string' ? raw.quantity.trim() : '';

  if (!name) {
    throw new Error(`Invalid nutrition response: item ${index} is missing "name"`);
  }

  return {
    name,
    quantity: quantity || '1 serving',
    calories: Math.round(toFiniteNumber(raw.calories, `items[${index}].calories`, { min: 0 })),
    protein: Math.max(0, Math.round(toFiniteNumber(raw.protein, `items[${index}].protein`, { min: 0 }))),
    carbs: Math.max(0, Math.round(toFiniteNumber(raw.carbs, `items[${index}].carbs`, { min: 0 }))),
    fat: Math.max(0, Math.round(toFiniteNumber(raw.fat, `items[${index}].fat`, { min: 0 }))),
  };
}

export function parseNutritionResult(raw: unknown): NutritionAnalysisResult {
  if (!isRecord(raw)) {
    throw new Error('Invalid nutrition response: expected an object');
  }

  const totalMacrosRaw = raw.totalMacros;
  if (!isRecord(totalMacrosRaw)) {
    throw new Error('Invalid nutrition response: missing "totalMacros"');
  }

  const totalMacros = {
    calories: Math.round(toFiniteNumber(totalMacrosRaw.calories, 'totalMacros.calories', { min: 0 })),
    protein: Math.max(0, Math.round(toFiniteNumber(totalMacrosRaw.protein, 'totalMacros.protein', { min: 0 }))),
    carbs: Math.max(0, Math.round(toFiniteNumber(totalMacrosRaw.carbs, 'totalMacros.carbs', { min: 0 }))),
    fat: Math.max(0, Math.round(toFiniteNumber(totalMacrosRaw.fat, 'totalMacros.fat', { min: 0 }))),
  };

  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items = itemsRaw.map((item, index) => parseNutritionItem(item, index));

  const source =
    raw.source === 'gemini-text' || raw.source === 'gemini-vision'
      ? raw.source
      : 'gemini-text';

  const detectedPortionSizes = Array.isArray(raw.detectedPortionSizes)
    ? raw.detectedPortionSizes.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];

  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : undefined;

  const explanation = typeof raw.explanation === 'string' ? raw.explanation : undefined;

  return {
    totalMacros,
    items,
    confidence: Math.round(toFiniteNumber(raw.confidence, 'confidence', { min: 0, max: 100 })),
    source,
    detectedPortionSizes,
    warnings,
    explanation,
  };
}
