export type IngredientGroup = {
  /** Empty string for ungrouped ingredients (rendered without a heading). */
  name: string;
  items: string[];
};

export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  ingredients: IngredientGroup[];
  instructions: string[];
  tags: string[];
  /** How many people the recipe feeds; null when not set. */
  servings: number | null;
  /** Estimated total time to make, in whole minutes; null when not set. */
  total_minutes: number | null;
  created_at: string;
};

export type RecipeComment = {
  id: string;
  recipe_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};
