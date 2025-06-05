'use client';

import { useUserContext, useUserSettingsContext, useUpdateIngredientsContext } from "@/context/userContext";
import { Recipe } from "@/types/recipe";
import { Typography, Box, TextField, Button, List, ListItem } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const user = useUserContext();
  const userSettings = useUserSettingsContext();
  const updateIngredients = useUpdateIngredientsContext();

  const [ingredientsInput, setIngredientsInput] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  const handleUpdateIngredients = async () => {
    const trimmedIngredients = ingredientsInput
      .split(',')
      .map(i => i.trim().toLowerCase())
      .filter(i => i.length > 0);

    if (updateIngredients) {
      await updateIngredients(trimmedIngredients);
    }

    if (userSettings?.recipes) {
      const matching = userSettings.recipes.filter(recipe =>
        trimmedIngredients.every(ing =>
          recipe.ingredients.some(r => r.toLowerCase().includes(ing))
        )
      );
      setFilteredRecipes(matching);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      px={2}
    >
      <Typography variant="h1" sx={{ color: '#1A4A35' }}>PieceMeal</Typography>
      <img src="/piecemeal_logo.png" alt="Piecemeal Logo" width={300} height={300} style={{ marginBottom: 20 }} />

      {user ? (
        <>
          <Typography variant="h4" sx={{ color: '#1A4A35' }}>
            Welcome, {user.displayName || "friend"}!
          </Typography>

          <Box mt={4} width="100%" maxWidth={500}>
            <TextField
              fullWidth
              label="Ingredients on hand (comma-separated)"
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              variant="outlined"
              margin="normal"
            />
            <Button variant="contained" onClick={handleUpdateIngredients}>
              Find Matching Recipes
            </Button>
          </Box>

          {filteredRecipes.length > 0 && (
            <Box mt={4}>
              <Typography variant="h5" gutterBottom>Matching Recipes:</Typography>
              <List>
                {filteredRecipes.map((recipe) => (
                  <ListItem key={recipe.id}>{recipe.name}</ListItem>
                ))}
              </List>
            </Box>
          )}
        </>
      ) : (
        <Typography variant="h5" gutterBottom sx={{ color: '#1A4A35' }}>
          Please log in to continue.
        </Typography>
      )}
    </Box>
  );
}
