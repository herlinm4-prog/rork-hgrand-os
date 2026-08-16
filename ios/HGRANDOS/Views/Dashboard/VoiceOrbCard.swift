import SwiftUI

/// Premium voice gadget — delicate breathing orb with thin coordinated waveform lines.
struct VoiceOrbCard: View {
    @Environment(\.colorScheme) private var scheme
    let action: () -> Void

    @State private var pulse = false
    @State private var ring1Expanded = false
    @State private var ring2Expanded = false

    private var theme: Theme { Theme.of(scheme) }
    private var isDark: Bool { scheme == .dark }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    orb
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Hablar con Sol")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(theme.text)
                        Text("Asistente de voz inteligente")
                            .font(.system(size: 12))
                            .foregroundStyle(theme.textMuted)
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(theme.gold.opacity(0.06))
                            .strokeBorder(theme.gold.opacity(0.1), lineWidth: 0.5)
                        Image(systemName: "waveform")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(theme.gold)
                    }
                    .frame(width: 30, height: 30)
                }
                .padding(14)

                HStack(spacing: 5) {
                    Circle()
                        .fill(theme.success)
                        .frame(width: 4, height: 4)
                    Text("ACTIVO")
                        .font(.system(size: 10, weight: .semibold))
                        .kerning(0.5)
                        .foregroundStyle(theme.success)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 7)
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(theme.separator)
                        .frame(height: 0.5)
                }
            }
            .background(theme.card)
            .clipShape(.rect(cornerRadius: 20))
            .overlay {
                RoundedRectangle(cornerRadius: 20)
                    .strokeBorder(theme.cardBorder, lineWidth: 0.5)
            }
        }
        .buttonStyle(.plain)
        .onAppear {
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                pulse = true
            }
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                ring1Expanded = true
            }
            withAnimation(.easeInOut(duration: 2.7).repeatForever(autoreverses: true)) {
                ring2Expanded = true
            }
        }
    }

    private var orb: some View {
        ZStack {
            Circle()
                .strokeBorder(theme.gold.opacity(0.10), lineWidth: 0.5)
                .frame(width: 52, height: 52)
                .scaleEffect(ring2Expanded ? 1.08 : 1)
                .opacity(ring2Expanded ? 0 : 0.6)
            Circle()
                .strokeBorder(theme.gold.opacity(0.16), lineWidth: 1)
                .frame(width: 52, height: 52)
                .scaleEffect(ring1Expanded ? 1.12 : 1)
                .opacity(ring1Expanded ? 0 : 0.8)
            Circle()
                .fill(isDark ? Color(hex: "1A1A22") : Color(hex: "F4F4F8"))
                .strokeBorder(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.06), lineWidth: 0.5)
                .frame(width: 40, height: 40)
                .scaleEffect(pulse ? 1.04 : 1)
                .overlay { waveform }
                .shadow(color: .black.opacity(0.06), radius: 6, y: 1)
        }
        .frame(width: 52, height: 52)
    }

    /// Five thin bars flowing as a coordinated sine wave.
    private var waveform: some View {
        TimelineView(.animation(minimumInterval: 1 / 30)) { context in
            let t = context.date.timeIntervalSinceReferenceDate
            HStack(alignment: .center, spacing: 2) {
                ForEach(0..<5, id: \.self) { i in
                    let amp = 5 + sin(Double(i) * 1.2) * 3
                    let height = 5.5 + amp * (0.5 + 0.5 * sin(t * 2 + Double(i) * 0.9))
                    Capsule()
                        .fill(isDark ? Color.white.opacity(0.65) : theme.gold.opacity(0.5))
                        .frame(width: 1.5, height: height)
                        .opacity((1 - abs(Double(i) - 2) * 0.08) * 0.9)
                }
            }
            .frame(height: 18)
        }
    }
}
