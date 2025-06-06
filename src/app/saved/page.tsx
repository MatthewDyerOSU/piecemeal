'use client';

import { useUserSettingsContext, useDeleteRecipeContext } from "@/context/userContext";
import { Recipe } from "@/types/recipe";
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Link
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Grid from '@mui/material/Grid';
import colors from '@/styles/colors';


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
            <Typography variant="h4" gutterBottom sx={{ color: colors.piecemeal_green }}>
                Saved Recipes
            </Typography>

            {recipes.length === 0 ? (
                <Typography>You have no saved recipes.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {recipes.map((recipe) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recipe.id}>
                            <Card sx={{
                                display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300, boxShadow: 'o 4px 10px rgba(209, 124, 41, 0.3)',
                                transition: 'box-shadow 0.3s ease-in-out', '&:hover': { boxShadow: '0 6px 16px rgba(209, 124, 41, 0.5)' }
                            }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Link
                                            href={`/saved/${recipe.id}`}
                                            style={{
                                                textDecoration: 'none',
                                                color: colors.piecemeal_green,
                                            }}
                                        >
                                            <Typography variant="h6">{recipe.name}</Typography>
                                        </Link>
                                        <IconButton onClick={() => handleDelete(recipe.id)} aria-label="delete" size="small" sx={{ color: colors.piecemeal_orange }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
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
