'use client';

import { useUpdateIngredientsContext, useUserContext, useUserSettingsContext } from "@/context/userContext";
import colors from '@/styles/colors';
import { Recipe } from "@/types/recipe";
import { Box, Button, List, ListItem, TextField, Typography, Link } from "@mui/material";
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
      justifyContent="flex-start"
      minHeight="80vh"
      textAlign="center"
      px={2}
      sx={{ mt: 8 }}
    >
      <Typography variant="h1" sx={{ color: colors.piecemeal_green }}>PieceMeal</Typography>
      <img src="/piecemeal_logo.png" alt="Piecemeal Logo" width={300} height={300} style={{ marginBottom: 20 }} />

      {user ? (
        <>
          <Typography variant="h4" sx={{ color: colors.piecemeal_green }}>
            Welcome, {user.displayName || "friend"}!
          </Typography>

          <Box  width="100%" maxWidth={500}>
            <TextField
              fullWidth
              label="Ingredients on hand (comma-separated)"
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              variant="outlined"
              margin="normal"
            />
            <Button variant="contained" onClick={handleUpdateIngredients} sx={{ backgroundColor: colors.piecemeal_orange, mt: 1 }}>
              Find Matching Saved Recipes
            </Button>
          </Box>

          {filteredRecipes.length > 0 && (
            <Box mt={2}>
              <Typography variant="h5" gutterBottom sx={{color: colors.piecemeal_green}}>Matching Recipes:</Typography>
              <List>
                {filteredRecipes.map((recipe) => (
                  <ListItem key={recipe.id}>
                    <Link
                      href={`/saved/${recipe.id}`}
                      style={{
                        textDecoration: 'none',
                        color: colors.piecemeal_green,
                      }}
                    >
                      {recipe.name}
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </>
      ) : (
        <Typography variant="h5" gutterBottom sx={{ color: colors.piecemeal_green }}>
          Please log in to continue.
        </Typography>
      )}
    </Box>
  );
}
