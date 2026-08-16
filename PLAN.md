# HGRAND OS — Brand Studio, Voice Assistant & Nutrition System

## Nutrition Plan System (Nuevo)

- [x] **Tipos completos** — `MealObjective` (14 objetivos metabólicos), `CardioSection`, `FoodWeightType` (cooked/dry), `NutritionUnitSystem` (metric/imperial)
- [x] **PDF Generator HGRAND** — Premium medical Apple aesthetic: header gris claro, títulos verde elegante, pesos exactos cocidos/secos, objetivos por comida, sección cardio
- [x] **Meal Plan Builder** — Editable completo: objetivos metabólicos por comida, toggle gramos/onzas, peso cocido/seco por alimento, cardio configurable, 3-7 comidas dinámicas
- [x] **StudentsContext** — `updateNutritionPlan` y `deleteNutritionPlan` (igual que trainingPlan)
- [x] **API layer** — `upsertNutritionPlan` y `deleteNutritionPlan` con sync al backend
- [x] **Settings** — `nutritionUnit` (g/oz) en LanguageSettings, guardado en AsyncStorage
- [x] **Food database** — 31 alimentos con weightType, nueva crema de arroz, arroz basmati, pescado blanco, espárragos, judías verdes

## Brand Studio

- **3 plantillas base** — Elite Pro (minimalista dorado), Dark Command (oscuro bold), Wellness Soft (cálido orgánico)
- **Live preview** — Vista previa en tiempo real del diseño que verán los alumnos
- **Paleta de color** — Selector de color principal, acento y fondo con 21 opciones
- **Tipografía** — SF Pro, Helvetica Neue, Georgia + escala y peso de fuente
- **Logo** — Subida, forma (cuadrado/redondeado/circular), tamaño, posición
- **Formas y fondo** — Estilo de bordes (recto/redondeado/cápsula), textura (sólido/grid/gradiente)

## Voice Settings

- **6 voices** — 3 Spanish (Sol ♀, Álvaro ♂, Héctor ♂ grave) + 3 English (Aria ♀, Marcus ♂, Titan ♂ deep)
- **Speed control** — Pausada / Natural / Rápida

## Recent Fixes & Polish (v2)

- [x] **btoa() crash fix** — Cross-platform base64 for TTS audio
- [x] **VoiceOrb performance** — Mic-reactive effect separated, fixed stale Math.random
- [x] **DesignStyle type** — Added missing type
- [x] **ErrorBoundary** — Premium crash recovery
- [x] **Tab bar badges** — Notification + tasks count
- [x] **Language consistency** — All tab labels Spanish
- [x] **Pull-to-refresh** — CommandCenter dashboard
