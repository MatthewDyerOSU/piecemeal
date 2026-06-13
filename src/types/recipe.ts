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

export type RecipeComment = {
  id: string;
  recipe_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};
