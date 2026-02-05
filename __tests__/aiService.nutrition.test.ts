import { __testables } from '../utils/ai/aiService';

describe('aiService nutrition parsing', () => {
  it('parses and normalizes a valid nutrition response', () => {
    const parsed = __testables.parseNutritionResult({
      totalMacros: { calories: '650', protein: 45, carbs: 60, fat: 22 },
      items: [
        {
          name: 'Grilled Chicken Breast',
          quantity: '6 oz',
          calories: '280',
          protein: 53,
          carbs: 0,
          fat: 6,
        },
      ],
      confidence: '83',
      source: 'gemini-text',
      detectedPortionSizes: ['6 oz'],
      warnings: ['Approximate values'],
    });

    expect(parsed.totalMacros.calories).toBe(650);
    expect(parsed.items[0].name).toBe('Grilled Chicken Breast');
    expect(parsed.confidence).toBe(83);
    expect(parsed.source).toBe('gemini-text');
  });

  it('throws when required nutrition fields are missing', () => {
    expect(() =>
      __testables.parseNutritionResult({
        items: [],
        confidence: 70,
      })
    ).toThrow('missing "totalMacros"');
  });

  it('throws when confidence is out of range', () => {
    expect(() =>
      __testables.parseNutritionResult({
        totalMacros: { calories: 400, protein: 20, carbs: 40, fat: 10 },
        items: [],
        confidence: 120,
      })
    ).toThrow('confidence');
  });

  it('throws when an item is missing name', () => {
    expect(() =>
      __testables.parseNutritionResult({
        totalMacros: { calories: 400, protein: 20, carbs: 40, fat: 10 },
        items: [{ quantity: '1 cup', calories: 100, protein: 3, carbs: 20, fat: 1 }],
        confidence: 70,
      })
    ).toThrow('missing "name"');
  });

  it('applies safe defaults for optional nutrition fields', () => {
    const parsed = __testables.parseNutritionResult({
      totalMacros: { calories: 500, protein: 30, carbs: 50, fat: 20 },
      items: [{ name: 'Oats', calories: 300, protein: 10, carbs: 54, fat: 5 }],
      confidence: 72,
      source: 'unexpected-source',
      detectedPortionSizes: ['1 cup', '', null, 42],
    });

    expect(parsed.items[0].quantity).toBe('1 serving');
    expect(parsed.source).toBe('gemini-text');
    expect(parsed.detectedPortionSizes).toEqual(['1 cup']);
  });
});
