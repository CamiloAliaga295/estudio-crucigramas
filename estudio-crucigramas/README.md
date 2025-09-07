# Estudio con Crucigramas (React + Vite + Tailwind)

Proyecto base ya integrado para cargar `public/conceptos.json` y pasar los datos a tu app de juegos.

## Requisitos
- Node.js 18 o superior
- npm 9+

## Pasos
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```
3. Abre la URL que muestre Vite (por defecto http://localhost:5173).
4. Pega tu código dentro de `src/EduGamesApp.jsx` (reemplazando el placeholder):
   - Exporta `export default function EduGamesApp({ initialData }) { ... }`
   - Usa `initialData` si no hay dataset en localStorage
   - Mantén `const SHOW_JSON_UPLOAD = false;`

### Dónde pegar el JSON de conceptos
El archivo `public/conceptos.json` ya está agregado con tus datos.
