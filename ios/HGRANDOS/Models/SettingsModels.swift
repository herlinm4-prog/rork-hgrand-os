import SwiftUI

enum AppearanceMode: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var label: String {
        switch self {
        case .system: return "Sistema"
        case .light: return "Claro"
        case .dark: return "Oscuro"
        }
    }

    var preferredScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

/// The six assistant voices — 3 Spanish + 3 English (female, male, deep male).
enum VoiceOption: String, CaseIterable, Identifiable {
    case sol
    case alvaro
    case hector
    case aria
    case marcus
    case titan

    var id: String { rawValue }

    var label: String {
        switch self {
        case .sol: return "Sol"
        case .alvaro: return "Álvaro"
        case .hector: return "Héctor"
        case .aria: return "Aria"
        case .marcus: return "Marcus"
        case .titan: return "Titan"
        }
    }

    var detail: String {
        switch self {
        case .sol: return "Mujer · Cálida"
        case .alvaro: return "Hombre · Profesional"
        case .hector: return "Hombre · Voz grave"
        case .aria: return "Female · Warm"
        case .marcus: return "Male · Professional"
        case .titan: return "Male · Deep"
        }
    }

    var isSpanish: Bool {
        switch self {
        case .sol, .alvaro, .hector: return true
        case .aria, .marcus, .titan: return false
        }
    }

    var languageCode: String {
        isSpanish ? "es-ES" : "en-US"
    }

    /// Pitch multiplier applied to the system voice to shape the persona.
    var pitch: Float {
        switch self {
        case .sol, .aria: return 1.05
        case .alvaro, .marcus: return 0.95
        case .hector, .titan: return 0.8
        }
    }
}

enum SpeechPace: String, CaseIterable, Identifiable {
    case pausada
    case natural
    case rapida

    var id: String { rawValue }

    var label: String {
        switch self {
        case .pausada: return "Pausada"
        case .natural: return "Natural"
        case .rapida: return "Rápida"
        }
    }

    var rate: Float {
        switch self {
        case .pausada: return 0.42
        case .natural: return 0.5
        case .rapida: return 0.57
        }
    }
}
