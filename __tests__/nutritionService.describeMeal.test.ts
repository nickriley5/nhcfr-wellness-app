jest.mock('../utils/ai/aiService', () => ({
  analyzeMealFromText: jest.fn(),
}));
jest.mock('axios', () => ({
  get: jest.fn(),
}));

import { analyzeMealFromText } from '../utils/ai/aiService';
import axios from 'axios';
import { describeMeal } from '../utils/nutritionService';

describe('nutritionService describeMeal', () => {
  beforeEach(() => {
    (analyzeMealFromText as any).mockReset();
    (axios.get as any).mockReset();
  });

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

  it('falls back to USDA when Gemini fails on a simple whole-food query', async () => {
    (analyzeMealFromText as any).mockRejectedValue(new Error('Gemini unavailable'));
    (axios.get as any).mockResolvedValueOnce({
      data: {
        foods: [
          {
            description: 'Apple, raw, with skin',
            foodNutrients: [
              { nutrientName: 'Energy', value: 52 },
              { nutrientName: 'Protein', value: 0.3 },
              { nutrientName: 'Carbohydrate, by difference', value: 14 },
              { nutrientName: 'Total lipid (fat)', value: 0.2 },
            ],
          },
        ],
      },
    });

    const result = await describeMeal('apple');
    expect(result.source).toBe('USDA_GOVERNMENT');
    expect(result.calories).toBe(52);
  });

  it('falls back to FatSecret when Gemini fails and USDA is skipped', async () => {
    (analyzeMealFromText as any).mockRejectedValue(new Error('Gemini unavailable'));
    (axios.get as any)
      .mockResolvedValueOnce({
        data: {
          foods: {
            food: [{ food_id: '12345', food_name: 'Protein Shake' }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          food: {
            food_name: 'Protein Shake',
            servings: {
              serving: {
                calories: '250',
                protein: '30',
                carbohydrate: '20',
                fat: '6',
                serving_description: '1 bottle',
              },
            },
          },
        },
      });

    const result = await describeMeal('post workout protein shake with banana');
    expect(result.source).toBe('FATSECRET_DATABASE');
    expect(result.calories).toBe(250);
    expect(result.protein).toBe(30);
  });
});
