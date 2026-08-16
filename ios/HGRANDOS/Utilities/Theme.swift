import SwiftUI

/// HGRAND OS design system — mirrors the brand palette (gold on deep navy-black).
struct Theme {
    let background: Color
    let card: Color
    let cardAlt: Color
    let elevated: Color
    let cardBorder: Color
    let separator: Color
    let text: Color
    let textSecondary: Color
    let textTertiary: Color
    let textMuted: Color
    let textQuaternary: Color
    let gold: Color
    let goldDim: Color
    let danger: Color
    let warning: Color
    let success: Color
    let info: Color
    let orange: Color
    let green: Color

    static let dark = Theme(
        background: Color(hex: "07080B"),
        card: Color(hex: "121524"),
        cardAlt: Color(hex: "181C2E"),
        elevated: Color(hex: "1A1F32"),
        cardBorder: Color.white.opacity(0.08),
        separator: Color.white.opacity(0.06),
        text: Color(hex: "F3F5F7"),
        textSecondary: Color(hex: "D1D5DB"),
        textTertiary: Color(hex: "9AA3AE"),
        textMuted: Color(hex: "6B7280"),
        textQuaternary: Color(hex: "3D4451"),
        gold: Color(hex: "C7A34B"),
        goldDim: Color(hex: "8B7332"),
        danger: Color(hex: "EF4444"),
        warning: Color(hex: "F59E0B"),
        success: Color(hex: "10B981"),
        info: Color(hex: "3B82F6"),
        orange: Color(hex: "F59E0B"),
        green: Color(hex: "10B981")
    )

    static let light = Theme(
        background: Color(hex: "F2F2F7"),
        card: .white,
        cardAlt: Color(hex: "F7F7FA"),
        elevated: Color(hex: "F0F0F5"),
        cardBorder: Color.black.opacity(0.06),
        separator: Color.black.opacity(0.06),
        text: Color(hex: "1C1C1E"),
        textSecondary: Color(hex: "3C3C43"),
        textTertiary: Color(hex: "636366"),
        textMuted: Color(hex: "8E8E93"),
        textQuaternary: Color(hex: "C7C7CC"),
        gold: Color(hex: "B8922E"),
        goldDim: Color(hex: "A07E24"),
        danger: Color(hex: "DC2626"),
        warning: Color(hex: "D97706"),
        success: Color(hex: "059669"),
        info: Color(hex: "2563EB"),
        orange: Color(hex: "D97706"),
        green: Color(hex: "059669")
    )

    static func of(_ scheme: ColorScheme) -> Theme {
        scheme == .dark ? .dark : .light
    }
}
