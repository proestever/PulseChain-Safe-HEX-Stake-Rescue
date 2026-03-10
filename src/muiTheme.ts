import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

const glassCardDark = {
  background: 'rgba(18, 18, 25, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '14px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
};

const glassCardLight = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  borderRadius: '14px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
};

const sharedTypography = {
  fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h6: { fontWeight: 700, letterSpacing: '-0.01em' },
  subtitle1: { fontWeight: 600 },
};

export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const isDark = mode === 'dark';
  const glassCard = isDark ? glassCardDark : glassCardLight;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#ffffff' : '#1a1a2e',
        light: isDark ? '#ffffff' : '#2d2d4a',
        dark: isDark ? '#cccccc' : '#0f0f1a',
      },
      secondary: {
        main: isDark ? '#a0a0b0' : '#6b7280',
      },
      background: {
        default: isDark ? '#0a0a0f' : '#f0f1f3',
        paper: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
      },
      text: {
        primary: isDark ? '#e8eaed' : '#1a1a2e',
        secondary: isDark ? 'rgba(255, 255, 255, 0.45)' : '#6b7280',
      },
      success: {
        main: isDark ? '#00e676' : '#16a34a',
      },
      warning: {
        main: isDark ? '#ffab00' : '#d97706',
      },
      error: {
        main: isDark ? '#ff4455' : '#dc2626',
      },
    },
    shape: { borderRadius: 14 },
    typography: sharedTypography,
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            ...glassCard,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
              boxShadow: isDark ? '0 6px 28px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.06)',
            },
            // Ensure outlined variant matches the same style
            '&.MuiCard-outlined': {
              ...glassCard,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(10, 10, 15, 0.85)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: isDark ? '0 1px 20px rgba(0, 0, 0, 0.3)' : '0 1px 8px rgba(0, 0, 0, 0.04)',
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            ...glassCard,
            background: isDark ? 'rgba(12, 12, 20, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            backgroundColor: isDark ? '#ffffff' : '#1a1a2e',
            color: isDark ? '#0a0a0f' : '#ffffff',
            borderRadius: '10px',
            fontWeight: 600,
            textTransform: 'none' as const,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: isDark ? '#e0e0e0' : '#2d2d4a',
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e5e7eb',
              color: isDark ? 'rgba(255, 255, 255, 0.25)' : '#9ca3af',
            },
          },
          outlined: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
            color: isDark ? '#e8eaed' : '#1a1a2e',
            borderRadius: '10px',
            textTransform: 'none' as const,
            fontWeight: 600,
            '&:hover': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#ffffff' : '#1a1a2e',
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#0a0a0f' : '#f0f1f3',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '10px',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          },
          head: {
            fontWeight: 700,
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6b7280',
            textTransform: 'uppercase' as const,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: isDark ? '#ffffff' : '#1a1a2e',
          },
        },
      },
    },
  });
}
