/**
 * 🎨 Rowi Design Tokens
 * ---------------------------------------------------------
 * Sistema centralizado de diseño que permite personalización
 * por Tenant/Hub. Estos tokens se convierten en CSS variables.
 */

export interface ThemeTokens {
  // ============ Colores Principales ============
  colors: {
    primary: string;        // Color principal (botones, links, accent)
    secondary: string;      // Color secundario (highlights, badges)
    accent?: string;        // Color de acento opcional

    // Fondos
    background: string;     // Fondo principal
    backgroundAlt: string;  // Fondo alternativo (cards, modals)
    surface: string;        // Superficie elevada

    // Textos
    foreground: string;     // Texto principal
    muted: string;          // Texto secundario

    // Estados
    success: string;
    warning: string;
    error: string;
    info: string;

    // Bordes
    border: string;
    borderHover: string;
  };

  // ============ SEI/KCG Colores ============
  sei?: {
    k: string;  // Know Yourself
    c: string;  // Choose Yourself
    g: string;  // Give Yourself
  };

  // ============ Tipografía ============
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };

  // ============ Espaciado (scale) ============
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };

  // ============ Bordes ============
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  // ============ Sombras ============
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };

  // ============ Transiciones ============
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

/**
 * Tokens por defecto de Rowi
 */
export const defaultTokens: ThemeTokens = {
  colors: {
    primary: '#31a2e3',      // Azul Rowi
    secondary: '#f378a5',    // Rosa Rowi
    accent: '#7a59c9',       // Violeta

    background: '#f7f9fb',
    backgroundAlt: '#ffffff',
    surface: '#ffffff',

    foreground: '#1a1c1e',
    muted: '#6b7280',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    border: '#e5e7eb',
    borderHover: '#d1d5db',
  },

  sei: {
    k: '#1E88E5',
    c: '#7A59C9',
    g: '#43A047',
  },

  fonts: {
    heading: '"Varela Round", system-ui, sans-serif',
    body: '"Poppins", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
};

/**
 * Tokens para modo oscuro (derivados del default)
 */
export const darkTokens: Partial<ThemeTokens> = {
  colors: {
    primary: '#5bc0eb',      // Azul más brillante
    secondary: '#ff8fd4',    // Rosa más brillante
    accent: '#a78bfa',

    background: '#0f1115',
    backgroundAlt: '#1a1e23',
    surface: '#1f2937',

    foreground: '#f3f4f6',
    muted: '#9ca3af',

    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',

    border: '#374151',
    borderHover: '#4b5563',
  },
};

/**
 * Convierte tokens a variables CSS
 */
export function tokensToCSS(tokens: ThemeTokens, prefix = 'rowi'): string {
  const vars: string[] = [];

  // Colores
  Object.entries(tokens.colors).forEach(([key, value]) => {
    vars.push(`--${prefix}-${key}: ${value};`);
  });

  // SEI
  if (tokens.sei) {
    Object.entries(tokens.sei).forEach(([key, value]) => {
      vars.push(`--${prefix}-sei-${key}: ${value};`);
    });
  }

  // Fonts
  Object.entries(tokens.fonts).forEach(([key, value]) => {
    vars.push(`--${prefix}-font-${key}: ${value};`);
  });

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    vars.push(`--${prefix}-space-${key}: ${value};`);
  });

  // Radius
  Object.entries(tokens.radius).forEach(([key, value]) => {
    vars.push(`--${prefix}-radius-${key}: ${value};`);
  });

  // Shadows
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    vars.push(`--${prefix}-shadow-${key}: ${value};`);
  });

  // Transitions
  Object.entries(tokens.transitions).forEach(([key, value]) => {
    vars.push(`--${prefix}-transition-${key}: ${value};`);
  });

  return vars.join('\n  ');
}

/**
 * Merge tokens con override parcial
 */
export function mergeTokens(base: ThemeTokens, override: Partial<ThemeTokens>): ThemeTokens {
  return {
    ...base,
    colors: { ...base.colors, ...override.colors },
    sei: override.sei ? { ...base.sei, ...override.sei } : base.sei,
    fonts: { ...base.fonts, ...override.fonts },
    spacing: { ...base.spacing, ...override.spacing },
    radius: { ...base.radius, ...override.radius },
    shadows: { ...base.shadows, ...override.shadows },
    transitions: { ...base.transitions, ...override.transitions },
  };
}
