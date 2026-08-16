export type VoiceLanguage = 'es' | 'en';
export type VoiceGender = 'female' | 'male';
export type VoiceSpeed = 'slow' | 'normal' | 'fast';

export interface VoicePreset {
  id: string;
  name: string;
  voiceId: string;
  language: VoiceLanguage;
  gender: VoiceGender;
  description: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  // ── Español ───────────────────────────────────────────
  {
    id: 'sol',
    name: 'Sol',
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    language: 'es',
    gender: 'female',
    description: 'Cálida, íntima, natural — voz femenina española',
  },
  {
    id: 'alvaro',
    name: 'Álvaro',
    voiceId: 'ErXwobaYiN019PkySvjV',
    language: 'es',
    gender: 'male',
    description: 'Profundo, sereno, profesional — voz masculina española',
  },
  {
    id: 'hector',
    name: 'Héctor',
    voiceId: 'h415g7h7bSwQrn1qw4ar',
    language: 'es',
    gender: 'male',
    description: 'Grave, imponente, autoritario — voz masculina profunda',
  },
  // ── English ───────────────────────────────────────────
  {
    id: 'aria',
    name: 'Aria',
    voiceId: '9BWtsMINqrJLrRakOkXd',
    language: 'en',
    gender: 'female',
    description: 'Warm, natural, expressive — English female',
  },
  {
    id: 'marcus',
    name: 'Marcus',
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    language: 'en',
    gender: 'male',
    description: 'Deep, authoritative, calm — English male',
  },
  {
    id: 'titan',
    name: 'Titan',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    language: 'en',
    gender: 'male',
    description: 'Ultra-deep, commanding, powerful — deep English male',
  },
];

// Voice speed → ElevenLabs stability/similarity mapping
export const VOICE_SPEED_SETTINGS: Record<VoiceSpeed, { stability: number; similarity_boost: number; style: number }> = {
  slow: { stability: 0.65, similarity_boost: 0.8, style: 0.2 },
  normal: { stability: 0.45, similarity_boost: 0.75, style: 0.3 },
  fast: { stability: 0.3, similarity_boost: 0.7, style: 0.4 },
};

export interface VoiceSettings {
  voicePresetId: string;
  speed: VoiceSpeed;
  autoListen: boolean;
  silenceTimeout: number;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voicePresetId: 'sol',
  speed: 'normal',
  autoListen: true,
  silenceTimeout: 1500,
};
export type DesignStyle = 'modern' | 'classic' | 'neural' | 'minimal';
export type AccentColor = 'gold' | 'steelBlue' | 'emerald' | 'crimson';
export type CardStyle = 'soft' | 'sharp';
export type ShadowDensity = 'low' | 'medium' | 'high';
export type FontFamily = 'system' | 'inter' | 'sfpro' | 'roboto';
export type TextWeight = 'regular' | 'medium' | 'bold';
export type LineHeight = 'compact' | 'standard' | 'spacious';
export type UIDensity = 'compact' | 'standard' | 'spacious';
export type HapticLevel = 'off' | 'light' | 'standard';
export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ft-in';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type TimeFormat = '12h' | '24h';
export type WeekStart = 'monday' | 'sunday';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'MXN';
export type AppLanguage = 'es' | 'en' | 'pt' | 'fr';
export type Region = 'US' | 'EU' | 'LATAM';
export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'csv' | 'json';
export type PageSize = 'letter' | 'a4';
export type PdfMargin = 'compact' | 'standard';
export type PdfColorMode = 'color' | 'monochrome';
export type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type LogoSize = 'small' | 'medium' | 'large';
export type LogoShape = 'square' | 'rounded' | 'circle';
export type LogoBorderStyle = 'none' | 'thin' | 'shadow';
export type AIPersonality = 'dry' | 'balanced' | 'human';
export type AIMode = 'fast' | 'balanced' | 'best';
export type AIOfflineBehavior = 'save' | 'disable';
export type AppLockType = 'off' | 'pin' | 'biometric';
export type AutoLockTimer = 'immediately' | '1min' | '5min' | '15min';
export type DataRetention = '3months' | '6months' | '1year' | 'forever';
export type NotifFrequency = 'daily' | 'weekly';
export type MessageNotifLevel = 'all' | 'important' | 'off';
export type PerformanceMode = 'standard' | 'reduced';

export type DocumentTemplate = 'elite-minimal' | 'classic' | 'modern-bold';
export type DocFontFamily = 'system' | 'inter' | 'roboto';
export type DocFontScale = number;
export type DocLineSpacing = 'compact' | 'standard' | 'spacious';
export type HeaderStyle = 'full' | 'minimal' | 'hidden';

export type PageBgColor = 'white' | 'light-gray' | 'warm-white';
export type MealHeadingWeight = 'medium' | 'bold' | 'extrabold';
export type ContentDensity = 'compact' | 'standard' | 'airy';
export type BulletStyle = 'dots' | 'dashes';
export type TipPlacement = 'end' | 'under-monitoring';

export type RequiredTipCategory = 'general' | 'peak_week' | 'digestion' | 'training' | 'compliance';
export type PlanTypeFilter = 'all' | 'cutting' | 'bulking' | 'peak_week' | 'carb_load' | 'maintenance';

// ── Brand Studio ───────────────────────────────────────────
export type BrandTemplate = 'elite-pro' | 'dark-command' | 'wellness-soft';
export type BrandFont = 'sf-pro' | 'helvetica' | 'georgia';
export type BrandShape = 'sharp' | 'rounded' | 'pill';
export type BrandBgStyle = 'solid' | 'subtle-grid' | 'gradient-soft';

export interface BrandSettings {
  template: BrandTemplate;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: BrandFont;
  fontSize: number;
  fontWeight: 'light' | 'regular' | 'medium' | 'bold';
  shapeStyle: BrandShape;
  bgStyle: BrandBgStyle;
  logoUri: string;
  logoShape: LogoShape;
  logoSize: LogoSize;
  logoPosition: LogoPosition;
  showLogo: boolean;
  coachName: string;
  coachSubtitle: string;
}

export const BRAND_TEMPLATES: { id: BrandTemplate; name: string; description: string; preview: { primary: string; accent: string; bg: string; font: BrandFont; shape: BrandShape; bgStyle: BrandBgStyle } }[] = [
  {
    id: 'elite-pro',
    name: 'Elite Pro',
    description: 'Minimalista, geométrico, tonos dorados — precisión Apple-style',
    preview: {
      primary: '#B8922E',
      accent: '#D4AE4A',
      bg: '#FAFAFA',
      font: 'sf-pro',
      shape: 'sharp',
      bgStyle: 'solid',
    },
  },
  {
    id: 'dark-command',
    name: 'Dark Command',
    description: 'Oscuro, bold, alto contraste — presencia imponente',
    preview: {
      primary: '#E2C36C',
      accent: '#F5D78A',
      bg: '#0A0A0A',
      font: 'helvetica',
      shape: 'sharp',
      bgStyle: 'subtle-grid',
    },
  },
  {
    id: 'wellness-soft',
    name: 'Wellness Soft',
    description: 'Cálido, orgánico, redondeado — cercano y humano',
    preview: {
      primary: '#059669',
      accent: '#34D399',
      bg: '#F7F9F8',
      font: 'georgia',
      shape: 'pill',
      bgStyle: 'gradient-soft',
    },
  },
];

export const BRAND_FONTS: { id: BrandFont; name: string; preview: string }[] = [
  { id: 'sf-pro', name: 'SF Pro', preview: 'San Francisco — Sistema Apple' },
  { id: 'helvetica', name: 'Helvetica Neue', preview: 'Clásica, neutral, profesional' },
  { id: 'georgia', name: 'Georgia', preview: 'Serif elegante, cálida, editorial' },
];

export const BRAND_PALETTE = [
  '#B8922E', '#C7A34B', '#E2C36C',
  '#0A0A0A', '#1A1A2E', '#16213E',
  '#059669', '#10B981', '#34D399',
  '#DC2626', '#C8102E', '#EF4444',
  '#2563EB', '#3B82F6', '#6366F1',
  '#7C3AED', '#8B5CF6', '#A78BFA',
  '#F59E0B', '#D97706', '#F97316',
];

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  template: 'elite-pro',
  primaryColor: '#B8922E',
  accentColor: '#D4AE4A',
  backgroundColor: '#FAFAFA',
  fontFamily: 'sf-pro',
  fontSize: 100,
  fontWeight: 'medium',
  shapeStyle: 'sharp',
  bgStyle: 'solid',
  logoUri: '',
  logoShape: 'rounded',
  logoSize: 'medium',
  logoPosition: 'top-center',
  showLogo: true,
  coachName: '',
  coachSubtitle: '',
};

export interface RequiredTip {
  id: string;
  text: string;
  category: RequiredTipCategory;
  enabled: boolean;
  planTypes: PlanTypeFilter[];
  excludedStudentIds: string[];
}

export interface AppearanceSettings {
  designStyle: DesignStyle;
  trueBlack: boolean;
  accentColor: AccentColor;
  cardStyle: CardStyle;
  cardRadius: number;
  shadowDensity: ShadowDensity;
  reduceMotion: boolean;
  fontFamily: FontFamily;
  useOSFont: boolean;
  fontScale: number;
  textWeight: TextWeight;
  lineHeight: LineHeight;
  tabularNumbers: boolean;
  uiDensity: UIDensity;
  uiScale: number;
  largeTouchTargets: boolean;
  highContrast: boolean;
  colorBlindSafe: boolean;
  haptics: HapticLevel;
  soundEffects: boolean;
}

export interface LanguageSettings {
  language: AppLanguage;
  followDevice: boolean;
  region: Region;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  nutritionUnit: 'g' | 'oz';
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  currency: Currency;
}

export interface DocumentSettings {
  defaultFormat: ExportFormat;
  includeLogo: boolean;
  logoUri: string;
  logoPosition: LogoPosition;
  logoSize: LogoSize;
  logoOpacity: number;
  logoShape: LogoShape;
  logoBorder: LogoBorderStyle;
  logoMarginBottom: number;
  showLogoOnEveryPage: boolean;
  includeDisclaimer: boolean;
  addSignatureBlock: boolean;
  autoExport: boolean;
  saveLocalCopy: boolean;
  cloudSave: boolean;
  namingPattern: string;
  pageSize: PageSize;
  pdfMargin: PdfMargin;
  pdfColorMode: PdfColorMode;
  useSystemFont: boolean;
  includeTables: boolean;
  template: DocumentTemplate;
  docFontFamily: DocFontFamily;
  docFontScale: number;
  docLineSpacing: DocLineSpacing;
  headerStyle: HeaderStyle;
  showAthleteInfo: boolean;
  showCoachInfo: boolean;
  coachName: string;
  showPageNumbers: boolean;
  includeRequiredTips: boolean;
  requiredTips: RequiredTip[];
  footerEnabled: boolean;
  footerText: string;
  pageBgColor: PageBgColor;
  mealHeadingColor: string;
  mealHeadingSize: number;
  mealHeadingWeight: MealHeadingWeight;
  objectivesHeaderColor: string;
  hydrationHeaderColor: string;
  mealsHeaderColor: string;
  monitoringHeaderColor: string;
  contentDensity: ContentDensity;
  sectionDividerLine: boolean;
  headingScale: number;
  bulletStyle: BulletStyle;
  tipPlacement: TipPlacement;
}

export interface AISettings {
  personality: AIPersonality;
  useBulletPoints: boolean;
  stepByStepReasoning: boolean;
  askFollowUp: boolean;
  showConfidence: boolean;
  citeSources: boolean;
  bodybuilderMode: boolean;
  healthSafetyMode: boolean;
  peakWeekMode: boolean;
  saveAthletePrefs: boolean;
  saveCoachPrefs: boolean;
  aiMode: AIMode;
  offlineBehavior: AIOfflineBehavior;
  doNotTrainOnData: boolean;
  dataMinimization: boolean;
}

export interface NotificationSettings {
  checkinFrequency: NotifFrequency;
  checkinTime: string;
  missedCheckinAlerts: boolean;
  plateauAlerts: boolean;
  peakWeekAlerts: boolean;
  messageNotifLevel: MessageNotifLevel;
  silentHoursEnabled: boolean;
  silentStart: string;
  silentEnd: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  highPriorityOnly: boolean;
}

export interface PrivacySettings {
  appLock: AppLockType;
  autoLockTimer: AutoLockTimer;
  hideSensitivePreviews: boolean;
  screenshotProtection: boolean;
  dataRetention: DataRetention;
}

export interface AdvancedSettings {
  debugLogs: boolean;
  performanceMode: PerformanceMode;
  lowResImages: boolean;
}

export interface AllSettings {
  appearance: AppearanceSettings;
  language: LanguageSettings;
  documents: DocumentSettings;
  ai: AISettings;
  voice: VoiceSettings;
  brand: BrandSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  advanced: AdvancedSettings;
}

export const DEFAULT_SETTINGS: AllSettings = {
  appearance: {
    designStyle: 'modern',
    trueBlack: false,
    accentColor: 'gold',
    cardStyle: 'soft',
    cardRadius: 16,
    shadowDensity: 'medium',
    reduceMotion: false,
    fontFamily: 'system',
    useOSFont: true,
    fontScale: 100,
    textWeight: 'medium',
    lineHeight: 'standard',
    tabularNumbers: true,
    uiDensity: 'standard',
    uiScale: 100,
    largeTouchTargets: false,
    highContrast: false,
    colorBlindSafe: false,
    haptics: 'standard',
    soundEffects: false,
  },
  language: {
    language: 'es',
    followDevice: false,
    region: 'LATAM',
    weightUnit: 'kg',
    heightUnit: 'cm',
    nutritionUnit: 'g',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    weekStart: 'monday',
    currency: 'USD',
  },
  documents: {
    defaultFormat: 'pdf',
    includeLogo: true,
    logoUri: '',
    logoPosition: 'top-center',
    logoSize: 'medium',
    logoOpacity: 100,
    logoShape: 'square',
    logoBorder: 'none',
    logoMarginBottom: 16,
    showLogoOnEveryPage: false,
    includeDisclaimer: true,
    addSignatureBlock: false,
    autoExport: false,
    saveLocalCopy: true,
    cloudSave: false,
    namingPattern: '[AthleteName]_[PlanType]_[Date]',
    pageSize: 'a4',
    pdfMargin: 'standard',
    pdfColorMode: 'color',
    useSystemFont: true,
    includeTables: true,
    template: 'elite-minimal',
    docFontFamily: 'system',
    docFontScale: 100,
    docLineSpacing: 'standard',
    headerStyle: 'full',
    showAthleteInfo: true,
    showCoachInfo: false,
    coachName: '',
    showPageNumbers: true,
    includeRequiredTips: true,
    requiredTips: [],
    footerEnabled: false,
    footerText: '',
    pageBgColor: 'white',
    mealHeadingColor: '#1A1A1A',
    mealHeadingSize: 100,
    mealHeadingWeight: 'bold',
    objectivesHeaderColor: '#1B6B3A',
    hydrationHeaderColor: '#14614A',
    mealsHeaderColor: '#9B1C1C',
    monitoringHeaderColor: '#1A4F7A',
    contentDensity: 'standard',
    sectionDividerLine: true,
    headingScale: 100,
    bulletStyle: 'dots',
    tipPlacement: 'end',
  },
  ai: {
    personality: 'balanced',
    useBulletPoints: true,
    stepByStepReasoning: false,
    askFollowUp: true,
    showConfidence: false,
    citeSources: false,
    bodybuilderMode: true,
    healthSafetyMode: true,
    peakWeekMode: false,
    saveAthletePrefs: true,
    saveCoachPrefs: true,
    aiMode: 'balanced',
    offlineBehavior: 'save',
    doNotTrainOnData: false,
    dataMinimization: false,
  },
  voice: DEFAULT_VOICE_SETTINGS,
  brand: DEFAULT_BRAND_SETTINGS,
  notifications: {
    checkinFrequency: 'weekly',
    checkinTime: '09:00',
    missedCheckinAlerts: true,
    plateauAlerts: true,
    peakWeekAlerts: true,
    messageNotifLevel: 'all',
    silentHoursEnabled: false,
    silentStart: '22:00',
    silentEnd: '07:00',
    pushEnabled: true,
    emailEnabled: false,
    highPriorityOnly: false,
  },
  privacy: {
    appLock: 'off',
    autoLockTimer: '5min',
    hideSensitivePreviews: false,
    screenshotProtection: false,
    dataRetention: 'forever',
  },
  advanced: {
    debugLogs: false,
    performanceMode: 'standard',
    lowResImages: false,
  },
};
