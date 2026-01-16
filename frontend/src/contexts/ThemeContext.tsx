import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, Theme } from '@mui/material/styles';

type ColorMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ColorMode;
    toggleColorMode: () => void;
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    toggleColorMode: () => { },
    theme: createTheme(),
});

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ColorMode>(() => {
        if (typeof localStorage !== 'undefined') {
            try {
                const savedMode = localStorage.getItem('themeMode');
                if (savedMode === 'light' || savedMode === 'dark') {
                    return savedMode;
                }
            } catch (error) {
                console.warn('Unable to read theme from localStorage:', error);
            }
        }
        return 'light';
    });

    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('themeMode', mode);
            } catch (error) {
                console.warn('Unable to save theme to localStorage:', error);
            }
        }
    }, [mode]);

    const toggleColorMode = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const theme = useMemo(() => {
        return createTheme({
            palette: {
                mode,
                primary: {
                    main: '#0066cc',
                    light: '#4d94ff',
                    dark: '#004499',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#00A8E8',
                    light: '#33b3f0',
                    dark: '#0077a3',
                    contrastText: '#ffffff',
                },
                ...(mode === 'dark'
                    ? {
                        background: {
                            default: '#0f172a', // Deep slate for dashboard feel
                            paper: '#1e293b',   // Lighter slate for cards
                        },
                        text: {
                            primary: '#f8fafc',
                            secondary: '#94a3b8',
                        },
                        divider: '#334155',
                        action: {
                            hover: 'rgba(255, 255, 255, 0.05)',
                            selected: 'rgba(255, 255, 255, 0.08)',
                        },
                    }
                    : {
                        background: {
                            default: '#f8fafc',
                            paper: '#ffffff',
                        },
                        text: {
                            primary: '#1a1a1a',
                            secondary: '#4a4a4a',
                        },
                        divider: '#e2e8f0',
                        action: {
                            hover: 'rgba(0, 102, 204, 0.04)',
                            selected: 'rgba(0, 102, 204, 0.08)',
                        },
                    }),
            },
            typography: {
                fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
                h1: {
                    fontFamily: '"Poppins", "Inter", sans-serif',
                    fontWeight: 700,
                    fontSize: '2.5rem',
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                },
                h2: {
                    fontFamily: '"Poppins", "Inter", sans-serif',
                    fontWeight: 600,
                    fontSize: '2rem',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                },
                h3: {
                    fontFamily: '"Poppins", "Inter", sans-serif',
                    fontWeight: 600,
                    fontSize: '1.75rem',
                    lineHeight: 1.3,
                },
                h4: {
                    fontFamily: '"Poppins", "Inter", sans-serif',
                    fontWeight: 600,
                    fontSize: '1.5rem',
                    lineHeight: 1.4,
                },
                h5: {
                    fontFamily: '"Poppins", "Inter", sans-serif',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    lineHeight: 1.4,
                },
                h6: {
                    fontFamily: '"Poppins", "Inter", sans-serif',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    lineHeight: 1.4,
                },
                body1: {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                },
                body2: {
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                },
                button: {
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                },
            },
            shape: {
                borderRadius: 12,
            },
            shadows: [
                'none',
                '0px 1px 3px rgba(0, 0, 0, 0.05)',
                '0px 4px 8px rgba(0, 0, 0, 0.1)',
                '0px 8px 16px rgba(0, 0, 0, 0.1)',
                '0px 12px 24px rgba(0, 0, 0, 0.15)',
                '0px 16px 32px rgba(0, 0, 0, 0.15)',
                '0px 20px 40px rgba(0, 0, 0, 0.2)',
                '0px 24px 48px rgba(0, 0, 0, 0.2)',
                '0px 28px 56px rgba(0, 0, 0, 0.25)',
                '0px 32px 64px rgba(0, 0, 0, 0.25)',
                '0px 36px 72px rgba(0, 0, 0, 0.3)',
                '0px 40px 80px rgba(0, 0, 0, 0.3)',
                '0px 44px 88px rgba(0, 0, 0, 0.35)',
                '0px 48px 96px rgba(0, 0, 0, 0.35)',
                '0px 52px 104px rgba(0, 0, 0, 0.4)',
                '0px 56px 112px rgba(0, 0, 0, 0.4)',
                '0px 60px 120px rgba(0, 0, 0, 0.45)',
                '0px 64px 128px rgba(0, 0, 0, 0.45)',
                '0px 68px 136px rgba(0, 0, 0, 0.5)',
                '0px 72px 144px rgba(0, 0, 0, 0.5)',
                '0px 76px 152px rgba(0, 0, 0, 0.55)',
                '0px 80px 160px rgba(0, 0, 0, 0.55)',
                '0px 84px 168px rgba(0, 0, 0, 0.6)',
                '0px 88px 176px rgba(0, 0, 0, 0.6)',
                '0px 92px 184px rgba(0, 0, 0, 0.65)',
            ],
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        body: {
                            scrollBehavior: 'smooth',
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            textTransform: 'none',
                            borderRadius: 12,
                            fontWeight: 600,
                            padding: '10px 24px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                            },
                        },
                        contained: {
                            boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
                            '&:hover': {
                                boxShadow: '0 6px 20px rgba(0, 102, 204, 0.4)',
                            },
                        },
                    },
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 16,
                            boxShadow: mode === 'dark'
                                ? '0 4px 20px rgba(0, 0, 0, 0.4)'
                                : '0 4px 20px rgba(0, 0, 0, 0.08)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: mode === 'dark'
                                    ? '0 12px 32px rgba(0, 0, 0, 0.6)'
                                    : '0 12px 32px rgba(0, 0, 0, 0.15)',
                            },
                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            borderRadius: 16,
                            backgroundImage: 'none',
                        },
                        elevation1: {
                            boxShadow: mode === 'dark'
                                ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                                : '0 2px 8px rgba(0, 0, 0, 0.08)',
                        },
                        elevation2: {
                            boxShadow: mode === 'dark'
                                ? '0 4px 12px rgba(0, 0, 0, 0.5)'
                                : '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                        elevation3: {
                            boxShadow: mode === 'dark'
                                ? '0 6px 16px rgba(0, 0, 0, 0.6)'
                                : '0 6px 16px rgba(0, 0, 0, 0.12)',
                        },
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            fontWeight: 500,
                        },
                    },
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: {
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'scale(1.05)',
                            },
                        },
                    },
                },
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            backdropFilter: 'blur(20px)',
                            background: mode === 'dark'
                                ? 'linear-gradient(135deg, #004499 0%, #0077a3 100%)' // Darker gradient
                                : 'linear-gradient(135deg, #0066cc 0%, #00A8E8 100%)',
                        },
                    },
                },
            },
        });
    }, [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleColorMode, theme }}>
            <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
