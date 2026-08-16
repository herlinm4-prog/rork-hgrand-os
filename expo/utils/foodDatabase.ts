import { FoodDatabaseEntry, FoodCategory, CookingMethod } from '@/types/ai';

/**
 * HGRAND Food Database — Fuente: FatSecret.es
 * Base de datos nutricional masiva con valores por 100g.
 * Organizada por categoría y método de cocción.
 * Todos los valores están normalizados a 100g para autocompletado consistente.
 * Cuando el coach escribe un nombre, el sistema sugiere coincidencias y
 * auto-rellena los macros escalando a la cantidad indicada.
 */
export const FOOD_DATABASE: FoodDatabaseEntry[] = [
  // ═══════════════════════════════════════════════════════════
  // POLLO — Todas las formas de cocción
  // ═══════════════════════════════════════════════════════════
  { id: 'pollo_pechuga_cruda', name: 'Pechuga de pollo cruda', category: 'pollo', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 110, protein: 23.09, carbs: 0, fats: 1.24 },
  { id: 'pollo_pechuga_plancha', name: 'Pechuga de pollo a la plancha', category: 'pollo', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 111, protein: 22.39, carbs: 0, fats: 1.75 },
  { id: 'pollo_pechuga_hervido', name: 'Pechuga de pollo hervida', category: 'pollo', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { id: 'pollo_pechuga_horno', name: 'Pechuga de pollo al horno', category: 'pollo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { id: 'pollo_pechuga_parrilla', name: 'Pechuga de pollo a la parrilla', category: 'pollo', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { id: 'pollo_general', name: 'Pollo (general, con piel)', category: 'pollo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 195, protein: 29.55, carbs: 0, fats: 7.72 },
  { id: 'pollo_asado_parrilla', name: 'Pollo asado a la parrilla o al horno', category: 'pollo', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 237, protein: 27.07, carbs: 0, fats: 13.49 },
  { id: 'pollo_asado_sin_piel', name: 'Pollo asado sin piel', category: 'pollo', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 188, protein: 28.69, carbs: 0, fats: 7.35 },
  { id: 'pollo_muslo_sin_piel', name: 'Contramuslos de pollo sin piel', category: 'pollo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 129, protein: 19, carbs: 0, fats: 5.9 },
  { id: 'pollo_alitas', name: 'Alitas de pollo', category: 'pollo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 290, protein: 21.4, carbs: 0, fats: 21.8 },
  { id: 'pollo_alitas_sin_piel', name: 'Alitas de pollo sin piel', category: 'pollo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 203, protein: 30.5, carbs: 0, fats: 8.1 },
  { id: 'pollo_alitas_fritas', name: 'Alitas de pollo fritas', category: 'pollo', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 319, protein: 20.2, carbs: 5.4, fats: 22.6 },
  { id: 'pollo_fileteado', name: 'Pechuga fileteada de pollo', category: 'pollo', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 110, protein: 22, carbs: 0, fats: 2.1 },
  { id: 'pollo_muslo_deshuesado', name: 'Muslo de pollo deshuesado sin piel', category: 'pollo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 209, protein: 26, carbs: 0, fats: 11 },
  { id: 'pollo_picado', name: 'Pollo picado cocido', category: 'pollo', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 167, protein: 25, carbs: 0, fats: 6.6 },
  { id: 'pollo_albóndigas', name: 'Albóndigas de pollo', category: 'pollo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 200, protein: 18, carbs: 5, fats: 11 },

  // ═══════════════════════════════════════════════════════════
  // CARNE DE RES — Todas las formas de cocción
  // ═══════════════════════════════════════════════════════════
  { id: 'res_general', name: 'Carne de res (general)', category: 'res', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 287, protein: 26.41, carbs: 0, fats: 19.29 },
  { id: 'res_bistec', name: 'Bistec de res', category: 'res', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 135, protein: 21.91, carbs: 0, fats: 4.62 },
  { id: 'res_entrecot', name: 'Entrecot', category: 'res', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 165, protein: 19.62, carbs: 0, fats: 8.95 },
  { id: 'res_asada', name: 'Carne asada', category: 'res', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 267, protein: 25.91, carbs: 0, fats: 17.32 },
  { id: 'res_asada_magra', name: 'Carne asada (sólo magra)', category: 'res', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 168, protein: 30, carbs: 0, fats: 4.5 },
  { id: 'res_molida_95', name: 'Carne de res molida 95% magra', category: 'res', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 137, protein: 21.41, carbs: 0, fats: 5 },
  { id: 'res_molida_85', name: 'Carne molida 85% magra', category: 'res', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 213, protein: 19, carbs: 0, fats: 15 },
  { id: 'res_molida_general', name: 'Carne molida (general)', category: 'res', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 254, protein: 17, carbs: 0, fats: 20 },
  { id: 'res_estofado', name: 'Estofado de carne', category: 'res', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 109, protein: 13.2, carbs: 3.02, fats: 4.63 },
  { id: 'res_lomo', name: 'Lomo de res', category: 'res', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 220, protein: 28, carbs: 0, fats: 11 },
  { id: 'res_solomillo', name: 'Solomillo de res', category: 'res', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 206, protein: 29, carbs: 0, fats: 9 },
  { id: 'res_chuleta', name: 'Chuleta de res', category: 'res', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 271, protein: 25, carbs: 0, fats: 19 },
  { id: 'res_picadillo', name: 'Picadillo de res', category: 'res', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 122, protein: 23, carbs: 0.5, fats: 3.5 },
  { id: 'res_ternera_magra', name: 'Ternera magra', category: 'res', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 167, protein: 25.8, carbs: 0, fats: 6.2 },
  { id: 'res_ternera_general', name: 'Ternera (general)', category: 'res', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 217, protein: 26, carbs: 0, fats: 13 },
  { id: 'res_roja_magra', name: 'Carne roja magra', category: 'res', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 177, protein: 26, carbs: 0, fats: 7.7 },

  // ═══════════════════════════════════════════════════════════
  // CERDO — Todas las formas de cocción
  // ═══════════════════════════════════════════════════════════
  { id: 'cerdo_general', name: 'Carne de cerdo (general)', category: 'cerdo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 271, protein: 27.34, carbs: 0, fats: 17.04 },
  { id: 'cerdo_lomo', name: 'Lomo de cerdo', category: 'cerdo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 136, protein: 20.54, carbs: 0, fats: 5.41 },
  { id: 'cerdo_solomillo', name: 'Solomillo de cerdo', category: 'cerdo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 158, protein: 22.05, carbs: 0, fats: 7.12 },
  { id: 'cerdo_chuleta_sin_hueso', name: 'Chuleta de cerdo sin hueso', category: 'cerdo', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 144, protein: 21.35, carbs: 0, fats: 5.89 },
  { id: 'cerdo_chuleta_general', name: 'Chuleta de cerdo (general)', category: 'cerdo', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 250, protein: 27.91, carbs: 0, fats: 14.57 },
  { id: 'cerdo_bistec', name: 'Bistec de cerdo', category: 'cerdo', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 182, protein: 17.05, carbs: 1.36, fats: 8.8 },
  { id: 'cerdo_aguja', name: 'Aguja de cerdo', category: 'cerdo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 203, protein: 19.22, carbs: 0, fats: 13.4 },
  { id: 'cerdo_tacos', name: 'Cerdo a tacos', category: 'cerdo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 129, protein: 23, carbs: 0, fats: 3.9 },
  { id: 'cerdo_filete_lomo', name: 'Filete de lomo de cerdo', category: 'cerdo', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 126, protein: 21, carbs: 1.5, fats: 4 },
  { id: 'cerdo_estofar', name: 'Cerdo troceado para estofar', category: 'cerdo', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 160, protein: 22, carbs: 0.9, fats: 7.6 },
  { id: 'cerdo_picado', name: 'Carne de cerdo molida cocida', category: 'cerdo', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 254, protein: 24, carbs: 0, fats: 18 },
  { id: 'cerdo_asado', name: 'Cerdo asado', category: 'cerdo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 271, protein: 27, carbs: 0, fats: 17 },

  // ═══════════════════════════════════════════════════════════
  // CORDERO
  // ═══════════════════════════════════════════════════════════
  { id: 'cordero_chuleta', name: 'Chuleta de cordero', category: 'cordero', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 314, protein: 22.03, carbs: 0, fats: 24.37 },
  { id: 'cordero_chuleta_pierna', name: 'Chuletas de pierna de cordero', category: 'cordero', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 119, protein: 19.5, carbs: 0.5, fats: 4.6 },
  { id: 'cordero_molida', name: 'Carne molida de cordero', category: 'cordero', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 282, protein: 16.56, carbs: 0, fats: 23.41 },
  { id: 'cordero_general', name: 'Cordero (general)', category: 'cordero', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 266, protein: 23.93, carbs: 0, fats: 18.15 },
  { id: 'cordero_piernil', name: 'Pierna de cordero', category: 'cordero', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 185, protein: 18.99, carbs: 0, fats: 11.5 },
  { id: 'cordero_pierna_magra', name: 'Pierna de cordero magra', category: 'cordero', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 162, protein: 25, carbs: 0, fats: 6 },

  // ═══════════════════════════════════════════════════════════
  // PAVO
  // ═══════════════════════════════════════════════════════════
  { id: 'pavo_pechuga_cruda', name: 'Pechuga de pavo cruda', category: 'pavo', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 104, protein: 22.5, carbs: 0, fats: 1.2 },
  { id: 'pavo_pechuga_horno', name: 'Pechuga de pavo al horno', category: 'pavo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 126, protein: 27, carbs: 0, fats: 1.5 },
  { id: 'pavo_general', name: 'Pavo (general)', category: 'pavo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 135, protein: 30, carbs: 0, fats: 1.8 },
  { id: 'pavo_molido', name: 'Carne de pavo molida cocida', category: 'pavo', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 154, protein: 27, carbs: 0, fats: 4.5 },
  { id: 'pavo_molido_93', name: 'Pavo molido 93% magra', category: 'pavo', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 170, protein: 25, carbs: 0, fats: 7 },
  { id: 'pavo_jamón', name: 'Jamón de pavo', category: 'pavo', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 97, protein: 22, carbs: 1.5, fats: 0.8 },
  { id: 'pavo_albóndigas', name: 'Albóndigas de pavo', category: 'pavo', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 185, protein: 19, carbs: 4, fats: 9 },
  { id: 'pavo_bacon', name: 'Bacon de pavo', category: 'pavo', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 149, protein: 25, carbs: 1, fats: 4 },

  // ═══════════════════════════════════════════════════════════
  // PESCADO BLANCO — Todas las formas de cocción
  // ═══════════════════════════════════════════════════════════
  { id: 'pblanco_general', name: 'Pescado blanco (general)', category: 'pescado_blanco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 134, protein: 19.09, carbs: 0, fats: 5.86 },
  { id: 'pblanco_plancha', name: 'Pescado blanco a la plancha', category: 'pescado_blanco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 110, protein: 22.73, carbs: 0.24, fats: 1.18 },
  { id: 'pblanco_horno', name: 'Pescado al horno o hervido', category: 'pescado_blanco', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 126, protein: 21.94, carbs: 0.33, fats: 3.44 },
  { id: 'pblanco_frito', name: 'Pescado frito', category: 'pescado_blanco', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 206, protein: 18.15, carbs: 6.71, fats: 11.42 },
  { id: 'pblanco_cocido', name: 'Pescado blanco cocido', category: 'pescado_blanco', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 172, protein: 24.47, carbs: 0, fats: 7.51 },
  { id: 'merluza', name: 'Merluza', category: 'pescado_blanco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 81, protein: 15.76, carbs: 0, fats: 1.62 },
  { id: 'merluza_horno', name: 'Merluza al horno', category: 'pescado_blanco', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 97, protein: 18.43, carbs: 0, fats: 2 },
  { id: 'lenguado', name: 'Lenguado', category: 'pescado_blanco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 82, protein: 16, carbs: 0, fats: 1.5 },
  { id: 'bacalao', name: 'Bacalao fresco', category: 'pescado_blanco', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 82, protein: 18, carbs: 0, fats: 0.7 },
  { id: 'bacalao_hervido', name: 'Bacalao hervido', category: 'pescado_blanco', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 88, protein: 20, carbs: 0, fats: 0.9 },
  { id: 'tilapia', name: 'Tilapia', category: 'pescado_blanco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 128, protein: 26, carbs: 0, fats: 2.7 },
  { id: 'rodaballo', name: 'Rodaballo', category: 'pescado_blanco', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 115, protein: 20, carbs: 0, fats: 3.5 },
  { id: 'dorada', name: 'Dorada', category: 'pescado_blanco', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 132, protein: 21.38, carbs: 0.41, fats: 4.38 },
  { id: 'rape', name: 'Rape', category: 'pescado_blanco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 76, protein: 16, carbs: 0, fats: 1 },
  { id: 'perca', name: 'Perca', category: 'pescado_blanco', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 91, protein: 19, carbs: 0, fats: 1.5 },

  // ═══════════════════════════════════════════════════════════
  // PESCADO AZUL — Salmón, atún, sardinas, caballa, etc.
  // ═══════════════════════════════════════════════════════════
  { id: 'salmon_plancha', name: 'Salmón a la plancha', category: 'pescado_azul', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 208, protein: 20, carbs: 0, fats: 13 },
  { id: 'salmon_horno', name: 'Salmón al horno', category: 'pescado_azul', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 182, protein: 25, carbs: 0, fats: 8 },
  { id: 'salmon_parrilla', name: 'Salmón a la parrilla', category: 'pescado_azul', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 211, protein: 22, carbs: 0, fats: 13 },
  { id: 'salmon_crudo', name: 'Salmón crudo', category: 'pescado_azul', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 208, protein: 20, carbs: 0, fats: 13 },
  { id: 'salmon_ahumado', name: 'Salmón ahumado', category: 'pescado_azul', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 117, protein: 18, carbs: 0, fats: 4.3 },
  { id: 'atun_fresco', name: 'Atún fresco', category: 'pescado_azul', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 130, protein: 29, carbs: 0, fats: 1 },
  { id: 'atun_horno', name: 'Atún al horno', category: 'pescado_azul', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 139, protein: 28, carbs: 0, fats: 2 },
  { id: 'atun_lata', name: 'Atún en lata (al natural)', category: 'pescado_azul', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 116, protein: 25, carbs: 0, fats: 1.5 },
  { id: 'atun_aceite', name: 'Atún en aceite', category: 'pescado_azul', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 186, protein: 25, carbs: 0, fats: 9 },
  { id: 'trucha_horno', name: 'Trucha al horno o parrilla', category: 'pescado_azul', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 188, protein: 24.37, carbs: 0.41, fats: 9.16 },
  { id: 'trucha_plancha', name: 'Trucha a la plancha', category: 'pescado_azul', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 149, protein: 22, carbs: 0, fats: 6 },
  { id: 'sardinas_parrilla', name: 'Sardinas a la parrilla', category: 'pescado_azul', cookingMethod: 'parrilla', quantity: 100, unit: 'g', weightType: 'cooked', calories: 208, protein: 25, carbs: 0, fats: 12 },
  { id: 'sardinas_lata', name: 'Sardinas en lata', category: 'pescado_azul', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 208, protein: 25, carbs: 0, fats: 12 },
  { id: 'caballa_horno', name: 'Caballa al horno', category: 'pescado_azul', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 205, protein: 23, carbs: 0, fats: 12 },
  { id: 'caballa_lata', name: 'Caballa en lata', category: 'pescado_azul', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 167, protein: 23, carbs: 0, fats: 7.5 },
  { id: 'jurel', name: 'Jurel', category: 'pescado_azul', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 109, protein: 24, carbs: 0, fats: 1 },
  { id: 'boquerones', name: 'Boquerones', category: 'pescado_azul', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 180, protein: 22, carbs: 3, fats: 8 },

  // ═══════════════════════════════════════════════════════════
  // MARISCO
  // ═══════════════════════════════════════════════════════════
  { id: 'gambas_plancha', name: 'Gambas a la plancha', category: 'marisco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 105, protein: 22, carbs: 0.5, fats: 1.5 },
  { id: 'gambas_hervidas', name: 'Gambas hervidas', category: 'marisco', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 99, protein: 21, carbs: 0.3, fats: 1.4 },
  { id: 'langostinos', name: 'Langostinos', category: 'marisco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 88, protein: 18.5, carbs: 0.5, fats: 1 },
  { id: 'mejillones', name: 'Mejillones al vapor', category: 'marisco', cookingMethod: 'al_vapor', quantity: 100, unit: 'g', weightType: 'cooked', calories: 70, protein: 12, carbs: 4, fats: 1.5 },
  { id: 'pulpo', name: 'Pulpo cocido', category: 'marisco', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 82, protein: 14.9, carbs: 2.2, fats: 1 },
  { id: 'calamar', name: 'Calamar a la plancha', category: 'marisco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 92, protein: 15.5, carbs: 3, fats: 1.2 },
  { id: 'calamar_frito', name: 'Calamar frito', category: 'marisco', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 175, protein: 15, carbs: 8, fats: 7.5 },
  { id: 'sepia', name: 'Sepia a la plancha', category: 'marisco', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 79, protein: 16, carbs: 0.8, fats: 0.8 },
  { id: 'langosta', name: 'Langosta hervida', category: 'marisco', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 90, protein: 19, carbs: 0, fats: 0.9 },
  { id: 'cangrejo', name: 'Cangrejo hervido', category: 'marisco', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 97, protein: 19, carbs: 0, fats: 1.5 },
  { id: 'ostras', name: 'Ostras crudas', category: 'marisco', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 68, protein: 7, carbs: 5, fats: 3 },
  { id: 'almejas', name: 'Almejas al vapor', category: 'marisco', cookingMethod: 'al_vapor', quantity: 100, unit: 'g', weightType: 'cooked', calories: 86, protein: 14.7, carbs: 4.6, fats: 0.7 },
  { id: 'preparado_marisco', name: 'Preparado de marisco', category: 'marisco', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 81, protein: 15.2, carbs: 0.7, fats: 1.9 },

  // ═══════════════════════════════════════════════════════════
  // HUEVOS — Todas las formas de cocción
  // ═══════════════════════════════════════════════════════════
  { id: 'huevo_entero_crudo', name: 'Huevo entero crudo', category: 'huevos', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 143, protein: 13, carbs: 0.9, fats: 9.5 },
  { id: 'huevo_entero_cocido', name: 'Huevo entero cocido', category: 'huevos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 150, protein: 12.5, carbs: 0.5, fats: 11.1 },
  { id: 'huevo_grande', name: 'Huevo grande (cocido)', category: 'huevos', cookingMethod: 'hervido', quantity: 50, unit: 'g', weightType: 'cooked', calories: 75, protein: 6.3, carbs: 0.4, fats: 5.3 },
  { id: 'huevo_mediano', name: 'Huevo mediano (cocido)', category: 'huevos', cookingMethod: 'hervido', quantity: 44, unit: 'g', weightType: 'cooked', calories: 66, protein: 5.5, carbs: 0.4, fats: 4.7 },
  { id: 'huevo_frito', name: 'Huevo frito', category: 'huevos', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 196, protein: 13.6, carbs: 0.9, fats: 14.8 },
  { id: 'huevo_revuelto', name: 'Huevo revuelto', category: 'huevos', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 155, protein: 11, carbs: 1.5, fats: 11 },
  { id: 'claras_liquidas', name: 'Claras de huevo líquidas', category: 'huevos', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 48, protein: 10.8, carbs: 0.8, fats: 0.2 },
  { id: 'claras_cocidas', name: 'Claras de huevo cocidas', category: 'huevos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 52, protein: 11, carbs: 0.7, fats: 0.2 },
  { id: 'huevos_pochados', name: 'Huevos pochados', category: 'huevos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 143, protein: 12.5, carbs: 0.5, fats: 9.5 },
  { id: 'tortilla_francesa', name: 'Tortilla francesa (1 huevo)', category: 'huevos', cookingMethod: 'plancha', quantity: 60, unit: 'g', weightType: 'cooked', calories: 93, protein: 7.5, carbs: 0.5, fats: 6.4 },
  { id: 'tortilla_claras', name: 'Tortilla de claras (3 claras)', category: 'huevos', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 55, protein: 12, carbs: 0.8, fats: 0.2 },
  { id: 'huevos_pasados', name: 'Huevos pasados por agua', category: 'huevos', cookingMethod: 'hervido', quantity: 50, unit: 'g', weightType: 'cooked', calories: 72, protein: 6.1, carbs: 0.4, fats: 5 },

  // ═══════════════════════════════════════════════════════════
  // LÁCTEOS
  // ═══════════════════════════════════════════════════════════
  { id: 'yogur_griego', name: 'Yogur griego natural', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
  { id: 'yogur_griego_entero', name: 'Yogur griego entero', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 97, protein: 9, carbs: 4, fats: 5 },
  { id: 'yogur_natural', name: 'Yogur natural', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 63, protein: 5.25, carbs: 7.04, fats: 1.55 },
  { id: 'yogur_desnatado', name: 'Yogur desnatado', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 42, protein: 4.9, carbs: 5.6, fats: 0 },
  { id: 'yogur_skyr', name: 'Skyr (yogur islandés)', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 63, protein: 11, carbs: 4, fats: 0.2 },
  { id: 'yogur_proteico', name: 'Yogur proteico', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 75, protein: 12, carbs: 5, fats: 0.5 },
  { id: 'kefir', name: 'Kéfir', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 41, protein: 3.8, carbs: 4.5, fats: 0.9 },
  { id: 'requeton', name: 'Requesón (cottage cheese)', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 110, protein: 18, carbs: 4.5, fats: 2.3 },
  { id: 'queso_fresco', name: 'Queso fresco', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 98, protein: 11, carbs: 4, fats: 4 },
  { id: 'queso_cottage', name: 'Requesón (cottage cheese)', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
  { id: 'mozzarella_baja', name: 'Mozzarella baja en grasa', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 254, protein: 24.3, carbs: 2.8, fats: 16.8 },
  { id: 'mozzarella_fresca', name: 'Mozzarella fresca', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 296, protein: 17, carbs: 1, fats: 24 },
  { id: 'queso_curia', name: 'Queso curado', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 350, protein: 22.21, carbs: 4.71, fats: 26.91 },
  { id: 'queso_semicurado', name: 'Queso semicurado', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 417, protein: 25, carbs: 1.5, fats: 34.5 },
  { id: 'queso_manchego', name: 'Queso manchego', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 431, protein: 25, carbs: 1.8, fats: 36 },
  { id: 'queso_parmesano', name: 'Queso parmesano', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 392, protein: 35, carbs: 3.2, fats: 26 },
  { id: 'queso_feta', name: 'Queso feta', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 264, protein: 14, carbs: 4.1, fats: 21 },
  { id: 'leche_entera', name: 'Leche entera', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3 },
  { id: 'leche_desnatada', name: 'Leche desnatada', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 34, protein: 3.4, carbs: 5, fats: 0.1 },
  { id: 'leche_semi', name: 'Leche semidesnatada', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 47, protein: 3.3, carbs: 4.9, fats: 1.7 },
  { id: 'leche_almendras', name: 'Leche de almendras (sin azúcar)', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 13, protein: 0.5, carbs: 0.6, fats: 1.1 },
  { id: 'leche_avena', name: 'Leche de avena', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 45, protein: 1.3, carbs: 7.5, fats: 1.5 },
  { id: 'leche_soja', name: 'Leche de soja', category: 'lacteos', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 33, protein: 2.9, carbs: 1.7, fats: 1.8 },

  // ═══════════════════════════════════════════════════════════
  // ARROZ — Cocido vs seco
  // ═══════════════════════════════════════════════════════════
  { id: 'arroz_blanco_cocido', name: 'Arroz blanco cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 129, protein: 2.66, carbs: 27.9, fats: 0.28 },
  { id: 'arroz_blanco_largo', name: 'Arroz blanco de grano largo cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 130, protein: 2.69, carbs: 28.17, fats: 0.28 },
  { id: 'arroz_basmati_cocido', name: 'Arroz basmati cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 120, protein: 2.5, carbs: 26, fats: 0.3 },
  { id: 'arroz_integral_cocido', name: 'Arroz integral cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 123, protein: 2.7, carbs: 25.6, fats: 1 },
  { id: 'arroz_vaporizado_cocido', name: 'Arroz vaporizado cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 125, protein: 2.8, carbs: 26, fats: 0.4 },
  { id: 'arroz_blanco_seco', name: 'Arroz blanco (seco, crudo)', category: 'arroz', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 351, protein: 7.3, carbs: 77, fats: 1.3 },
  { id: 'arroz_integral_seco', name: 'Arroz integral (seco, crudo)', category: 'arroz', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 344, protein: 8.2, carbs: 75, fats: 1 },
  { id: 'arroz_basmati_seco', name: 'Arroz basmati (seco, crudo)', category: 'arroz', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 355, protein: 9, carbs: 78, fats: 0.6 },
  { id: 'arroz_vaporizado_seco', name: 'Arroz vaporizado (seco, crudo)', category: 'arroz', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 359, protein: 6.56, carbs: 79.24, fats: 0.55 },
  { id: 'crema_arroz', name: 'Crema de arroz (seco)', category: 'arroz', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 370, protein: 7, carbs: 82, fats: 1 },
  { id: 'arroz_jazmin', name: 'Arroz jazmín cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 129, protein: 2.6, carbs: 28, fats: 0.2 },
  { id: 'arroz_negro', name: 'Arroz negro cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 160, protein: 4, carbs: 34, fats: 1.5 },
  { id: 'arroz_rojo', name: 'Arroz rojo cocido', category: 'arroz', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 140, protein: 3, carbs: 30, fats: 1 },

  // ═══════════════════════════════════════════════════════════
  // PASTA — Cocida vs seca
  // ═══════════════════════════════════════════════════════════
  { id: 'pasta_cocida', name: 'Pasta cocida (general)', category: 'pasta', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 131, protein: 5.15, carbs: 24.93, fats: 1.05 },
  { id: 'pasta_seca', name: 'Pasta seca (cruda)', category: 'pasta', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 361, protein: 13, carbs: 72, fats: 1.5 },
  { id: 'pasta_integral_cocida', name: 'Pasta integral cocida', category: 'pasta', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 131, protein: 5.3, carbs: 25, fats: 1.1 },
  { id: 'pasta_integral_seca', name: 'Pasta integral seca', category: 'pasta', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 357, protein: 12.24, carbs: 72.25, fats: 1.39 },
  { id: 'espaguetis_cocidos', name: 'Espaguetis cocidos', category: 'pasta', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 157, protein: 5.76, carbs: 30.68, fats: 0.92 },
  { id: 'espaguetis_secos', name: 'Espaguetis secos', category: 'pasta', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 361, protein: 13, carbs: 72, fats: 1.5 },
  { id: 'macarrones_cocidos', name: 'Macarrones cocidos', category: 'pasta', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 135, protein: 5, carbs: 26, fats: 1 },
  { id: 'macarrones_secos', name: 'Macarrones secos', category: 'pasta', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 347, protein: 13, carbs: 68, fats: 1.5 },
  { id: 'fideos_cocidos', name: 'Fideos cocidos', category: 'pasta', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 138, protein: 5, carbs: 27, fats: 1 },
  { id: 'lasaña_cocida', name: 'Lasaña cocida', category: 'pasta', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 133, protein: 5, carbs: 26, fats: 1.2 },
  { id: 'pasta_arroz', name: 'Pasta de arroz cocida', category: 'pasta', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 96, protein: 1.8, carbs: 21, fats: 0.2 },

  // ═══════════════════════════════════════════════════════════
  // AVENA Y CEREALES — Pesados en seco
  // ═══════════════════════════════════════════════════════════
  { id: 'avena_copos', name: 'Copos de avena (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 362, protein: 15.1, carbs: 48.5, fats: 8.5 },
  { id: 'avena_harina', name: 'Harina de avena (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 384, protein: 12.2, carbs: 59.9, fats: 7.1 },
  { id: 'avena_general', name: 'Avena (general, seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 372, protein: 13.5, carbs: 58.7, fats: 7 },
  { id: 'avena_integral', name: 'Copos de avena integrales suaves (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 361, protein: 11.7, carbs: 60.3, fats: 6 },
  { id: 'cereal_maiz', name: 'Copos de maíz (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 357, protein: 7.5, carbs: 84, fats: 0.5 },
  { id: 'cereales_integrales', name: 'Cereales integrales (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 350, protein: 10, carbs: 70, fats: 2 },
  { id: 'muesli', name: 'Muesli (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 340, protein: 10, carbs: 60, fats: 7 },
  { id: 'granola', name: 'Granola (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 471, protein: 10, carbs: 64, fats: 20 },
  { id: 'quinoa_cocida', name: 'Quinoa cocida', category: 'avena_cereales', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 120, protein: 4.4, carbs: 21.3, fats: 1.9 },
  { id: 'quinoa_seca', name: 'Quinoa seca (cruda)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 368, protein: 14, carbs: 64, fats: 6 },
  { id: 'cuscus_cocido', name: 'Cuscús cocido', category: 'avena_cereales', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 112, protein: 3.8, carbs: 23, fats: 0.2 },
  { id: 'cuscus_seco', name: 'Cuscús seco', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 376, protein: 12.7, carbs: 75, fats: 1 },
  { id: 'trigo_sarraceno', name: 'Trigo sarraceno cocido', category: 'avena_cereales', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 92, protein: 3.4, carbs: 19.9, fats: 1.1 },
  { id: 'harina_maiz', name: 'Harina de maíz (seco)', category: 'avena_cereales', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 361, protein: 7, carbs: 76, fats: 4 },

  // ═══════════════════════════════════════════════════════════
  // PAN
  // ═══════════════════════════════════════════════════════════
  { id: 'pan_blanco', name: 'Pan blanco', category: 'pan', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 265, protein: 9, carbs: 49, fats: 3.2 },
  { id: 'pan_integral', name: 'Pan integral', category: 'pan', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 247, protein: 13, carbs: 41, fats: 4.2 },
  { id: 'pan_centeno', name: 'Pan de centeno', category: 'pan', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 259, protein: 8.5, carbs: 48, fats: 3.3 },
  { id: 'pan_pita', name: 'Pan pita', category: 'pan', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 275, protein: 9.1, carbs: 55, fats: 1.2 },
  { id: 'pan_tortilla', name: 'Tortilla de trigo', category: 'pan', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 304, protein: 8, carbs: 50, fats: 7.5 },
  { id: 'pan_masa_madre', name: 'Pan de masa madre', category: 'pan', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 250, protein: 10, carbs: 47, fats: 3.5 },
  { id: 'pan_espelta', name: 'Pan de espelta', category: 'pan', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 260, protein: 11, carbs: 48, fats: 3.5 },

  // ═══════════════════════════════════════════════════════════
  // LEGUMBRES — Cocidas vs secas
  // ═══════════════════════════════════════════════════════════
  { id: 'garbanzos_cocidos', name: 'Garbanzos cocidos', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 180, protein: 9.54, carbs: 29.98, fats: 2.99 },
  { id: 'garbanzos_secos', name: 'Garbanzos secos', category: 'legumbres', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 364, protein: 19, carbs: 61, fats: 6 },
  { id: 'lentejas_cocidas', name: 'Lentejas cocidas', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 116, protein: 9, carbs: 20, fats: 0.4 },
  { id: 'lentejas_cocidas_2', name: 'Lentejas cocidas (con grasa)', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 165, protein: 8.39, carbs: 18.73, fats: 6.76 },
  { id: 'lentejas_secas', name: 'Lentejas secas', category: 'legumbres', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 343, protein: 25, carbs: 60, fats: 1.1 },
  { id: 'frijoles_cocidos', name: 'Frijoles cocidos', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 127, protein: 8.7, carbs: 22.8, fats: 0.5 },
  { id: 'frijoles_blancos', name: 'Frijoles blancos cocidos', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 139, protein: 9.7, carbs: 25, fats: 0.4 },
  { id: 'frijoles_rojos', name: 'Frijoles rojos cocidos', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 127, protein: 8.7, carbs: 22.8, fats: 0.5 },
  { id: 'frijoles_negros', name: 'Frijoles negros', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 91, protein: 6.03, carbs: 16.56, fats: 0.29 },
  { id: 'frijoles_refritos', name: 'Frijoles refritos (enlatados)', category: 'legumbres', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 94, protein: 5.49, carbs: 15.53, fats: 1.26 },
  { id: 'guisantes_cocidos', name: 'Guisantes cocidos', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 81, protein: 5.42, carbs: 14.46, fats: 0.4 },
  { id: 'guisantes_frescos', name: 'Guisantes frescos cocidos', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 59, protein: 1.82, carbs: 7.61, fats: 3.1 },
  { id: 'soja_cocida', name: 'Soja cocida', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 173, protein: 17, carbs: 9, fats: 9 },
  { id: 'edamame', name: 'Edamame cocido', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 120, protein: 11, carbs: 10, fats: 5 },
  { id: 'habas_cocidas', name: 'Habas cocidas', category: 'legumbres', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 110, protein: 7.6, carbs: 19, fats: 0.5 },

  // ═══════════════════════════════════════════════════════════
  // PATATA Y TUBÉRCULOS
  // ═══════════════════════════════════════════════════════════
  { id: 'patata_cruda', name: 'Patata cruda', category: 'patata_tuberculos', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 70, protein: 1.68, carbs: 15.71, fats: 0.1 },
  { id: 'patata_cocida', name: 'Patata cocida', category: 'patata_tuberculos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 86, protein: 1.71, carbs: 20.01, fats: 0.1 },
  { id: 'patata_asada', name: 'Patata asada', category: 'patata_tuberculos', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 93, protein: 2.49, carbs: 21.04, fats: 0.13 },
  { id: 'patata_plancha', name: 'Patata a la plancha', category: 'patata_tuberculos', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 122, protein: 2.5, carbs: 25, fats: 1.5 },
  { id: 'patata_frita', name: 'Patata frita', category: 'patata_tuberculos', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 273, protein: 3.48, carbs: 35.62, fats: 14.03 },
  { id: 'patata_microondas', name: 'Patata al microondas', category: 'patata_tuberculos', cookingMethod: 'microondas', quantity: 100, unit: 'g', weightType: 'cooked', calories: 70, protein: 1.7, carbs: 15.7, fats: 0.1 },
  { id: 'patata_hervida_entera', name: 'Patata entera cocida', category: 'patata_tuberculos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 57, protein: 1.2, carbs: 12, fats: 0.5 },
  { id: 'patata_congelada', name: 'Patata congelada (frita)', category: 'patata_tuberculos', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 163, protein: 2.2, carbs: 25, fats: 5.5 },
  { id: 'boniato_cocido', name: 'Boniato cocido', category: 'patata_tuberculos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
  { id: 'boniato_horno', name: 'Boniato al horno', category: 'patata_tuberculos', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 90, protein: 2, carbs: 20.7, fats: 0.1 },
  { id: 'yuca_cocida', name: 'Yuca cocida', category: 'patata_tuberculos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 112, protein: 0.98, carbs: 26.8, fats: 0.3 },
  { id: 'calabaza_horno', name: 'Calabaza al horno', category: 'patata_tuberculos', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 45, protein: 1.1, carbs: 10, fats: 0.3 },
  { id: 'remolacha_cocida', name: 'Remolacha cocida', category: 'patata_tuberculos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 44, protein: 1.7, carbs: 9.6, fats: 0.2 },
  { id: 'ñame_cocido', name: 'Ñame cocido', category: 'patata_tuberculos', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 116, protein: 1.5, carbs: 27, fats: 0.1 },

  // ═══════════════════════════════════════════════════════════
  // VERDURAS — Todas las formas de cocción
  // ═══════════════════════════════════════════════════════════
  { id: 'brocoli_hervido', name: 'Brócoli hervido', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 35, protein: 2.4, carbs: 6.6, fats: 0.4 },
  { id: 'brocoli_vapor', name: 'Brócoli al vapor', category: 'verduras', cookingMethod: 'al_vapor', quantity: 100, unit: 'g', weightType: 'cooked', calories: 35, protein: 2.4, carbs: 7, fats: 0.4 },
  { id: 'brocoli_crudo', name: 'Brócoli crudo', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4 },
  { id: 'broccoli_plancha', name: 'Brócoli a la plancha', category: 'verduras', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 51, protein: 4.2, carbs: 10, fats: 0.6 },
  { id: 'espinacas_cocidas', name: 'Espinacas cocidas', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  { id: 'espinacas_crudas', name: 'Espinacas crudas', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  { id: 'espinacas_vapor', name: 'Espinacas al vapor', category: 'verduras', cookingMethod: 'al_vapor', quantity: 100, unit: 'g', weightType: 'cooked', calories: 23, protein: 3, carbs: 3.8, fats: 0.3 },
  { id: 'zucchini_cocido', name: 'Zucchini cocido', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3 },
  { id: 'zucchini_plancha', name: 'Zucchini a la plancha', category: 'verduras', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 25, protein: 1.8, carbs: 4.6, fats: 0.5 },
  { id: 'zucchini_crudo', name: 'Zucchini crudo', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3 },
  { id: 'esparragos_cocidos', name: 'Espárragos cocidos', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 22, protein: 2.2, carbs: 3.9, fats: 0.2 },
  { id: 'esparragos_plancha', name: 'Espárragos a la plancha', category: 'verduras', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 33, protein: 3.3, carbs: 5.8, fats: 0.2 },
  { id: 'esparragos_vapor', name: 'Espárragos al vapor', category: 'verduras', cookingMethod: 'al_vapor', quantity: 100, unit: 'g', weightType: 'cooked', calories: 22, protein: 2.2, carbs: 3.9, fats: 0.2 },
  { id: 'judias_verdes_cocidas', name: 'Judías verdes cocidas', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 31, protein: 1.8, carbs: 6.5, fats: 0.2 },
  { id: 'judias_verdes_vapor', name: 'Judías verdes al vapor', category: 'verduras', cookingMethod: 'al_vapor', quantity: 100, unit: 'g', weightType: 'cooked', calories: 31, protein: 1.8, carbs: 6.5, fats: 0.2 },
  { id: 'coliflor_cocida', name: 'Coliflor cocida', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 23, protein: 1.8, carbs: 4.1, fats: 0.3 },
  { id: 'coliflor_vapor', name: 'Coliflor al vapor', category: 'verduras', cookingMethod: 'al_vapor', quantity: 100, unit: 'g', weightType: 'cooked', calories: 23, protein: 1.8, carbs: 4.1, fats: 0.3 },
  { id: 'col_bruselas', name: 'Coles de Bruselas cocidas', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 42, protein: 3, carbs: 8.8, fats: 1.2 },
  { id: 'col_bruselas_horno', name: 'Coles de Bruselas al horno', category: 'verduras', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 45, protein: 3, carbs: 9, fats: 1.4 },
  { id: 'col_lombarda', name: 'Col lombarda cocida', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 25, protein: 1.5, carbs: 5.5, fats: 0.3 },
  { id: 'repollo_cocido', name: 'Repollo cocido', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 17, protein: 0.9, carbs: 3.9, fats: 0.1 },
  { id: 'lechuga', name: 'Lechuga', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2 },
  { id: 'rucula', name: 'Rúcula', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 25, protein: 2.6, carbs: 3.7, fats: 0.7 },
  { id: 'tomate_crudo', name: 'Tomate crudo', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
  { id: 'tomate_cocido', name: 'Tomate cocido', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 29, protein: 1.5, carbs: 6, fats: 0.2 },
  { id: 'pepino', name: 'Pepino', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1 },
  { id: 'pimiento_verde', name: 'Pimiento verde', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 20, protein: 0.9, carbs: 4.6, fats: 0.2 },
  { id: 'pimiento_rojo', name: 'Pimiento rojo', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 31, protein: 1, carbs: 6, fats: 0.3 },
  { id: 'pimiento_amarillo', name: 'Pimiento amarillo', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 27, protein: 1, carbs: 6.3, fats: 0.2 },
  { id: 'berenjena', name: 'Berenjena cocida', category: 'verduras', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 35, protein: 1, carbs: 8, fats: 0.2 },
  { id: 'calabacin_horno', name: 'Calabacín al horno', category: 'verduras', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 25, protein: 1.8, carbs: 4.6, fats: 0.5 },
  { id: 'apio', name: 'Apio crudo', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 16, protein: 0.7, carbs: 3, fats: 0.2 },
  { id: 'puerro_cocido', name: 'Puerro cocido', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 31, protein: 1.5, carbs: 6.3, fats: 0.5 },
  { id: 'cebolla_cocida', name: 'Cebolla cocida', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 36, protein: 1.1, carbs: 8.2, fats: 0.1 },
  { id: 'cebolla_cruda', name: 'Cebolla cruda', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 40, protein: 1.1, carbs: 9.3, fats: 0.1 },
  { id: 'ajo', name: 'Ajo', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 149, protein: 6.4, carbs: 33, fats: 0.5 },
  { id: 'champiñon', name: 'Champiñones crudos', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 22, protein: 3.3, carbs: 3.3, fats: 0.3 },
  { id: 'champiñon_plancha', name: 'Champiñones a la plancha', category: 'verduras', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 43, protein: 4.5, carbs: 5, fats: 1 },
  { id: 'setas_portobello', name: 'Portobello a la plancha', category: 'verduras', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 35, protein: 3.5, carbs: 5, fats: 0.5 },
  { id: 'alcachofa', name: 'Alcachofa cocida', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 53, protein: 3.6, carbs: 11.7, fats: 0.4 },
  { id: 'acelgas', name: 'Acelgas cocidas', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 19, protein: 1.8, carbs: 3.5, fats: 0.2 },
  { id: 'endivia', name: 'Endibia', category: 'verduras', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 17, protein: 1.3, carbs: 3.4, fats: 0.1 },
  { id: 'maiz', name: 'Maíz dulce', category: 'verduras', cookingMethod: 'hervido', quantity: 100, unit: 'g', weightType: 'cooked', calories: 96, protein: 3.4, carbs: 21, fats: 1.5 },

  // ═══════════════════════════════════════════════════════════
  // FRUTAS
  // ═══════════════════════════════════════════════════════════
  { id: 'platano', name: 'Plátano', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 89, protein: 1.09, carbs: 22.84, fats: 0.33 },
  { id: 'platano_verde', name: 'Plátano verde', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 85, protein: 1.04, carbs: 21.75, fats: 0.31 },
  { id: 'manzana', name: 'Manzana', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 52, protein: 0.26, carbs: 13.81, fats: 0.17 },
  { id: 'pera', name: 'Pera', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 58, protein: 0.38, carbs: 15.46, fats: 0.12 },
  { id: 'naranja', name: 'Naranja', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 47, protein: 0.9, carbs: 11.8, fats: 0.1 },
  { id: 'mandarina', name: 'Mandarina', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 53, protein: 0.8, carbs: 13.3, fats: 0.3 },
  { id: 'limon', name: 'Limón', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 29, protein: 1.1, carbs: 9.3, fats: 0.3 },
  { id: 'fresas', name: 'Fresas', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 32, protein: 0.67, carbs: 7.68, fats: 0.3 },
  { id: 'arandanos', name: 'Arándanos', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 57, protein: 0.7, carbs: 14.5, fats: 0.3 },
  { id: 'frambuesas', name: 'Frambuesas', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 52, protein: 1.2, carbs: 11.9, fats: 0.7 },
  { id: 'moras', name: 'Moras', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 43, protein: 1.4, carbs: 9.6, fats: 0.5 },
  { id: 'kiwi', name: 'Kiwi', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 61, protein: 1.14, carbs: 14.7, fats: 0.52 },
  { id: 'uvas', name: 'Uvas', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 69, protein: 0.7, carbs: 18, fats: 0.2 },
  { id: 'melocoton', name: 'Melocotón', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 39, protein: 0.9, carbs: 9.5, fats: 0.3 },
  { id: 'albaricoque', name: 'Albaricoque', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 48, protein: 1.4, carbs: 11, fats: 0.4 },
  { id: 'cereza', name: 'Cerezas', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 63, protein: 1.1, carbs: 16, fats: 0.2 },
  { id: 'sandia', name: 'Sandía', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 30, protein: 0.6, carbs: 7.5, fats: 0.2 },
  { id: 'melon', name: 'Melón', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 34, protein: 0.8, carbs: 8, fats: 0.2 },
  { id: 'mango', name: 'Mango', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 60, protein: 0.8, carbs: 15, fats: 0.4 },
  { id: 'papaya', name: 'Papaya', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 43, protein: 0.5, carbs: 11, fats: 0.3 },
  { id: 'piña', name: 'Piña', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 50, protein: 0.5, carbs: 13, fats: 0.1 },
  { id: 'pomelo', name: 'Pomelo', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 42, protein: 0.8, carbs: 10.7, fats: 0.1 },
  { id: 'granada', name: 'Granada', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 83, protein: 1.7, carbs: 18.7, fats: 1.2 },
  { id: 'higos', name: 'Higos', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 74, protein: 0.8, carbs: 19, fats: 0.3 },
  { id: 'caqui', name: 'Caqui', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 70, protein: 0.58, carbs: 18.59, fats: 0.19 },
  { id: 'aguacate', name: 'Aguacate', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 160, protein: 2, carbs: 8.5, fats: 14.7 },
  { id: 'coco', name: 'Coco', category: 'frutas', cookingMethod: 'crudo', quantity: 100, unit: 'g', weightType: 'cooked', calories: 354, protein: 3.3, carbs: 15.2, fats: 33.5 },
  { id: 'fruta_ensalada', name: 'Ensalada de frutas', category: 'frutas', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 57, protein: 1.27, carbs: 25, fats: 1.63 },
  { id: 'platano_horneado', name: 'Plátano maduro horneado', category: 'frutas', cookingMethod: 'horno', quantity: 100, unit: 'g', weightType: 'cooked', calories: 157, protein: 1.8, carbs: 35, fats: 1.1 },

  // ═══════════════════════════════════════════════════════════
  // FRUTOS SECOS Y SEMILLAS
  // ═══════════════════════════════════════════════════════════
  { id: 'almendras', name: 'Almendras', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 579, protein: 21, carbs: 22, fats: 50 },
  { id: 'almendras_tostadas', name: 'Almendras tostadas', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 598, protein: 22, carbs: 19, fats: 52 },
  { id: 'nueces', name: 'Nueces', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 654, protein: 15, carbs: 14, fats: 65 },
  { id: 'cacahuetes', name: 'Cacahuetes', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 567, protein: 26, carbs: 16, fats: 49 },
  { id: 'pistachos', name: 'Pistachos', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 560, protein: 20, carbs: 28, fats: 45 },
  { id: 'anacardos', name: 'Anacardos', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 553, protein: 18, carbs: 30, fats: 44 },
  { id: 'avellanas', name: 'Avellanas', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 628, protein: 15, carbs: 17, fats: 61 },
  { id: 'pecanas', name: 'Pecanas', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 691, protein: 9, carbs: 14, fats: 72 },
  { id: 'macadamia', name: 'Macadamia', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 718, protein: 8, carbs: 14, fats: 76 },
  { id: 'pasa', name: 'Pasas', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 299, protein: 3.1, carbs: 79, fats: 0.5 },
  { id: 'daticiles', name: 'Dátiles', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 277, protein: 1.8, carbs: 75, fats: 0.2 },
  { id: 'ciruelas_pasas', name: 'Ciruelas pasas', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 240, protein: 2.2, carbs: 63.9, fats: 0.4 },
  { id: 'orejones_albaricoque', name: 'Orejones de albaricoque', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 241, protein: 3.4, carbs: 62.6, fats: 0.4 },
  { id: 'higos_secos', name: 'Higos secos', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 249, protein: 3.3, carbs: 63.9, fats: 0.9 },
  { id: 'semillas_girasol', name: 'Semillas de girasol', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 584, protein: 21, carbs: 20, fats: 51 },
  { id: 'semillas_calabaza', name: 'Semillas de calabaza', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 541, protein: 25, carbs: 15, fats: 46 },
  { id: 'semillas_chia', name: 'Semillas de chía', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 486, protein: 17, carbs: 42, fats: 31 },
  { id: 'semillas_lino', name: 'Semillas de lino', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 534, protein: 18, carbs: 29, fats: 42 },
  { id: 'semillas_sesamo', name: 'Semillas de sésamo', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 573, protein: 18, carbs: 23, fats: 50 },
  { id: 'mix_frutos', name: 'Mezcla de frutos secos natural', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 625, protein: 18, carbs: 7.5, fats: 56.5 },
  { id: 'frutos_tostados', name: 'Frutos secos tostados', category: 'frutos_secos', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 594, protein: 17.3, carbs: 25.35, fats: 51.45 },
  { id: 'crema_cacahuete', name: 'Crema de cacahuete', category: 'frutos_secos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 588, protein: 25, carbs: 20, fats: 50 },
  { id: 'crema_almendras', name: 'Crema de almendras', category: 'frutos_secos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 614, protein: 21, carbs: 19, fats: 56 },
  { id: 'crema_avellanas', name: 'Crema de avellanas (cacao)', category: 'frutos_secos', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 539, protein: 6.4, carbs: 57.2, fats: 30.9 },

  // ═══════════════════════════════════════════════════════════
  // ACEITES Y GRASAS
  // ═══════════════════════════════════════════════════════════
  { id: 'aceite_oliva_ev', name: 'Aceite de oliva extra virgen', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 884, protein: 0, carbs: 0, fats: 100 },
  { id: 'aceite_oliva', name: 'Aceite de oliva', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 884, protein: 0, carbs: 0, fats: 100 },
  { id: 'aceite_coco', name: 'Aceite de coco', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 862, protein: 0, carbs: 0, fats: 100 },
  { id: 'aceite_girasol', name: 'Aceite de girasol', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 884, protein: 0, carbs: 0, fats: 100 },
  { id: 'aceite_aguacate', name: 'Aceite de aguacate', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 884, protein: 0, carbs: 0, fats: 100 },
  { id: 'aceite_avena', name: 'Aceite de sésamo', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 884, protein: 0, carbs: 0, fats: 100 },
  { id: 'mantequilla', name: 'Mantequilla', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 717, protein: 0.9, carbs: 0.1, fats: 81 },
  { id: 'mantequilla_avena', name: 'Mantequilla de maní', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 588, protein: 25, carbs: 20, fats: 50 },
  { id: 'margarina', name: 'Margarina', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 717, protein: 0.2, carbs: 0.7, fats: 81 },
  { id: 'ghee', name: 'Ghee (mantequilla clarificada)', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 900, protein: 0, carbs: 0, fats: 100 },
  { id: 'manteca_cerdo', name: 'Manteca de cerdo', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 902, protein: 0, carbs: 0, fats: 100 },
  { id: 'mayonesa', name: 'Mayonesa', category: 'aceites_grasas', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 680, protein: 1, carbs: 0.6, fats: 75 },

  // ═══════════════════════════════════════════════════════════
  // VEGETARIANO / VEGANO (TOFU, TEMPEH, SEITAN)
  // ═══════════════════════════════════════════════════════════
  { id: 'tofu_natural', name: 'Tofu natural', category: 'vegetariano', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 110, protein: 11.1, carbs: 0.9, fats: 6.9 },
  { id: 'tofu_general', name: 'Tofu (general)', category: 'vegetariano', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 78, protein: 7.82, carbs: 2.08, fats: 4.93 },
  { id: 'tofu_firme', name: 'Tofu firme', category: 'vegetariano', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 168, protein: 17, carbs: 0.9, fats: 10 },
  { id: 'tofu_algas', name: 'Tofu con algas', category: 'vegetariano', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 95, protein: 7.1, carbs: 3.1, fats: 5.8 },
  { id: 'tempeh', name: 'Tempeh', category: 'vegetariano', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 192, protein: 20.3, carbs: 7.6, fats: 10.8 },
  { id: 'seitan', name: 'Seitan', category: 'vegetariano', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 121, protein: 24, carbs: 3, fats: 0.5 },
  { id: 'heura', name: 'Heura (pollo vegetal)', category: 'vegetariano', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 162, protein: 19, carbs: 8, fats: 5 },
  { id: 'falafel', name: 'Falafel', category: 'vegetariano', cookingMethod: 'frito', quantity: 100, unit: 'g', weightType: 'cooked', calories: 333, protein: 13, carbs: 32, fats: 17 },
  { id: 'hamburguesa_veg', name: 'Hamburguesa vegetal', category: 'vegetariano', cookingMethod: 'plancha', quantity: 100, unit: 'g', weightType: 'cooked', calories: 230, protein: 18, carbs: 12, fats: 11 },

  // ═══════════════════════════════════════════════════════════
  // SUPLEMENTOS
  // ═══════════════════════════════════════════════════════════
  { id: 'whey', name: 'Proteína whey (por scoop)', category: 'suplementos', cookingMethod: 'seco', quantity: 30, unit: 'g', weightType: 'dry', calories: 120, protein: 24, carbs: 3, fats: 1.5 },
  { id: 'whey_isolate', name: 'Whey isolate (por scoop)', category: 'suplementos', cookingMethod: 'seco', quantity: 30, unit: 'g', weightType: 'dry', calories: 110, protein: 27, carbs: 1, fats: 0.5 },
  { id: 'caseina', name: 'Caseína (por scoop)', category: 'suplementos', cookingMethod: 'seco', quantity: 30, unit: 'g', weightType: 'dry', calories: 120, protein: 24, carbs: 3, fats: 1.5 },
  { id: 'plant_protein', name: 'Proteína vegetal (por scoop)', category: 'suplementos', cookingMethod: 'seco', quantity: 30, unit: 'g', weightType: 'dry', calories: 110, protein: 21, carbs: 4, fats: 2 },
  { id: 'bcaa', name: 'BCAA (por scoop)', category: 'suplementos', cookingMethod: 'seco', quantity: 5, unit: 'g', weightType: 'dry', calories: 20, protein: 5, carbs: 0, fats: 0 },
  { id: 'creatina', name: 'Creatina monohidrato (5g)', category: 'suplementos', cookingMethod: 'seco', quantity: 5, unit: 'g', weightType: 'dry', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'barra_proteica', name: 'Barra proteica', category: 'suplementos', cookingMethod: 'preparado', quantity: 60, unit: 'g', weightType: 'cooked', calories: 220, protein: 20, carbs: 20, fats: 6 },
  { id: 'colageno', name: 'Colágeno hidrolizado (10g)', category: 'suplementos', cookingMethod: 'seco', quantity: 10, unit: 'g', weightType: 'dry', calories: 36, protein: 9, carbs: 0, fats: 0 },
  { id: 'aminoacidos', name: 'Aminoácidos esenciales (EAAs)', category: 'suplementos', cookingMethod: 'seco', quantity: 10, unit: 'g', weightType: 'dry', calories: 40, protein: 10, carbs: 0, fats: 0 },
  { id: 'preworkout', name: 'Pre-entreno (1 scoop)', category: 'suplementos', cookingMethod: 'seco', quantity: 10, unit: 'g', weightType: 'dry', calories: 15, protein: 0, carbs: 3.5, fats: 0 },
  { id: 'vitamina_c', name: 'Vitamina C (1g)', category: 'suplementos', cookingMethod: 'seco', quantity: 1, unit: 'g', weightType: 'dry', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'magnesio', name: 'Magnesio (300mg)', category: 'suplementos', cookingMethod: 'seco', quantity: 1, unit: 'g', weightType: 'dry', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'omega3', name: 'Omega-3 (1 cápsula)', category: 'suplementos', cookingMethod: 'preparado', quantity: 1, unit: 'ud', weightType: 'cooked', calories: 10, protein: 0, carbs: 0, fats: 1 },
  { id: 'multivitaminico', name: 'Multivitamínico', category: 'suplementos', cookingMethod: 'preparado', quantity: 1, unit: 'ud', weightType: 'cooked', calories: 0, protein: 0, carbs: 0, fats: 0 },

  // ═══════════════════════════════════════════════════════════
  // OTROS — Bebidas, salsas, misceláneos
  // ═══════════════════════════════════════════════════════════
  { id: 'cafe_negro', name: 'Café negro', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 2, protein: 0.3, carbs: 0, fats: 0 },
  { id: 'cafe_con_leche', name: 'Café con leche', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 35, protein: 1.7, carbs: 2.7, fats: 1.8 },
  { id: 'te_verde', name: 'Té verde', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 1, protein: 0, carbs: 0, fats: 0 },
  { id: 'te_negro', name: 'Té negro', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 1, protein: 0, carbs: 0, fats: 0 },
  { id: 'agua', name: 'Agua', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'zumo_naranja', name: 'Zumo de naranja natural', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 45, protein: 0.7, carbs: 10.4, fats: 0.2 },
  { id: 'zumo_manzana', name: 'Zumo de manzana', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 46, protein: 0.1, carbs: 11.3, fats: 0.1 },
  { id: 'bebida_isotonica', name: 'Bebida isotónica', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 26, protein: 0, carbs: 6, fats: 0 },
  { id: 'miel', name: 'Miel', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 304, protein: 0.3, carbs: 82, fats: 0 },
  { id: 'azucar', name: 'Azúcar blanco', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 387, protein: 0, carbs: 100, fats: 0 },
  { id: 'stevia', name: 'Stevia', category: 'otros', cookingMethod: 'preparado', quantity: 1, unit: 'g', weightType: 'cooked', calories: 0, protein: 0, carbs: 0, fats: 0 },
  { id: 'cacao_puro', name: 'Cacao puro (sin azúcar)', category: 'otros', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 228, protein: 17, carbs: 58, fats: 14 },
  { id: 'chocolate_negro', name: 'Chocolate negro 85%', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 598, protein: 11, carbs: 19, fats: 48 },
  { id: 'canela', name: 'Canela', category: 'otros', cookingMethod: 'seco', quantity: 100, unit: 'g', weightType: 'dry', calories: 247, protein: 4, carbs: 80, fats: 1.2 },
  { id: 'vinagre', name: 'Vinagre de manzana', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 22, protein: 0, carbs: 0.9, fats: 0 },
  { id: 'salsa_soja', name: 'Salsa de soja', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 53, protein: 8, carbs: 4.9, fats: 0.6 },
  { id: 'mostaza', name: 'Mostaza', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 66, protein: 4.4, carbs: 5.3, fats: 4 },
  { id: 'ketchup', name: 'Ketchup', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 112, protein: 1.7, carbs: 25, fats: 0.4 },
  { id: 'hummus', name: 'Hummus', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 166, protein: 8, carbs: 14, fats: 10 },
  { id: 'guacamole', name: 'Guacamole', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 150, protein: 2, carbs: 9, fats: 13 },
  { id: 'mermelada', name: 'Mermelada (sin azúcar)', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 85, protein: 0.5, carbs: 20, fats: 0 },
  { id: 'gelatina', name: 'Gelatina sin azúcar', category: 'otros', cookingMethod: 'preparado', quantity: 100, unit: 'g', weightType: 'cooked', calories: 29, protein: 6, carbs: 0.5, fats: 0 },
  { id: 'caldo', name: 'Caldo de pollo', category: 'otros', cookingMethod: 'hervido', quantity: 100, unit: 'ml', weightType: 'cooked', calories: 12, protein: 2, carbs: 0.5, fats: 0.2 },
];

/**
 * Search food database by name — returns matching entries sorted by relevance.
 * Used for autocomplete suggestions when the coach types in the food input.
 */
export function searchFoods(query: string, limit: number = 15): FoodDatabaseEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  // Exact match first, then starts-with, then includes
  const exact: FoodDatabaseEntry[] = [];
  const starts: FoodDatabaseEntry[] = [];
  const includes: FoodDatabaseEntry[] = [];
  for (const food of FOOD_DATABASE) {
    const name = food.name.toLowerCase();
    if (name === q) {
      exact.push(food);
    } else if (name.startsWith(q)) {
      starts.push(food);
    } else if (name.includes(q)) {
      includes.push(food);
    }
  }
  return [...exact, ...starts, ...includes].slice(0, limit);
}

/**
 * Convert a database entry into a MealPlanFood with a custom quantity.
 * Scales macros proportionally from the 100g base.
 */
export function entryToFood(
  entry: FoodDatabaseEntry,
  quantity: number,
  unit: string
): import('@/types/ai').MealPlanFood {
  const ratio = quantity / entry.quantity;
  const calories = Math.round(entry.calories * ratio);
  const protein = Math.round(entry.protein * ratio * 10) / 10;
  const carbs = Math.round(entry.carbs * ratio * 10) / 10;
  const fats = Math.round(entry.fats * ratio * 10) / 10;
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
    name: entry.name,
    quantity,
    unit,
    weightType: entry.weightType,
    calories,
    protein,
    carbs,
    fats,
    category: entry.category,
    cookingMethod: entry.cookingMethod,
    perUnitCalories: calories / quantity,
    perUnitProtein: protein / quantity,
    perUnitCarbs: carbs / quantity,
    perUnitFats: fats / quantity,
  };
}
