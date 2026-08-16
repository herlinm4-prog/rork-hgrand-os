import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Trash2, ImageIcon, FileText, Sparkles } from 'lucide-react-native';
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
  ExportFormat,
  PageSize,
  PdfMargin,
  PdfColorMode,
  LogoPosition,
  LogoSize,
  LogoShape,
  LogoBorderStyle,
  DocumentTemplate,
  DocFontFamily,
  DocLineSpacing,
  HeaderStyle,
} from '@/types/settings';

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const { settings, updateDocuments } = useSettings();
  const d = settings.documents;

  const handlePickLogo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        console.log('Logo selected:', result.assets[0].uri);
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
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => updateDocuments({ logoUri: '' }),
      },
    ]);
  }, [updateDocuments]);

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

  const tipsCount = (d.requiredTips || []).filter(t => t.enabled).length;
  const tipsLabel = tipsCount > 0 ? `${tipsCount} activo${tipsCount > 1 ? 's' : ''}` : 'Ninguno';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Documentos y Exportación', headerTintColor: colors.gold }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">

        <TouchableOpacity
          style={[styles.studioCard, { backgroundColor: colors.gold + '12', borderColor: colors.gold + '30' }]}
          onPress={() => router.push('/profile/export-studio')}
          activeOpacity={0.7}
        >
          <View style={[styles.studioIcon, { backgroundColor: colors.gold + '20' }]}>
            <Sparkles size={22} color={colors.gold} />
          </View>
          <View style={styles.studioInfo}>
            <Text style={[styles.studioTitle, { color: colors.gold }]}>Export Design Studio</Text>
            <Text style={[styles.studioDesc, { color: colors.textSecondary }]}>Plantillas, marca, tipografía, colores y más</Text>
          </View>
        </TouchableOpacity>

        <SettingsSection title="Plantilla de Documento">
          <SettingsPicker<DocumentTemplate>
            label="Plantilla"
            description="Diseño visual del documento generado"
            options={[
              { value: 'elite-minimal', label: 'Elite Minimal' },
              { value: 'classic', label: 'Clásico' },
              { value: 'modern-bold', label: 'Moderno Bold' },
            ]}
            selected={d.template || 'elite-minimal'}
            onSelect={(v) => updateDocuments({ template: v })}
          />
        </SettingsSection>

        <SettingsSection title="Tipografía del Documento">
          <SettingsPicker<DocFontFamily>
            label="Familia Tipográfica"
            description="Fuente utilizada en los documentos exportados"
            options={[
              { value: 'system', label: 'Sistema (Default)' },
              { value: 'inter', label: 'Inter' },
              { value: 'roboto', label: 'Roboto' },
            ]}
            selected={d.docFontFamily || 'system'}
            onSelect={(v) => updateDocuments({ docFontFamily: v })}
          />
          <SettingsSlider
            label="Escala de Fuente"
            description="Tamaño relativo del texto en el documento"
            value={d.docFontScale || 100}
            min={85}
            max={130}
            step={5}
            unit="%"
            onValueChange={(v) => updateDocuments({ docFontScale: v })}
          />
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

        <SettingsSection title="Encabezado y Datos">
          <SettingsSegment<HeaderStyle>
            label="Estilo de Encabezado"
            description="Información visible en la cabecera del documento"
            options={[
              { value: 'full', label: 'Completo' },
              { value: 'minimal', label: 'Mínimo' },
              { value: 'hidden', label: 'Oculto' },
            ]}
            selected={d.headerStyle || 'full'}
            onSelect={(v) => updateDocuments({ headerStyle: v })}
          />
          <SettingsToggle
            label="Mostrar Info del Atleta"
            description="Nombre del atleta en el encabezado"
            value={d.showAthleteInfo !== false}
            onValueChange={(v) => updateDocuments({ showAthleteInfo: v })}
          />
          <SettingsToggle
            label="Mostrar Info del Coach"
            description="Tu nombre como preparador en el encabezado"
            value={d.showCoachInfo || false}
            onValueChange={(v) => updateDocuments({ showCoachInfo: v })}
          />
          {d.showCoachInfo && (
            <View style={[styles.inputRow, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre del Coach</Text>
              <TextInput
                style={[styles.patternInput, { color: colors.text, backgroundColor: colors.elevated, borderColor: colors.border }]}
                value={d.coachName || ''}
                onChangeText={(v) => updateDocuments({ coachName: v })}
                placeholder="Tu nombre o marca"
                placeholderTextColor={colors.textQuaternary}
              />
            </View>
          )}
          <SettingsToggle
            label="Numeración de Páginas"
            description="Mostrar fecha al pie del documento"
            value={d.showPageNumbers !== false}
            onValueChange={(v) => updateDocuments({ showPageNumbers: v })}
          />
        </SettingsSection>

        <SettingsSection title="Formato por Defecto">
          <SettingsPicker<ExportFormat>
            label="Formato de Exportación"
            description="Formato predeterminado para documentos generados"
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'docx', label: 'Word (.docx)' },
              { value: 'txt', label: 'Texto plano' },
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
            ]}
            selected={d.defaultFormat}
            onSelect={(v) => updateDocuments({ defaultFormat: v })}
          />
        </SettingsSection>

        <SettingsSection title="Logo y Marca">
          <SettingsToggle
            label="Incluir Logo en Exportaciones"
            description="Tu logo aparecerá en los documentos PDF exportados"
            value={d.includeLogo}
            onValueChange={(v) => updateDocuments({ includeLogo: v })}
          />

          <View style={[styles.logoSection, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.logoSectionLabel, { color: colors.text }]}>Logo del Preparador</Text>
            <Text style={[styles.logoSectionDesc, { color: colors.textMuted }]}>
              Sube tu logo para que aparezca en todos los documentos exportados
            </Text>

            {d.logoUri ? (
              <View style={styles.logoPreviewContainer}>
                <View style={[styles.logoPreviewCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Image
                    source={{ uri: d.logoUri }}
                    style={styles.logoPreview}
                    contentFit="contain"
                  />
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
                <Text style={[styles.logoUploadHint, { color: colors.textMuted }]}>
                  PNG, JPG — Recomendado 512×512px
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {d.includeLogo && d.logoUri ? (
            <>
              <SettingsPicker<LogoPosition>
                label="Posición del Logo"
                description="Ubicación del logo en el documento"
                options={[
                  { value: 'top-left', label: positionLabel('top-left') },
                  { value: 'top-center', label: positionLabel('top-center') },
                  { value: 'top-right', label: positionLabel('top-right') },
                  { value: 'bottom-left', label: positionLabel('bottom-left') },
                  { value: 'bottom-center', label: positionLabel('bottom-center') },
                  { value: 'bottom-right', label: positionLabel('bottom-right') },
                ]}
                selected={d.logoPosition}
                onSelect={(v) => updateDocuments({ logoPosition: v })}
              />
              <SettingsSegment<LogoSize>
                label="Tamaño del Logo"
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
                label="Opacidad del Logo"
                description="Transparencia del logo en el documento"
                value={d.logoOpacity}
                min={20}
                max={100}
                step={10}
                unit="%"
                onValueChange={(v) => updateDocuments({ logoOpacity: v })}
              />
              <SettingsSegment<LogoShape>
                label="Forma del Logo"
                description="Forma visual del logo en el documento"
                options={[
                  { value: 'square', label: 'Cuadrado' },
                  { value: 'rounded', label: 'Redondeado' },
                  { value: 'circle', label: 'Circular' },
                ]}
                selected={d.logoShape ?? 'square'}
                onSelect={(v) => updateDocuments({ logoShape: v })}
              />
              <SettingsSegment<LogoBorderStyle>
                label="Borde del Logo"
                description="Estilo del borde alrededor del logo"
                options={[
                  { value: 'none', label: 'Sin borde' },
                  { value: 'thin', label: 'Línea fina' },
                  { value: 'shadow', label: 'Sombra' },
                ]}
                selected={d.logoBorder ?? 'none'}
                onSelect={(v) => updateDocuments({ logoBorder: v })}
              />
              <SettingsSlider
                label="Margen Inferior del Logo"
                description="Separación entre el logo y el contenido"
                value={d.logoMarginBottom ?? 16}
                min={0}
                max={48}
                step={4}
                unit="px"
                onValueChange={(v) => updateDocuments({ logoMarginBottom: v })}
              />
              <SettingsToggle
                label="Logo en Cada Página"
                description="Mostrar el logo en todas las páginas del documento"
                value={d.showLogoOnEveryPage ?? false}
                onValueChange={(v) => updateDocuments({ showLogoOnEveryPage: v })}
              />
            </>
          ) : null}
        </SettingsSection>

        <SettingsSection title="Consejos Requeridos">
          <SettingsToggle
            label="Incluir Consejos en Documentos"
            description="Agregar frases configuradas al final de cada plan"
            value={d.includeRequiredTips !== false}
            onValueChange={(v) => updateDocuments({ includeRequiredTips: v })}
          />
          <SettingsNavRow
            label="Gestionar Consejos"
            description="Agregar, editar y organizar frases por categoría"
            value={tipsLabel}
            icon={<View style={[styles.navIcon, { backgroundColor: colors.blue + '18' }]}><FileText size={16} color={colors.blue} /></View>}
            onPress={() => router.push('/profile/required-tips')}
          />
        </SettingsSection>

        <SettingsSection title="Plantillas de Exportación">
          <SettingsToggle
            label="Incluir Aviso Legal"
            description="Añadir aviso legal al final del documento"
            value={d.includeDisclaimer}
            onValueChange={(v) => updateDocuments({ includeDisclaimer: v })}
          />
          <SettingsToggle
            label="Bloque de Firma"
            description="Espacio para la firma del preparador al final"
            value={d.addSignatureBlock}
            onValueChange={(v) => updateDocuments({ addSignatureBlock: v })}
          />
          <SettingsToggle
            label="Pie de Página Personalizado"
            description="Añadir un texto personalizado al final"
            value={d.footerEnabled || false}
            onValueChange={(v) => updateDocuments({ footerEnabled: v })}
          />
          {d.footerEnabled && (
            <View style={[styles.inputRow, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Texto del Pie</Text>
              <TextInput
                style={[styles.patternInput, { color: colors.text, backgroundColor: colors.elevated, borderColor: colors.border }]}
                value={d.footerText || ''}
                onChangeText={(v) => updateDocuments({ footerText: v })}
                placeholder="Ej: www.tucoaching.com"
                placeholderTextColor={colors.textQuaternary}
              />
            </View>
          )}
        </SettingsSection>

        <SettingsSection title="Comportamiento de Exportación">
          <SettingsToggle
            label="Auto-exportar al Actualizar"
            description="Generar documento automáticamente al cambiar un plan"
            value={d.autoExport}
            onValueChange={(v) => updateDocuments({ autoExport: v })}
          />
          <SettingsToggle
            label="Guardar Copia Local"
            description="Mantener una copia en este dispositivo"
            value={d.saveLocalCopy}
            onValueChange={(v) => updateDocuments({ saveLocalCopy: v })}
          />
          <SettingsToggle
            label="Guardar en la Nube"
            description="Sincronizar exportaciones con almacenamiento en la nube"
            value={d.cloudSave}
            onValueChange={(v) => updateDocuments({ cloudSave: v })}
          />
          <View style={[styles.inputRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Patrón de Nombre</Text>
            <TextInput
              style={[styles.patternInput, { color: colors.text, backgroundColor: colors.elevated, borderColor: colors.border }]}
              value={d.namingPattern}
              onChangeText={(v) => updateDocuments({ namingPattern: v })}
              placeholder="[AthleteName]_[PlanType]_[Date]"
              placeholderTextColor={colors.textQuaternary}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Ajustes PDF">
          <SettingsSegment<PageSize>
            label="Tamaño de Página"
            options={[
              { value: 'letter', label: 'Carta' },
              { value: 'a4', label: 'A4' },
            ]}
            selected={d.pageSize}
            onSelect={(v) => updateDocuments({ pageSize: v })}
          />
          <SettingsSegment<PdfMargin>
            label="Márgenes"
            options={[
              { value: 'compact', label: 'Compacto' },
              { value: 'standard', label: 'Estándar' },
            ]}
            selected={d.pdfMargin}
            onSelect={(v) => updateDocuments({ pdfMargin: v })}
          />
          <SettingsSegment<PdfColorMode>
            label="Modo de Color"
            options={[
              { value: 'color', label: 'Color Completo' },
              { value: 'monochrome', label: 'Monocromático' },
            ]}
            selected={d.pdfColorMode}
            onSelect={(v) => updateDocuments({ pdfColorMode: v })}
          />
        </SettingsSection>

        <SettingsSection title="Ajustes Word">
          <SettingsToggle
            label="Usar Fuente del Sistema"
            description="Usar la fuente del sistema en documentos Word"
            value={d.useSystemFont}
            onValueChange={(v) => updateDocuments({ useSystemFont: v })}
          />
          <SettingsToggle
            label="Tablas Editables"
            description="Las tablas pueden editarse en Word"
            value={d.includeTables}
            onValueChange={(v) => updateDocuments({ includeTables: v })}
          />
        </SettingsSection>

        <View style={styles.spacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },
  studioCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  studioIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  studioInfo: {
    flex: 1,
  },
  studioTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  studioDesc: {
    fontSize: 12,
    lineHeight: 16,
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
  patternInput: {
    fontSize: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  logoSectionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  logoSectionDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  logoPreviewContainer: {
    gap: 12,
  },
  logoPreviewCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPreview: {
    width: 100,
    height: 100,
  },
  logoActions: {
    flexDirection: 'row' as const,
    justifyContent: 'center',
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
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  logoUploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoUploadTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  logoUploadHint: {
    fontSize: 12,
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
