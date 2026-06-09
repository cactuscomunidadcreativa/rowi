import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* =========================================================
         ✳️ Tipografías Oficiales Rowi
         ========================================================= */
      fontFamily: {
        heading: ["Varela Round", "Quicksand", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },

      /* =========================================================
         🎨 Colores Rowi — Manual oficial
         ========================================================= */
      colors: {
        rowi: {
          // Marca nueva: violeta primario. Se mantienen las claves blueDay/blueNight
          // por compatibilidad con clases existentes, pero apuntan al violeta de marca.
          primary: "#7c3aed",     // Violeta Rowi Día (primario de marca)
          primaryNight: "#a78bfa",// Violeta Rowi Noche
          blueDay: "#7c3aed",     // (legacy) ahora violeta primario
          pinkDay: "#f378a5",     // Rosado Intenso Día
          blueNight: "#a78bfa",   // (legacy) ahora violeta noche
          pinkNight: "#ff8fd4",   // Rosado Intenso Noche
          bgDay: "#FFFFFF",       // Fondo Claro [oai_citation:16‡manual_identidad_visual_rowi.pdf](sediment://file_00000000b90461faa732368195807f6f)
          bgNight: "#1A1A2E",     // Fondo Oscuro [oai_citation:17‡manual_identidad_visual_rowi.pdf](sediment://file_00000000b90461faa732368195807f6f)
          fgDay: "#333333",       // Texto Día [oai_citation:18‡manual_identidad_visual_rowi.pdf](sediment://file_00000000b90461faa732368195807f6f)
          fgNight: "#E0E0E0",     // Texto Noche [oai_citation:19‡manual_identidad_visual_rowi.pdf](sediment://file_00000000b90461faa732368195807f6f)
        },

        /* =========================================================
           🌈 SEI Oficial — KCG (según manual)
           ========================================================= */
        sei: {
          ky: "#1E88E5", // Know Yourself [oai_citation:20‡manual_identidad_visual_rowi.pdf](sediment://file_00000000b90461faa732368195807f6f)
          cy: "#E53935", // Choose Yourself [oai_citation:21‡manual_identidad_visual_rowi.pdf](sediment://file_00000000b90461faa732368195807f6f)
          gy: "#43A047", // Give Yourself [oai_citation:22‡manual_identidad_visual_rowi.pdf](sediment://file_00000000b90461faa732368195807f6f)

          /* =============================
             🎯 Extensión Talentos (basado en Rowi)
             ============================= */
          optimism: "#7c3aed", // derivado del violeta Rowi (energía positiva)
          empathy: "#f378a5",  // derivado del rosado Rowi (conexión humana)
          clarity: "#5bc0eb",  // visión clara
          drive: "#ff8fd4",    // derivado del rosado noche (impulso emocional)
          innovation: "#7c3aed", // usa violeta Rowi como base creativa
          balance: "#f378a5",    // usa rosado Rowi como estabilidad emocional
        },

        /* =========================================================
           🎨 Tokens Shadcn (para componentes)
           ========================================================= */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* =========================================================
           📊 Paleta de Gráficos / Charts
           ========================================================= */
        chart: {
          "1": "hsl(var(--chart-1, 221.2 83.2% 53.3%))",
          "2": "hsl(var(--chart-2, 142.1 76.2% 36.3%))",
          "3": "hsl(var(--chart-3, 43.8 96.4% 56.3%))",
          "4": "hsl(var(--chart-4, 210 98% 60%))",
          "5": "hsl(var(--chart-5, 348 83% 47%))",
        },
      },

      /* =========================================================
         🧱 Bordes y radio
         ========================================================= */
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
      },

      /* =========================================================
         🔳 Sombras y efectos usados en las tarjetas Rowi
         ========================================================= */
      boxShadow: {
        rowi: "0 2px 12px rgba(124, 58, 237, 0.2)", // sombra violeta suave
        card: "0 4px 20px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;