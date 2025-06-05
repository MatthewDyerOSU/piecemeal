
export type Recipe = {
  id: string; // Firebase doc ID or UUID
  name: string;
  ingredients: string[];
  instructions: string;
};