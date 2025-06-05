'use client';

import { useUserSettingsContext, useDeleteRecipeContext } from "@/context/userContext";
import { Recipe } from "@/types/recipe";
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Grid from '@mui/material/Grid';

export default function FavoritesPage() {
    const userSettings = useUserSettingsContext();
    const deleteRecipe = useDeleteRecipeContext();
    const recipes: Recipe[] = userSettings?.recipes || [];

    const handleDelete = async (id: string) => {
        if (deleteRecipe) {
            await deleteRecipe(id);
        }
    };

    return (
        <Box p={4}>
            <Typography variant="h4" gutterBottom>
                Saved Recipes
            </Typography>

            {recipes.length === 0 ? (
                <Typography>You have no saved recipes.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {recipes.map((recipe) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4}} key={recipe.id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{recipe.name}</Typography>
                                    <IconButton onClick={() => handleDelete(recipe.id)} aria-label="delete">
                                        <DeleteIcon />
                                    </IconButton>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Ingredients:
                                    </Typography>
                                    <ul style={{ marginTop: 0 }}>
                                        {recipe.ingredients.map((ing, idx) => (
                                            <li key={idx}>{ing}</li>
                                        ))}
                                    </ul>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Instructions:
                                    </Typography>
                                    <Typography variant="body2">{recipe.instructions}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
