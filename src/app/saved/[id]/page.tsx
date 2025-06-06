'use client';

import { useParams } from 'next/navigation';
import { useUserSettingsContext } from '@/context/userContext';
import { Typography, Box } from '@mui/material';
import colors from '@/styles/colors';


export default function RecipeDetailPage() {
  const { id } = useParams();
  const userSettings = useUserSettingsContext();

  const recipe = userSettings?.recipes.find(r => r.id === id);

  if (!recipe) {
    return <Typography>Recipe not found.</Typography>;
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom sx={{color: colors.piecemeal_green}}>{recipe.name} </Typography>

      <Typography variant="subtitle1">Ingredients:</Typography>
      <ul>
        {recipe.ingredients.map((ing, idx) => (
          <li key={idx}>{ing}</li>
        ))}
      </ul>

      <Typography variant="subtitle1">Instructions:</Typography>
      <Typography variant="body1">{recipe.instructions}</Typography>
    </Box>
  );
}