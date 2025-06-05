'use client';

import { useUserContext, useSaveRecipeContext } from "@/context/userContext";
import { Recipe } from "@/types/recipe";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function RecipesPage() {
    const user = useUserContext();
    const saveRecipe = useSaveRecipeContext();
    const [name, setName] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [instructions, setInstructions] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user || !saveRecipe) return;

        setSaving(true);

        const newRecipe: Recipe = {
            id: uuidv4(),
            name,
            ingredients: ingredients.split(",").map(i => i.trim()),
            instructions,
        };

        await saveRecipe(newRecipe);

        setName("");
        setIngredients("");
        setInstructions("");
        setSaving(false);
    };

    return (
        <Box p={4} maxWidth={600} mx="auto">
            <Typography variant="h4" gutterBottom>
                Add a Recipe
            </Typography>

            <TextField
                fullWidth
                label="Recipe Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
            />
            <TextField
                fullWidth
                label="Ingredients (comma-separated)"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                margin="normal"
            />
            <TextField
                fullWidth
                label="Instructions"
                multiline
                minRows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                margin="normal"
            />

            <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving}
                sx={{ mt: 2 }}
            >
                {saving ? "Saving..." : "Save Recipe"}
            </Button>
        </Box>
    );
}
