'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { auth } from "../app/firebase";
import { signOut, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";

import { db } from "../app/firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { Recipe } from "@/types/recipe";


type UserSettings = {
    id: string,
    recipes: Recipe[];
    ingredientsOnHand: string[];
}

type AuthUser = User | null;

const UserContext = createContext<
    | {
        user: AuthUser;
        userSettings: UserSettings | null;
        saveUserSettings: () => void;
        saveRecipe: (recipe: Recipe) => Promise<void>;
        updateIngredients: (ingredients: string[]) => Promise<void>;
        deleteRecipe: (id: string) => Promise<void>;
    }
    | undefined
>(undefined);

export function UserContextProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser>(null);
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

    function saveUserSettings() {
        if (user != null) {
            setUserSettings({
                id: user.uid,
                recipes: [],
                ingredientsOnHand: [],
            });
        }
    }

    useEffect(() => {
        if (userSettings != null) {
            writeUserSettings(userSettings);
        }
    }, [userSettings])

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => findUser(user));
        return unsubscribe;
    }, [])

    async function findUser(user: User | null) {
        setUser(user);

        if (user !== null) {
            setUserSettings(await findUserSettings(user.uid));
        } else {
            setUserSettings(null);
        }
    }

    async function saveRecipe(newRecipe: Recipe) {
        if (!userSettings) return;

        const updatedRecipes = [...(userSettings.recipes || []), newRecipe];
        const newSettings = { ...userSettings, recipes: updatedRecipes };
        setUserSettings(newSettings);

        await writeUserSettings(newSettings);
    }

    async function updateIngredients(ingredients: string[]) {
        if (!userSettings) return;

        const newSettings = { ...userSettings, ingredientsOnHand: ingredients };
        setUserSettings(newSettings);

        await writeUserSettings(newSettings);
    }

    async function deleteRecipe(recipeId: string) {
        if (!userSettings) return;

        const updatedRecipes = userSettings.recipes.filter(r => r.id !== recipeId);
        const newSettings = { ...userSettings, recipes: updatedRecipes };

        setUserSettings(newSettings);
        await writeUserSettings(newSettings);
    }

    return (
        <UserContext.Provider value={{ user, userSettings, saveUserSettings, saveRecipe, updateIngredients, deleteRecipe }}>
            {children}
        </UserContext.Provider>
    );
}

async function findUserSettings(uid: string): Promise<UserSettings> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: uid,
            recipes: data.recipes || [],
            ingredientsOnHand: data.ingredientsOnHand || [],
        };
    } else {
        return {
            id: uid,
            recipes: [],
            ingredientsOnHand: [],
        };
    }
}

function writeUserSettings(userSettings: UserSettings) {
    return setDoc(
        doc(db, "users", userSettings.id),
        {
            recipes: userSettings.recipes,
            ingredientsOnHand: userSettings.ingredientsOnHand,
        },
        { merge: true }
    );
}

export const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
}

export const logOut = () => {
    signOut(auth);
}

export function useUserContext() {
    const context = useContext(UserContext);
    return context?.user;
}

export function useUserSettingsContext() {
    const context = useContext(UserContext);
    return context?.userSettings;
}

export function useSaveUserSettingsContext() {
    const context = useContext(UserContext);
    return context?.saveUserSettings;
}

export function useSaveRecipeContext() {
    const context = useContext(UserContext);
    return context?.saveRecipe;
}

export function useUpdateIngredientsContext() {
    const context = useContext(UserContext);
    return context?.updateIngredients;
}

export function useDeleteRecipeContext() {
  const context = useContext(UserContext);
  return context?.deleteRecipe;
}