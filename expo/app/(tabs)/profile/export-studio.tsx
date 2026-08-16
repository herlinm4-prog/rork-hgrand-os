import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Layout,
  Paintbrush,
  Type,
  Palette,
  SlidersHorizontal,
  MessageSquareText,
  Check,
  Upload,
  Trash2,
  ImageIcon,
  FileText,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSegment,
  SettingsPicker,
  SettingsSlider,
  SettingsNavRow,
} from '@/components/settings/SettingsRow';
import type {
  DocumentTemplate,
  DocFontFamily,
  DocLineSpacing,
  LogoPosition,
  LogoSize,
  PageSize,
  PdfMargin,
  PageBgColor,
  MealHeadingWeight,
  ContentDensity,
  BulletStyle,
  TipPlacement,
  HeaderStyle,
} from '@/types/settings';

type TabId = 'templates' | 'branding' | 'typography' | 'colors' | 'layout' | 'tips';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TEMPLATE_DATA: { id: DocumentTemplate; name: string; desc: string; features: string[] }[] = [
  {
    id: 'elite-minimal',
    name: 'Elite Minimal',
    desc: 'Diseño limpio y elegante con secciones verticales y headers con color. Referencia profesional.',
    features: ['Secciones verticales', 'Headers con color', 'Bullets limpios', 'Tipografía elegante'],
  },
  {
    id: 'classic',
    name: 'Executive Columns',
    desc: 'Objetivos e hidratación en la parte superior. Diseño estructurado con separaciones sutiles.',
    features: ['Grid estructurado', 'Objetivos al tope', 'Líneas mínimas', 'Look ejecutivo'],
  },
  {
    id: 'modern-bold',
    name: 'Card Sections',
    desc: 'Cada sección como bloque tipo tarjeta. Mayor separación visual y headings grandes.',
    features: ['Bloques tipo tarjeta', 'Mayor separación', 'Headings grandes', 'Alta legibilidad'],
  },
];

const SAMPLE_PREVIEW_COLORS: Record<DocumentTemplate, { accent: string; bg: string }> = {
  'elite-minimal': { accent: '#1B6B3A', bg: '#F8FBF9' },
  'classic': { accent: '#1A4F7A', bg: '#F5F8FC' },
  'modern-bold': { accent: '#7C3AED', bg: '#FAF5FF' },
};

export default function ExportStudioScreen() {
  const { colors } = useTheme();
  const { settings, updateDocuments } = useSettings();
  const d = settings.documents;
  const [activeTab, setActiveTab] = useState<TabId>('templates');


  const tabs: TabDef[] = useMemo(() => [
    { id: 'templates', label: 'Plantillas', icon: <Layout size={16} color={activeTab === 'templates' ? '#000' : colors.textMuted} /> },
    { id: 'branding', label: 'Marca', icon: <Paintbrush size={16} color={activeTab === 'branding' ? '#000' : colors.textMuted} /> },
    { id: 'typography', label: 'Tipografía', icon: <Type size={16} color={activeTab === 'typography' ? '#000' : colors.textMuted} /> },
    { id: 'colors', label: 'Colores', icon: <Palette size={16} color={activeTab === 'colors' ? '#000' : colors.textMuted} /> },
    { id: 'layout', label: 'Layout', icon: <SlidersHorizontal size={16} color={activeTab === 'layout' ? '#000' : colors.textMuted} /> },
    { id: 'tips', label: 'Tips & Pie', icon: <MessageSquareText size={16} color={activeTab === 'tips' ? '#000' : colors.textMuted} /> },
  ], [activeTab, colors.textMuted]);

  const handlePickLogo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        updateDocuments({ logoUri: result.assets[0].uri });
      }
    } catch (e) {
      console.log('Logo pick error:', e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  }, [updateDocuments]);

  const handleRemoveLogo = useCallback(() => {
    Alert.alert('Eliminar logo', '¿Deseas eliminar el logo actual?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => updateDocuments({ logoUri: '' }) },
    ]);
  }, [updateDocuments]);

  const handleResetColors = useCallback(() => {
    Alert.alert('Restablecer colores', '¿Volver a los colores por defecto de la plantilla?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restablecer',
        onPress: () => updateDocuments({
          mealHeadingColor: '#1A1A1A',
          mealHeadingSize: 100,
          mealHeadingWeight: 'bold',
          objectivesHeaderColor: '#1B6B3A',
          hydrationHeaderColor: '#14614A',
          mealsHeaderColor: '#9B1C1C',
          monitoringHeaderColor: '#1A4F7A',
          pageBgColor: 'white',
        }),
      },
    ]);
  }, [updateDocuments]);

  const renderTemplatePreview = useCallback((templateId: DocumentTemplate) => {
    const previewColors = SAMPLE_PREVIEW_COLORS[templateId];
    const isSelected = d.template === templateId;

    return (
      <View style={[styles.previewDoc, { backgroundColor: '#FFFFFF', borderColor: isSelected ? colors.gold : colors.border }]}>
        <View style={[styles.previewHeader, { borderBottomColor: '#222' }]}>
          <View style={[styles.previewLogoPlaceholder, { backgroundColor: '#E0E0E0' }]} />
          <View style={[styles.previewTitleBar, { backgroundColor: '#222' }]} />
          <View style={[styles.previewSubBar, { backgroundColor: '#AAA' }]} />
        </View>

        <View style={styles.previewBody}>
          <View style={[styles.previewSectionHeader, { backgroundColor: previewColors.accent }]} />
          <View style={styles.previewBullets}>
            <View style={[styles.previewBullet, { backgroundColor: '#DDD' }]} />
            <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '70%' }]} />
            <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '55%' }]} />
          </View>

          <View style={[styles.previewSectionHeader, { backgroundColor: '#9B1C1C', marginTop: 8 }]} />
          {templateId === 'modern-bold' ? (
            <View style={[styles.previewCard, { backgroundColor: previewColors.bg, borderColor: previewColors.accent + '30' }]}>
              <View style={[styles.previewBullet, { backgroundColor: '#DDD' }]} />
              <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '60%' }]} />
            </View>
          ) : templateId === 'classic' ? (
            <View style={styles.previewColumns}>
              <View style={styles.previewCol}>
                <View style={[styles.previewBullet, { backgroundColor: '#DDD' }]} />
                <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '80%' }]} />
              </View>
              <View style={styles.previewCol}>
                <View style={[styles.previewBullet, { backgroundColor: '#DDD' }]} />
                <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '75%' }]} />
              </View>
            </View>
          ) : (
            <View style={styles.previewBullets}>
              <View style={[styles.previewBullet, { backgroundColor: '#DDD' }]} />
              <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '65%' }]} />
              <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '80%' }]} />
            </View>
          )}

          <View style={[styles.previewSectionHeader, { backgroundColor: '#1A4F7A', marginTop: 8 }]} />
          <View style={styles.previewBullets}>
            <View style={[styles.previewBullet, { backgroundColor: '#DDD', width: '50%' }]} />
          </View>
        </View>
      </View>
    );
  }, [d.template, colors.gold, colors.border]);

  const renderTemplatesTab = () => (
    <View>
      <Text style={[styles.tabIntro, { color: colors.textSecondary }]}>
        Selecciona el diseño visual base para tus documentos exportados. Cada plantilla tiene un estilo único.
      </Text>

      {TEMPLATE_DATA.map((tmpl) => {
        const isSelected = d.template === tmpl.id;
        return (
          <View key={tmpl.id} style={[styles.templateCard, { backgroundColor: colors.card, borderColor: isSelected ? colors.gold : colors.cardBorder }]}>
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.gold }]}>
                <Check size={12} color="#000" />
                <Text style={styles.selectedBadgeText}>Activa</Text>
              </View>
            )}

            <View style={styles.templatePreviewWrap}>
              {renderTemplatePreview(tmpl.id)}
            </View>

            <View style={styles.templateInfo}>
              <Text style={[styles.templateName, { color: colors.text }]}>{tmpl.name}</Text>
              <Text style={[styles.templateDesc, { color: colors.textMuted }]}>{tmpl.desc}</Text>

              <View style={styles.featureChips}>
                {tmpl.features.map((f, i) => (
                  <View key={i} style={[styles.featureChip, { backgroundColor: colors.elevated }]}>
                    <Text style={[styles.featureChipText, { color: colors.textTertiary }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.templateActions}>
                {!isSelected && (
                  <TouchableOpacity
                    style={[styles.selectBtn, { backgroundColor: colors.gold }]}
                    onPress={() => updateDocuments({ template: tmpl.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectBtnText}>Seleccionar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderBrandingTab = () => (
    <View>
      <Text style={[styles.tabIntro, { color: colors.textSecondary }]}>
        Personaliza la identidad de tu marca en los documentos. El logo y datos del coach aparecerán en cada exportación.
      </Text>

      <SettingsSection title="Logo del Coach">
        <SettingsToggle
          label="Mostrar logo del coach"
          description="Incluir tu logo en los documentos exportados"
          value={d.includeLogo}
          onValueChange={(v) => updateDocuments({ includeLogo: v })}
        />

        {d.includeLogo && (
          <View style={[styles.logoArea, { borderBottomColor: colors.separator }]}>
            {d.logoUri ? (
              <View style={styles.logoPreviewContainer}>
                <View style={[styles.logoPreviewCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Image source={{ uri: d.logoUri }} style={styles.logoPreview} contentFit="contain" />
                </View>
                <View style={styles.logoActions}>
                  <TouchableOpacity
                    style={[styles.logoActionBtn, { backgroundColor: colors.gold + '18' }]}
                    onPress={handlePickLogo}
                    activeOpacity={0.7}
                  >
                    <Upload size={14} color={colors.gold} />
                    <Text style={[styles.logoActionText, { color: colors.gold }]}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.logoActionBtn, { backgroundColor: colors.red + '15' }]}
                    onPress={handleRemoveLogo}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color={colors.red} />
                    <Text style={[styles.logoActionText, { color: colors.red }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.logoUploadArea, { backgroundColor: colors.elevated, borderColor: colors.border }]}
                onPress={handlePickLogo}
                activeOpacity={0.7}
              >
                <View style={[styles.logoUploadIcon, { backgroundColor: colors.gold + '15' }]}>
                  <ImageIcon size={24} color={colors.gold} />
                </View>
                <Text style={[styles.logoUploadTitle, { color: colors.text }]}>Subir Logo</Text>
                <Text style={[styles.logoUploadHint, { color: colors.textMuted }]}>PNG, JPG — Recomendado 512×512px</Text>
              </TouchableOpacity>
            )}

            {!d.logoUri && d.includeLogo && (
              <View style={[styles.noLogoWarning, { backgroundColor: colors.warning + '12' }]}>
                <Text style={[styles.noLogoWarningText, { color: colors.warning }]}>
                  Sube un logo para habilitar la marca en tus documentos.
                </Text>
              </View>
            )}
          </View>
        )}

        {d.includeLogo && d.logoUri ? (
          <>
            <SettingsPicker<LogoPosition>
              label="Posición del logo"
              description="Dónde aparece el logo en el documento"
              options={[
                { value: 'top-left', label: 'Arriba izq.' },
                { value: 'top-center', label: 'Arriba centro' },
                { value: 'top-right', label: 'Arriba der.' },
                { value: 'bottom-left', label: 'Abajo izq.' },
                { value: 'bottom-center', label: 'Abajo centro' },
                { value: 'bottom-right', label: 'Abajo der.' },
              ]}
              selected={d.logoPosition}
              onSelect={(v) => updateDocuments({ logoPosition: v })}
            />
            <SettingsSegment<LogoSize>
              label="Tamaño del logo"
              description="Tamaño relativo del logo en el documento"
              options={[
                { value: 'small', label: 'Pequeño' },
                { value: 'medium', label: 'Mediano' },
                { value: 'large', label: 'Grande' },
              ]}
              selected={d.logoSize}
              onSelect={(v) => updateDocuments({ logoSize: v })}
            />
            <SettingsSlider
              label="Opacidad del logo"
              description="Transparencia del logo en el documento"
              value={d.logoOpacity}
              min={20}
              max={100}
              step={10}
              unit="%"
              onValueChange={(v) => updateDocuments({ logoOpacity: v })}
            />
          </>
        ) : null}
      </SettingsSection>

      <SettingsSection title="Identidad del Coach">
        <SettingsToggle
          label="Mostrar nombre del coach"
          description="Tu nombre aparece en la cabecera del documento"
          value={d.showCoachInfo || false}
          onValueChange={(v) => updateDocuments({ showCoachInfo: v })}
        />
        {d.showCoachInfo && (
          <View style={[styles.inputRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre del Coach</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.elevated, borderColor: colors.border }]}
              value={d.coachName || ''}
              onChangeText={(v) => updateDocuments({ coachName: v })}
              placeholder="Tu nombre o marca"
              placeholderTextColor={colors.textQuaternary}
            />
          </View>
        )}
        <SettingsToggle
          label="Mostrar nombre del atleta"
          description="El nombre del cliente aparece en el encabezado"
          value={d.showAthleteInfo !== false}
          onValueChange={(v) => updateDocuments({ showAthleteInfo: v })}
        />
      </SettingsSection>
    </View>
  );

  const renderTypographyTab = () => (
    <View>
      <Text style={[styles.tabIntro, { color: colors.textSecondary }]}>
        Controla la tipografía de tus documentos para máxima legibilidad y un aspecto profesional.
      </Text>

      <SettingsSection title="Fuente">
        <SettingsPicker<DocFontFamily>
          label="Familia tipográfica"
          description="Fuente principal utilizada en el documento"
          options={[
            { value: 'system', label: 'Sistema (Default)' },
            { value: 'inter', label: 'Inter (Recomendada)' },
            { value: 'roboto', label: 'Roboto (Android)' },
          ]}
          selected={d.docFontFamily || 'system'}
          onSelect={(v) => updateDocuments({ docFontFamily: v })}
        />
      </SettingsSection>

      <SettingsSection title="Tamaño">
        <SettingsSlider
          label="Escala del cuerpo de texto"
          description="Tamaño relativo del texto normal"
          value={d.docFontScale || 100}
          min={90}
          max={120}
          step={5}
          unit="%"
          onValueChange={(v) => updateDocuments({ docFontScale: v })}
        />
        <SettingsSlider
          label="Escala de títulos"
          description="Tamaño relativo de los encabezados de sección"
          value={d.headingScale || 100}
          min={90}
          max={140}
          step={5}
          unit="%"
          onValueChange={(v) => updateDocuments({ headingScale: v })}
        />
      </SettingsSection>

      <SettingsSection title="Espaciado">
        <SettingsSegment<DocLineSpacing>
          label="Interlineado"
          description="Espaciado entre líneas de texto"
          options={[
            { value: 'compact', label: 'Compacto' },
            { value: 'standard', label: 'Estándar' },
            { value: 'spacious', label: 'Amplio' },
          ]}
          selected={d.docLineSpacing || 'standard'}
          onSelect={(v) => updateDocuments({ docLineSpacing: v })}
        />
      </SettingsSection>

      <SettingsSection title="Estilo de Viñetas">
        <SettingsSegment<BulletStyle>
          label="Estilo de bullet"
          description="Forma de las viñetas en listas"
          options={[
            { value: 'dots', label: '● Puntos' },
            { value: 'dashes', label: '— Guiones' },
          ]}
          selected={d.bulletStyle || 'dots'}
          onSelect={(v) => updateDocuments({ bulletStyle: v })}
        />
        <SettingsToggle
          label="Números tabulares"
          description="Alinear estadísticas con números de ancho fijo"
          value={d.showPageNumbers !== false}
          onValueChange={(v) => updateDocuments({ showPageNumbers: v })}
        />
      </SettingsSection>

      <View style={[styles.previewSnippet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.previewSnippetTitle, { color: colors.textMuted }]}>VISTA PREVIA</Text>
        <View style={[styles.snippetDoc, { backgroundColor: '#FFF' }]}>
          <Text style={[styles.snippetHeading, { fontSize: Math.round(14 * ((d.headingScale || 100) / 100)) }]}>OBJETIVO NUTRICIONAL</Text>
          <Text style={[styles.snippetBody, { fontSize: Math.round(12 * ((d.docFontScale || 100) / 100)), lineHeight: Math.round(12 * ((d.docFontScale || 100) / 100) * (d.docLineSpacing === 'compact' ? 1.35 : d.docLineSpacing === 'spacious' ? 1.85 : 1.6)) }]}>
            {d.bulletStyle === 'dashes' ? '—' : '●'} Carbohidratos totales: 320 g
          </Text>
          <Text style={[styles.snippetBody, { fontSize: Math.round(12 * ((d.docFontScale || 100) / 100)), lineHeight: Math.round(12 * ((d.docFontScale || 100) / 100) * (d.docLineSpacing === 'compact' ? 1.35 : d.docLineSpacing === 'spacious' ? 1.85 : 1.6)) }]}>
            {d.bulletStyle === 'dashes' ? '—' : '●'} Proteína: 180 g
          </Text>
        </View>
      </View>
    </View>
  );

  const renderColorsTab = () => {
    const COLOR_PRESETS = [
      { value: '#1B6B3A', label: 'Verde' },
      { value: '#14614A', label: 'Teal' },
      { value: '#9B1C1C', label: 'Rojo' },
      { value: '#1A4F7A', label: 'Azul' },
      { value: '#7C3AED', label: 'Púrpura' },
      { value: '#D97706', label: 'Ámbar' },
      { value: '#222222', label: 'Negro' },
    ];

    const renderColorPicker = (label: string, desc: string, value: string, onChange: (v: string) => void) => (
      <View style={[styles.colorPickerRow, { borderBottomColor: colors.separator }]}>
        <View style={styles.colorPickerInfo}>
          <Text style={[styles.colorPickerLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.colorPickerDesc, { color: colors.textMuted }]}>{desc}</Text>
        </View>
        <View style={styles.colorSwatches}>
          {COLOR_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.colorSwatch,
                { backgroundColor: preset.value },
                value === preset.value && { borderColor: colors.gold, borderWidth: 2 },
              ]}
              onPress={() => onChange(preset.value)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      </View>
    );

    return (
      <View>
        <Text style={[styles.tabIntro, { color: colors.textSecondary }]}>
          Personaliza los colores de las secciones y encabezados del documento. Estos colores afectan el PDF exportado.
        </Text>

        <SettingsSection title="Fondo de Página">
          <SettingsSegment<PageBgColor>
            label="Color de fondo"
            description="Color base de la página del documento"
            options={[
              { value: 'white', label: 'Blanco' },
              { value: 'light-gray', label: 'Gris claro' },
              { value: 'warm-white', label: 'Cálido' },
            ]}
            selected={d.pageBgColor || 'white'}
            onSelect={(v) => updateDocuments({ pageBgColor: v })}
          />
        </SettingsSection>

        <SettingsSection title="Headers de Sección">
          {renderColorPicker(
            'Objetivos Nutricionales',
            'Color del título "OBJETIVO NUTRICIONAL"',
            d.objectivesHeaderColor || '#1B6B3A',
            (v) => updateDocuments({ objectivesHeaderColor: v })
          )}
          {renderColorPicker(
            'Hidratación',
            'Color del título "HIDRATACIÓN Y ELECTROLITOS"',
            d.hydrationHeaderColor || '#14614A',
            (v) => updateDocuments({ hydrationHeaderColor: v })
          )}
          {renderColorPicker(
            'Distribución de Comidas',
            'Color del título "DISTRIBUCIÓN DE COMIDAS"',
            d.mealsHeaderColor || '#9B1C1C',
            (v) => updateDocuments({ mealsHeaderColor: v })
          )}
          {renderColorPicker(
            'Indicaciones / Monitoreo',
            'Color del título "INDICACIONES Y MONITOREO"',
            d.monitoringHeaderColor || '#1A4F7A',
            (v) => updateDocuments({ monitoringHeaderColor: v })
          )}
        </SettingsSection>

        <SettingsSection title="Estilo de Comidas (COMIDA 1, COMIDA 2…)">
          {renderColorPicker(
            'Color del título de comida',
            'Color de los encabezados de cada comida',
            d.mealHeadingColor || '#1A1A1A',
            (v) => updateDocuments({ mealHeadingColor: v })
          )}
          <SettingsSlider
            label="Tamaño del título de comida"
            description="Tamaño relativo del nombre de cada comida"
            value={d.mealHeadingSize || 100}
            min={90}
            max={130}
            step={5}
            unit="%"
            onValueChange={(v) => updateDocuments({ mealHeadingSize: v })}
          />
          <SettingsSegment<MealHeadingWeight>
            label="Peso del título de comida"
            description="Grosor de la fuente del nombre de comida"
            options={[
              { value: 'medium', label: 'Medium' },
              { value: 'bold', label: 'Bold' },
              { value: 'extrabold', label: 'ExtraBold' },
            ]}
            selected={d.mealHeadingWeight || 'bold'}
            onSelect={(v) => updateDocuments({ mealHeadingWeight: v })}
          />
        </SettingsSection>

        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: colors.warning + '12' }]}
          onPress={handleResetColors}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color={colors.warning} />
          <Text style={[styles.resetBtnText, { color: colors.warning }]}>Restablecer colores por defecto</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLayoutTab = () => (
    <View>
      <Text style={[styles.tabIntro, { color: colors.textSecondary }]}>
        Ajusta el diseño general del documento: márgenes, tamaño de página, densidad del contenido y más.
      </Text>

      <SettingsSection title="Página">
        <SettingsSegment<PageSize>
          label="Tamaño de página"
          description="Formato del papel para impresión"
          options={[
            { value: 'letter', label: 'Carta (US)' },
            { value: 'a4', label: 'A4 (Intl.)' },
          ]}
          selected={d.pageSize}
          onSelect={(v) => updateDocuments({ pageSize: v })}
        />
        <SettingsSegment<PdfMargin>
          label="Márgenes"
          description="Espacio entre el contenido y el borde de la página"
          options={[
            { value: 'compact', label: 'Compacto' },
            { value: 'standard', label: 'Estándar' },
          ]}
          selected={d.pdfMargin}
          onSelect={(v) => updateDocuments({ pdfMargin: v })}
        />
      </SettingsSection>

      <SettingsSection title="Densidad">
        <SettingsSegment<ContentDensity>
          label="Densidad del contenido"
          description="Cantidad de espacio entre secciones"
          options={[
            { value: 'compact', label: 'Compacto' },
            { value: 'standard', label: 'Estándar' },
            { value: 'airy', label: 'Espacioso' },
          ]}
          selected={d.contentDensity || 'standard'}
          onSelect={(v) => updateDocuments({ contentDensity: v })}
        />
      </SettingsSection>

      <SettingsSection title="Elementos">
        <SettingsToggle
          label="Numeración de páginas"
          description="Mostrar número de página al pie"
          value={d.showPageNumbers !== false}
          onValueChange={(v) => updateDocuments({ showPageNumbers: v })}
        />
        <SettingsToggle
          label="Línea divisoria de secciones"
          description="Mostrar una línea entre secciones principales"
          value={d.sectionDividerLine !== false}
          onValueChange={(v) => updateDocuments({ sectionDividerLine: v })}
        />
        <SettingsSegment<HeaderStyle>
          label="Estilo de encabezado"
          description="Cuánta información mostrar en la parte superior"
          options={[
            { value: 'full', label: 'Completo' },
            { value: 'minimal', label: 'Mínimo' },
            { value: 'hidden', label: 'Oculto' },
          ]}
          selected={d.headerStyle || 'full'}
          onSelect={(v) => updateDocuments({ headerStyle: v })}
        />
      </SettingsSection>

      <SettingsSection title="Modo de Color">
        <SettingsSegment<'color' | 'monochrome'>
          label="Modo de color"
          description="Documentos a color o en blanco y negro"
          options={[
            { value: 'color', label: 'Color completo' },
            { value: 'monochrome', label: 'Monocromático' },
          ]}
          selected={d.pdfColorMode}
          onSelect={(v) => updateDocuments({ pdfColorMode: v })}
        />
      </SettingsSection>
    </View>
  );

  const renderTipsTab = () => {
    const tipsCount = (d.requiredTips || []).filter(t => t.enabled).length;
    const tipsLabel = tipsCount > 0 ? `${tipsCount} activo${tipsCount > 1 ? 's' : ''}` : 'Ninguno';

    return (
      <View>
        <Text style={[styles.tabIntro, { color: colors.textSecondary }]}>
          Configura los consejos, disclaimers y elementos del pie de página que se agregan automáticamente a cada documento.
        </Text>

        <SettingsSection title="Consejos Requeridos">
          <SettingsToggle
            label="Incluir consejos en documentos"
            description="Agregar frases configuradas al plan exportado"
            value={d.includeRequiredTips !== false}
            onValueChange={(v) => updateDocuments({ includeRequiredTips: v })}
          />
          {d.includeRequiredTips !== false && (
            <>
              <SettingsSegment<TipPlacement>
                label="Ubicación de consejos"
                description="Dónde aparecen los consejos en el documento"
                options={[
                  { value: 'end', label: 'Final del documento' },
                  { value: 'under-monitoring', label: 'Bajo indicaciones' },
                ]}
                selected={d.tipPlacement || 'end'}
                onSelect={(v) => updateDocuments({ tipPlacement: v })}
              />
              <SettingsNavRow
                label="Gestionar Consejos"
                description="Agregar, editar y organizar frases por categoría"
                value={tipsLabel}
                icon={<View style={[styles.navIcon, { backgroundColor: colors.blue + '18' }]}><FileText size={16} color={colors.blue} /></View>}
                onPress={() => router.push('/profile/required-tips')}
              />
            </>
          )}
        </SettingsSection>

        <SettingsSection title="Pie de Página">
          <SettingsToggle
            label="Incluir aviso legal"
            description="Agregar un disclaimer al final del documento"
            value={d.includeDisclaimer}
            onValueChange={(v) => updateDocuments({ includeDisclaimer: v })}
          />
          <SettingsToggle
            label="Bloque de firma"
            description="Espacio para la firma del preparador"
            value={d.addSignatureBlock}
            onValueChange={(v) => updateDocuments({ addSignatureBlock: v })}
          />
          <SettingsToggle
            label="Pie personalizado"
            description="Agregar un texto personalizado al final"
            value={d.footerEnabled || false}
            onValueChange={(v) => updateDocuments({ footerEnabled: v })}
          />
          {d.footerEnabled && (
            <View style={[styles.inputRow, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Texto del pie</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, backgroundColor: colors.elevated, borderColor: colors.border }]}
                value={d.footerText || ''}
                onChangeText={(v) => updateDocuments({ footerText: v })}
                placeholder="Ej: www.tucoaching.com"
                placeholderTextColor={colors.textQuaternary}
              />
            </View>
          )}
        </SettingsSection>

        <SettingsSection title="Por Tipo de Plan">
          <View style={[styles.planTypeInfo, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.planTypeInfoText, { color: colors.textMuted }]}>
              Los consejos pueden activarse automáticamente según el tipo de plan (Cutting, Bulking, Peak Week, etc.). 
              Configura esto dentro de cada consejo individual.
            </Text>
            <TouchableOpacity
              style={[styles.goToTipsBtn, { backgroundColor: colors.gold + '15' }]}
              onPress={() => router.push('/profile/required-tips')}
              activeOpacity={0.7}
            >
              <Text style={[styles.goToTipsBtnText, { color: colors.gold }]}>Ir a Consejos</Text>
              <ChevronRight size={14} color={colors.gold} />
            </TouchableOpacity>
          </View>
        </SettingsSection>
      </View>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'templates': return renderTemplatesTab();
      case 'branding': return renderBrandingTab();
      case 'typography': return renderTypographyTab();
      case 'colors': return renderColorsTab();
      case 'layout': return renderLayoutTab();
      case 'tips': return renderTipsTab();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Export Design Studio', headerTintColor: colors.gold }} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
        <View style={styles.topSection}>
          <View style={[styles.subtitleRow, { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }]}>
            <Sparkles size={16} color={colors.gold} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Elige una plantilla, previsualiza y personaliza cada detalle.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
            style={[styles.tabBarContainer, { borderBottomColor: colors.separator }]}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    isActive && { backgroundColor: colors.gold },
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  {tab.icon}
                  <Text style={[
                    styles.tabLabel,
                    { color: isActive ? '#000' : colors.textMuted },
                    isActive && { fontWeight: '700' as const },
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {renderActiveTab()}
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topSection: {},
  subtitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  tabBarContainer: {
    borderBottomWidth: 0.5,
  },
  tabBar: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabItem: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  spacer: { height: 40 },
  tabIntro: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  templateCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: 'hidden' as const,
  },
  selectedBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#000',
  },
  templatePreviewWrap: {
    padding: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  previewDoc: {
    width: '100%',
    maxWidth: 220,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 160,
  },
  previewHeader: {
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    gap: 4,
  },
  previewLogoPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginBottom: 2,
  },
  previewTitleBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
  },
  previewSubBar: {
    width: '50%',
    height: 3,
    borderRadius: 2,
  },
  previewBody: {
    gap: 4,
  },
  previewSectionHeader: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  previewBullets: {
    gap: 3,
    paddingLeft: 4,
  },
  previewBullet: {
    width: '85%',
    height: 3,
    borderRadius: 2,
  },
  previewCard: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 6,
    gap: 3,
  },
  previewColumns: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  previewCol: {
    flex: 1,
    gap: 3,
  },
  templateInfo: {
    padding: 16,
    paddingTop: 8,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  featureChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 14,
  },
  featureChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  templateActions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  selectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#000',
  },
  logoArea: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  logoPreviewContainer: {
    gap: 12,
  },
  logoPreviewCard: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden' as const,
    alignSelf: 'center' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  logoPreview: {
    width: 80,
    height: 80,
  },
  logoActions: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  logoActionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  logoUploadArea: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  logoUploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 2,
  },
  logoUploadTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  logoUploadHint: {
    fontSize: 11,
  },
  noLogoWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  noLogoWarningText: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  inputRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewSnippet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  previewSnippetTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
  },
  snippetDoc: {
    borderRadius: 8,
    padding: 14,
  },
  snippetHeading: {
    fontWeight: '800' as const,
    color: '#1B6B3A',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  snippetBody: {
    color: '#333',
    marginBottom: 3,
  },
  colorPickerRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  colorPickerInfo: {
    marginBottom: 10,
  },
  colorPickerLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  colorPickerDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  colorSwatches: {
    flexDirection: 'row' as const,
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  resetBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  planTypeInfo: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  planTypeInfoText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  goToTipsBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center' as const,
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goToTipsBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
