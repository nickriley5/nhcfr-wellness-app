jest.mock('../utils/ai/aiService', () => ({
  analyzeMealFromText: jest.fn(),
}));

import { analyzeMealFromText } from '../utils/ai/aiService';
import { describeMeal } from '../utils/nutritionService';

describe('nutritionService describeMeal', () => {
  it('maps Gemini nutrition result into MealMacroResult', async () => {
    (analyzeMealFromText as any).mockResolvedValue({
      totalMacros: { calories: 700, protein: 50, carbs: 65, fat: 25 },
      items: [
        { name: 'Chicken', quantity: '6 oz', calories: 300, protein: 45, carbs: 0, fat: 8 },
        { name: 'Rice', quantity: '1.5 cups', calories: 400, protein: 5, carbs: 65, fat: 17 },
      ],
      confidence: 88,
      source: 'gemini-text',
      detectedPortionSizes: ['6 oz', '1.5 cups'],
      warnings: [],
    });

    const result = await describeMeal('chicken and rice');

    expect(result.source).toBe('GEMINI_AI');
    expect(result.calories).toBe(700);
    expect(result.protein).toBe(50);
    expect(result.items).toEqual(['6 oz Chicken', '1.5 cups Rice']);
    expect(result.confidence).toBe(88);
    expect(result.itemMacros?.length).toBe(2);
  });
});
