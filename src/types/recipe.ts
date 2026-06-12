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
  created_at: string;
};
