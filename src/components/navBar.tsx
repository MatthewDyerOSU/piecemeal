'use client'

import Link from "next/link"

import { AppBar, Toolbar, Typography, Container, Box, Avatar, Button, IconButton, Menu, MenuItem } from '@mui/material'
import { useUserContext, googleSignIn, logOut } from "@/context/userContext";
import { useState } from "react";

export default function NavBar() {
    const user = useUserContext();

    const [anchor, setAnchor] = useState<null | HTMLElement>(null);
    const open = Boolean(anchor);

    const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(event.currentTarget);
    }

    const handleMenuClose = () => {
        setAnchor(null);
    }

    const handleLogin = () => {
        googleSignIn();
    }

    const handleLogout = () => {
        handleMenuClose();
        logOut();
    }

    return (
        <AppBar position="static" sx={{ backgroundColor: '#1A4A35' }}>
            <Container maxWidth={false}>
                <Toolbar>
                    <Box sx={{ flexGrow: 1, display: "flex", gap: 4, alignItems: "center" }}>
                        <Link href="/" style={{ color: "#fff", textDecoration: 'none' }}>
                            <Typography
                                variant="h6"
                                noWrap
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    letterSpacing: '.3rem',
                                }}
                            >
                                HOME
                            </Typography>
                        </Link>
                        <Link href="/add" style={{ color: "#fff", textDecoration: 'none' }}>
                            <Typography
                                variant="h6"
                                noWrap
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    letterSpacing: '.3rem',
                                }}
                            >
                                ADD
                            </Typography>
                        </Link>
                        <Link href="/saved" style={{ color: "#fff", textDecoration: 'none' }}>
                            <Typography
                                variant="h6"
                                noWrap
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    letterSpacing: '.3rem',
                                }}
                            >
                                SAVED
                            </Typography>
                        </Link>
                    </Box>

                    {user ? (
                        <>
                            <IconButton onClick={handleAvatarClick} sx={{ p: 0 }}>
                                <Avatar alt="User" src={user.photoURL || ""} />
                            </IconButton>
                            <Menu
                                anchorEl={anchor}
                                open={open}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Button color="inherit" onClick={handleLogin}>Login</Button>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
}
