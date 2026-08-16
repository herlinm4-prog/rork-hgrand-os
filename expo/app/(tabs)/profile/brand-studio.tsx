import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Sparkles,
  Upload,
  Trash2,
  Check,
  Type,
  Palette,
  Shapes,
  LayoutGrid,
  ImageIcon,
  User,
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
  SettingsButton,
} from '@/components/settings/SettingsRow';
import type {
  BrandTemplate,
  BrandFont,
  BrandShape,
  BrandBgStyle,
  LogoPosition,
  LogoSize,
  LogoShape,
} from '@/types/settings';
import { BRAND_TEMPLATES, BRAND_FONTS, BRAND_PALETTE } from '@/types/settings';

// ── Mini document preview used in the template selector ─────
function TemplatePreviewCard({
  template,
  selected,
  onSelect,
  colors,
}: {
  template: (typeof BRAND_TEMPLATES)[number];
  selected: boolean;
  onSelect: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const p = template.preview;
  const borderRadius = p.shape === 'pill' ? 24 : p.shape === 'rounded' ? 14 : 4;

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      style={[
        styles.templateCard,
        {
          backgroundColor: selected ? p.primary + '12' : colors.card,
          borderColor: selected ? p.primary : colors.cardBorder,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      {/* Mini document mockup */}
      <View style={[styles.templateMockup, { backgroundColor: p.bg }]}>
        {/* Header bar */}
        <View
          style={[
            styles.mockHeader,
            { backgroundColor: p.primary, borderRadius },
          ]}
        />
        {/* Content lines */}
        <View style={styles.mockLines}>
          <View
            style={[
              styles.mockLine,
              { backgroundColor: p.primary + '30', width: '70%', borderRadius },
            ]}
          />
          <View
            style={[
              styles.mockLine,
              { backgroundColor: p.primary + '15', width: '90%', borderRadius },
            ]}
          />
          <View
            style={[
              styles.mockLine,
              { backgroundColor: p.primary + '12', width: '55%', borderRadius },
            ]}
          />
        </View>
        {/* Accent dot */}
        <View style={[styles.mockDot, { backgroundColor: p.accent }]} />
      </View>

      {/* Label */}
      <View style={styles.templateLabel}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.templateName,
              { color: selected ? p.primary : colors.text },
            ]}
          >
            {template.name}
          </Text>
          <Text
            style={[styles.templateDesc, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {template.description}
          </Text>
        </View>
        {selected && (
          <View style={[styles.checkBadge, { backgroundColor: p.primary }]}>
            <Check size={12} color="#FFF" strokeWidth={3} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Live document preview ──────────────────────────────────
function LiveDocPreview({
  brand,
}: {
  brand: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    fontFamily: BrandFont;
    shapeStyle: BrandShape;
    bgStyle: BrandBgStyle;
    logoUri: string;
    logoShape: LogoShape;
    logoPosition: LogoPosition;
    logoSize: LogoSize;
    showLogo: boolean;
    coachName: string;
    coachSubtitle: string;
  };
}) {
  const br = brand.shapeStyle === 'pill' ? 24 : brand.shapeStyle === 'rounded' ? 14 : 4;
  const isDark = brand.backgroundColor === '#0A0A0A' || brand.backgroundColor === '#1A1A2E' || brand.backgroundColor === '#16213E';
  const textColor = isDark ? '#F3F5F7' : '#1A1A1A';
  const mutedColor = isDark ? '#8E8E93' : '#8E8E93';

  return (
    <View style={[styles.livePreview, { backgroundColor: brand.backgroundColor }]}>
      {/* Background pattern */}
      {brand.bgStyle === 'subtle-grid' && (
        <View style={styles.gridOverlay} />
      )}
      {brand.bgStyle === 'gradient-soft' && (
        <View
          style={[
            styles.gradientOverlay,
            {
              backgroundColor: brand.accentColor + '08',
            },
          ]}
        />
      )}

      {/* Logo */}
      {brand.showLogo && brand.logoUri ? (
        <View
          style={[
            styles.liveLogoWrap,
            brand.logoPosition === 'top-center' && { alignSelf: 'center' },
            brand.logoPosition === 'top-left' && { alignSelf: 'flex-start' },
            brand.logoPosition === 'top-right' && { alignSelf: 'flex-end' },
          ]}
        >
          <View
            style={[
              styles.liveLogo,
              {
                borderRadius: brand.logoShape === 'circle' ? 999 : brand.logoShape === 'rounded' ? 14 : 4,
                width: brand.logoSize === 'small' ? 40 : brand.logoSize === 'large' ? 72 : 56,
                height: brand.logoSize === 'small' ? 40 : brand.logoSize === 'large' ? 72 : 56,
              },
            ]}
          >
            <Image
              source={{ uri: brand.logoUri }}
              style={styles.liveLogoImg}
              contentFit="contain"
            />
          </View>
        </View>
      ) : brand.showLogo ? (
        <View
          style={[
            styles.liveLogoPlaceholder,
            {
              backgroundColor: brand.primaryColor + '18',
              borderRadius: brand.logoShape === 'circle' ? 999 : brand.logoShape === 'rounded' ? 14 : 4,
              alignSelf:
                brand.logoPosition === 'top-center'
                  ? 'center'
                  : brand.logoPosition === 'top-right'
                    ? 'flex-end'
                    : 'flex-start',
            },
          ]}
        >
          <ImageIcon size={20} color={brand.primaryColor} />
        </View>
      ) : null}

      {/* Header */}
      <View
        style={[
          styles.liveHeader,
          {
            backgroundColor: brand.primaryColor,
            borderRadius: br,
          },
        ]}
      >
        <Text
          style={[
            styles.liveHeaderTitle,
            {
              fontFamily: brand.fontFamily === 'georgia' ? 'Georgia' : undefined,
              fontWeight: brand.fontFamily === 'georgia' ? '400' : '700',
            },
          ]}
        >
          {brand.coachName || 'HGRAND OS'}
        </Text>
        {brand.coachSubtitle ? (
          <Text style={styles.liveHeaderSub}>
            {brand.coachSubtitle}
          </Text>
        ) : null}
      </View>

      {/* Content blocks */}
      <View
        style={[
          styles.liveContentBlock,
          { backgroundColor: textColor + '08', borderRadius: br },
        ]}
      >
        <Text
          style={[
            styles.liveContentTitle,
            {
              color: brand.primaryColor,
              fontFamily: brand.fontFamily === 'georgia' ? 'Georgia' : undefined,
              fontWeight: brand.fontFamily === 'georgia' ? '400' : '600',
            },
          ]}
        >
          Plan Nutricional
        </Text>
        <View style={styles.liveContentLines}>
          <View style={[styles.liveCLine, { backgroundColor: textColor + '20', width: '80%' }]} />
          <View style={[styles.liveCLine, { backgroundColor: textColor + '14', width: '95%' }]} />
          <View style={[styles.liveCLine, { backgroundColor: textColor + '10', width: '60%' }]} />
        </View>
      </View>

      <View
        style={[
          styles.liveContentBlock,
          { backgroundColor: brand.accentColor + '0D', borderRadius: br },
        ]}
      >
        <Text
          style={[
            styles.liveContentTitle,
            {
              color: brand.accentColor,
              fontFamily: brand.fontFamily === 'georgia' ? 'Georgia' : undefined,
              fontWeight: brand.fontFamily === 'georgia' ? '400' : '600',
            },
          ]}
        >
          Objetivos
        </Text>
        <View style={styles.liveContentLines}>
          <View style={[styles.liveCLine, { backgroundColor: brand.accentColor + '20', width: '70%' }]} />
          <View style={[styles.liveCLine, { backgroundColor: brand.accentColor + '14', width: '50%' }]} />
        </View>
      </View>

      {/* Footer accent */}
      <View
        style={[
          styles.liveFooter,
          { backgroundColor: brand.primaryColor + '18', borderRadius: br / 2 },
        ]}
      >
        <Text style={[styles.liveFooterText, { color: mutedColor }]}>
          Generado por {brand.coachName || 'HGRAND OS'}
        </Text>
      </View>
    </View>
  );
}

// ── Color dot picker ───────────────────────────────────────
function ColorPicker({
  colors: palette,
  selected,
  onSelect,
  themeColors,
}: {
  colors: string[];
  selected: string;
  onSelect: (c: string) => void;
  themeColors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.colorGrid}>
      {palette.map((c) => {
        const isActive = selected === c;
        return (
          <TouchableOpacity
            key={c}
            onPress={() => onSelect(c)}
            activeOpacity={0.7}
            style={[
              styles.colorSwatch,
              {
                backgroundColor: c,
                borderColor: isActive ? themeColors.text : 'transparent',
                borderWidth: isActive ? 3 : 0,
                shadowColor: c,
                shadowOpacity: isActive ? 0.4 : 0,
                shadowRadius: isActive ? 8 : 0,
                shadowOffset: { width: 0, height: 2 },
              },
            ]}
          >
            {isActive && <Check size={12} color="#FFF" strokeWidth={3} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
export default function BrandStudioScreen() {
  const { colors } = useTheme();
  const { settings, updateBrand, resetSection } = useSettings();
  const b = settings.brand;

  const handlePickLogo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        updateBrand({ logoUri: result.assets[0].uri });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  }, [updateBrand]);

  const handleRemoveLogo = useCallback(() => {
    Alert.alert('Eliminar logo', '¿Deseas eliminar el logo actual?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => updateBrand({ logoUri: '' }) },
    ]);
  }, [updateBrand]);

  const handleSelectTemplate = useCallback(
    (t: BrandTemplate) => {
      const tmpl = BRAND_TEMPLATES.find((x) => x.id === t);
      if (!tmpl) return;
      updateBrand({
        template: t,
        primaryColor: tmpl.preview.primary,
        accentColor: tmpl.preview.accent,
        backgroundColor: tmpl.preview.bg,
        fontFamily: tmpl.preview.font,
        shapeStyle: tmpl.preview.shape,
        bgStyle: tmpl.preview.bgStyle,
      });
    },
    [updateBrand],
  );

  const selectedTemplate = useMemo(
    () => BRAND_TEMPLATES.find((t) => t.id === b.template) ?? BRAND_TEMPLATES[0],
    [b.template],
  );

  const positionLabel = (pos: LogoPosition): string => {
    const labels: Record<LogoPosition, string> = {
      'top-left': 'Arriba izq.',
      'top-center': 'Arriba centro',
      'top-right': 'Arriba der.',
      'bottom-left': 'Abajo izq.',
      'bottom-center': 'Abajo centro',
      'bottom-right': 'Abajo der.',
    };
    return labels[pos];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Brand Studio',
          headerTintColor: colors.gold,
          headerStyle: { backgroundColor: colors.headerBg },
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero banner ───────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: colors.gold + '10', borderColor: colors.gold + '20' }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.gold + '18' }]}>
            <Sparkles size={22} color={colors.gold} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroTitle, { color: colors.gold }]}>
              Diseña tu marca
            </Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Personaliza cómo tus alumnos ven tus planes, documentos y comunicaciones
            </Text>
          </View>
        </View>

        {/* ── Live Preview ──────────────────────────────── */}
        <SettingsSection title="Vista Previa">
          <View style={styles.previewWrap}>
            <LiveDocPreview brand={b} />
          </View>
        </SettingsSection>

        {/* ── Template Selection ────────────────────────── */}
        <SettingsSection title="Plantilla Base">
          <View style={styles.templateGrid}>
            {BRAND_TEMPLATES.map((t) => (
              <TemplatePreviewCard
                key={t.id}
                template={t}
                selected={b.template === t.id}
                onSelect={() => handleSelectTemplate(t.id)}
                colors={colors}
              />
            ))}
          </View>
        </SettingsSection>

        {/* ── Colors ────────────────────────────────────── */}
        <SettingsSection title="Paleta de Color">
          <View style={[styles.colorSection, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.colorLabel, { color: colors.text }]}>Color Principal</Text>
            <Text style={[styles.colorHint, { color: colors.textMuted }]}>
              Encabezados, barras, acentos principales
            </Text>
            <ColorPicker
              colors={BRAND_PALETTE}
              selected={b.primaryColor}
              onSelect={(c) => updateBrand({ primaryColor: c })}
              themeColors={colors}
            />
          </View>

          <View style={[styles.colorSection, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.colorLabel, { color: colors.text }]}>Color de Acento</Text>
            <Text style={[styles.colorHint, { color: colors.textMuted }]}>
              Detalles secundarios, íconos, resaltes sutiles
            </Text>
            <ColorPicker
              colors={BRAND_PALETTE}
              selected={b.accentColor}
              onSelect={(c) => updateBrand({ accentColor: c })}
              themeColors={colors}
            />
          </View>

          <View style={[styles.colorSection]}>
            <Text style={[styles.colorLabel, { color: colors.text }]}>Fondo de Página</Text>
            <Text style={[styles.colorHint, { color: colors.textMuted }]}>
              Color base del documento que reciben los alumnos
            </Text>
            <ColorPicker
              colors={['#FAFAFA', '#FFFFFF', '#F7F9F8', '#0A0A0A', '#1A1A2E', '#16213E', '#F5F0E8']}
              selected={b.backgroundColor}
              onSelect={(c) => updateBrand({ backgroundColor: c })}
              themeColors={colors}
            />
          </View>
        </SettingsSection>

        {/* ── Typography ────────────────────────────────── */}
        <SettingsSection title="Tipografía">
          <SettingsPicker<BrandFont>
            label="Familia Tipográfica"
            description="La fuente que define el carácter de tu marca"
            options={BRAND_FONTS.map((f) => ({
              value: f.id,
              label: f.name,
            }))}
            selected={b.fontFamily}
            onSelect={(v) => updateBrand({ fontFamily: v })}
          />
          <SettingsSlider
            label="Tamaño de Fuente"
            description="Escala relativa del texto en documentos"
            value={b.fontSize}
            min={85}
            max={130}
            step={5}
            unit="%"
            onValueChange={(v) => updateBrand({ fontSize: v })}
          />
          <SettingsSegment<'light' | 'regular' | 'medium' | 'bold'>
            label="Peso de Fuente"
            description="Grosor del texto en encabezados y cuerpo"
            options={[
              { value: 'light' as const, label: 'Light' },
              { value: 'regular' as const, label: 'Regular' },
              { value: 'medium' as const, label: 'Medium' },
              { value: 'bold' as const, label: 'Bold' },
            ]}
            selected={b.fontWeight}
            onSelect={(v) => updateBrand({ fontWeight: v })}
          />
        </SettingsSection>

        {/* ── Shapes & Background ───────────────────────── */}
        <SettingsSection title="Formas y Fondo">
          <SettingsSegment<BrandShape>
            label="Estilo de Formas"
            description="Redondez de tarjetas, botones y contenedores"
            options={[
              { value: 'sharp' as const, label: 'Recto' },
              { value: 'rounded' as const, label: 'Redondeado' },
              { value: 'pill' as const, label: 'Cápsula' },
            ]}
            selected={b.shapeStyle}
            onSelect={(v) => updateBrand({ shapeStyle: v })}
          />
          <SettingsSegment<BrandBgStyle>
            label="Textura de Fondo"
            description="Patrón visual del fondo de página"
            options={[
              { value: 'solid' as const, label: 'Sólido' },
              { value: 'subtle-grid' as const, label: 'Grid Sutil' },
              { value: 'gradient-soft' as const, label: 'Gradiente Suave' },
            ]}
            selected={b.bgStyle}
            onSelect={(v) => updateBrand({ bgStyle: v })}
          />
        </SettingsSection>

        {/* ── Logo ──────────────────────────────────────── */}
        <SettingsSection title="Logo y Firma">
          <SettingsToggle
            label="Mostrar Logo"
            description="Tu logo aparecerá en los documentos de tus alumnos"
            value={b.showLogo}
            onValueChange={(v) => updateBrand({ showLogo: v })}
          />

          <View style={[styles.logoUploadRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.logoUploadLabel, { color: colors.text }]}>Logo del Coach</Text>
            <Text style={[styles.logoUploadHint, { color: colors.textMuted }]}>
              PNG, JPG — Recomendado 512×512px, fondo transparente
            </Text>
            {b.logoUri ? (
              <View style={styles.logoRow}>
                <View style={[styles.logoThumb, { borderColor: colors.border }]}>
                  <Image source={{ uri: b.logoUri }} style={styles.logoThumbImg} contentFit="contain" />
                </View>
                <View style={styles.logoBtnRow}>
                  <TouchableOpacity
                    style={[styles.logoBtn, { backgroundColor: colors.gold + '18' }]}
                    onPress={handlePickLogo}
                    activeOpacity={0.7}
                  >
                    <Upload size={14} color={colors.gold} />
                    <Text style={[styles.logoBtnText, { color: colors.gold }]}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.logoBtn, { backgroundColor: colors.red + '15' }]}
                    onPress={handleRemoveLogo}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color={colors.red} />
                    <Text style={[styles.logoBtnText, { color: colors.red }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.logoUploadArea, { borderColor: colors.border }]}
                onPress={handlePickLogo}
                activeOpacity={0.7}
              >
                <View style={[styles.logoUploadIcon, { backgroundColor: colors.gold + '12' }]}>
                  <Upload size={22} color={colors.gold} />
                </View>
                <Text style={[styles.logoUploadTitle, { color: colors.text }]}>Subir Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {b.showLogo && (
            <>
              <SettingsSegment<LogoShape>
                label="Forma del Logo"
                options={[
                  { value: 'square', label: 'Cuadrado' },
                  { value: 'rounded', label: 'Redondeado' },
                  { value: 'circle', label: 'Circular' },
                ]}
                selected={b.logoShape}
                onSelect={(v) => updateBrand({ logoShape: v })}
              />
              <SettingsSegment<LogoSize>
                label="Tamaño del Logo"
                description="Tamaño relativo en el documento"
                options={[
                  { value: 'small', label: 'Pequeño' },
                  { value: 'medium', label: 'Mediano' },
                  { value: 'large', label: 'Grande' },
                ]}
                selected={b.logoSize}
                onSelect={(v) => updateBrand({ logoSize: v })}
              />
              <SettingsPicker<LogoPosition>
                label="Posición del Logo"
                description="Ubicación del logo en la página"
                options={[
                  { value: 'top-left', label: positionLabel('top-left') },
                  { value: 'top-center', label: positionLabel('top-center') },
                  { value: 'top-right', label: positionLabel('top-right') },
                ]}
                selected={b.logoPosition}
                onSelect={(v) => updateBrand({ logoPosition: v })}
              />
            </>
          )}
        </SettingsSection>

        {/* ── Coach Identity ────────────────────────────── */}
        <SettingsSection title="Identidad del Coach">
          <View style={[styles.inputRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre o Marca</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: colors.elevated,
                  borderColor: colors.border,
                },
              ]}
              value={b.coachName}
              onChangeText={(v) => updateBrand({ coachName: v })}
              placeholder="Tu nombre o marca"
              placeholderTextColor={colors.textQuaternary}
            />
          </View>
          <View style={[styles.inputRow]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Subtítulo / Eslogan</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: colors.elevated,
                  borderColor: colors.border,
                },
              ]}
              value={b.coachSubtitle}
              onChangeText={(v) => updateBrand({ coachSubtitle: v })}
              placeholder="Ej: Preparador Físico · Nutrición Deportiva"
              placeholderTextColor={colors.textQuaternary}
            />
          </View>
        </SettingsSection>

        {/* ── Reset ─────────────────────────────────────── */}
        <SettingsButton
          label="Restaurar Valores por Defecto"
          onPress={() => {
            Alert.alert(
              'Restaurar Brand Studio',
              '¿Volver a la configuración original de fábrica?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Restaurar',
                  style: 'destructive',
                  onPress: () => resetSection('brand'),
                },
              ],
            );
          }}
          variant="danger"
        />

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },

  // Hero
  hero: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 17, fontWeight: '700' as const, marginBottom: 3 },
  heroDesc: { fontSize: 12, lineHeight: 17 },

  // Live Preview
  previewWrap: { paddingHorizontal: 0, paddingVertical: 8 },
  livePreview: {
    borderRadius: 18,
    padding: 20,
    minHeight: 320,
    gap: 12,
    overflow: 'hidden' as const,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: '#000',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  liveLogoWrap: {
    marginBottom: 4,
  },
  liveLogo: {
    overflow: 'hidden' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  liveLogoImg: { width: '80%', height: '80%' },
  liveLogoPlaceholder: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveHeader: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 2,
    zIndex: 1,
  },
  liveHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  liveHeaderSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  liveContentBlock: {
    padding: 14,
    gap: 8,
    zIndex: 1,
  },
  liveContentTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  liveContentLines: {
    gap: 5,
  },
  liveCLine: {
    height: 8,
    borderRadius: 4,
  },
  liveFooter: {
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  liveFooterText: {
    fontSize: 10,
  },

  // Templates
  templateGrid: {
    gap: 10,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  templateCard: {
    flexDirection: 'row' as const,
    gap: 14,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  templateMockup: {
    width: 100,
    height: 80,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  mockHeader: {
    height: 12,
    width: '100%',
  },
  mockLines: {
    gap: 4,
  },
  mockLine: {
    height: 6,
    borderRadius: 3,
  },
  mockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'flex-end' as const,
  },
  templateLabel: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  templateDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Colors
  colorSection: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  colorLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 3,
  },
  colorHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logo
  logoUploadRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  logoUploadLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  logoUploadHint: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  logoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 16,
  },
  logoThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  logoThumbImg: {
    width: 56,
    height: 56,
  },
  logoBtnRow: {
    gap: 8,
  },
  logoBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  logoBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  logoUploadArea: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  logoUploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoUploadTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },

  // Identity inputs
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
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
});
