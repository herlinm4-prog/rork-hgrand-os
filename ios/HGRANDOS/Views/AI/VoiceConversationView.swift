import SwiftUI

/// Full-screen premium voice experience — Sol speaks replies aloud with the configured voice.
struct VoiceConversationView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var speech = SpeechService()
    @State private var input = ""
    @State private var lastReply = ""
    @State private var isThinking = false
    @State private var breathe = false

    private let theme = Theme.dark

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            RadialGradient(
                colors: [theme.gold.opacity(0.12), .clear],
                center: .center,
                startRadius: 20,
                endRadius: 300
            )
            .ignoresSafeArea()
            .allowsHitTesting(false)

            VStack(spacing: 0) {
                header
                Spacer()
                orb
                statusText
                Spacer()
                replyText
                inputBar
            }
        }
        .preferredColorScheme(.dark)
        .onDisappear { speech.stop() }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("HGRAND OS")
                    .font(.system(size: 10, weight: .heavy))
                    .kerning(2)
                    .foregroundStyle(theme.gold)
                Text(store.voice.label)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.white)
            }
            Spacer()
            Button {
                speech.stop()
                dismiss()
            } label: {
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 36, height: 36)
                    .overlay {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                    }
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 24)
        .padding(.top, 12)
    }

    private var orb: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .strokeBorder(theme.gold.opacity(0.25 - Double(i) * 0.07), lineWidth: 1)
                    .frame(width: 180 + CGFloat(i) * 44, height: 180 + CGFloat(i) * 44)
                    .scaleEffect(breathe ? 1.06 : 1)
                    .animation(
                        .easeInOut(duration: 2.4 + Double(i) * 0.4).repeatForever(autoreverses: true),
                        value: breathe
                    )
            }

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "1E1B12"), Color(hex: "0E0D08")],
                        center: .center,
                        startRadius: 10,
                        endRadius: 90
                    )
                )
                .strokeBorder(theme.gold.opacity(0.35), lineWidth: 1)
                .frame(width: 160, height: 160)
                .scaleEffect(breathe ? 1.03 : 1)
                .animation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true), value: breathe)
                .overlay { bigWaveform }
                .shadow(color: theme.gold.opacity(0.25), radius: 40)
        }
        .onAppear { breathe = true }
    }

    private var bigWaveform: some View {
        TimelineView(.animation(minimumInterval: 1 / 30)) { context in
            let t = context.date.timeIntervalSinceReferenceDate
            let active = isThinking || speech.isSpeaking
            HStack(spacing: 5) {
                ForEach(0..<7, id: \.self) { i in
                    let amp: Double = active ? 22 : 9
                    let height = 8 + amp * (0.5 + 0.5 * sin(t * (active ? 6 : 2) + Double(i) * 0.9))
                    Capsule()
                        .fill(theme.gold.opacity(0.9 - abs(Double(i) - 3) * 0.1))
                        .frame(width: 3, height: height)
                }
            }
            .frame(height: 56)
        }
    }

    private var statusText: some View {
        Text(isThinking ? "Pensando..." : speech.isSpeaking ? "Hablando" : "Escribe y Sol responde con voz")
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(.white.opacity(0.5))
            .padding(.top, 32)
    }

    @ViewBuilder
    private var replyText: some View {
        if !lastReply.isEmpty {
            ScrollView {
                Text(lastReply)
                    .font(.system(size: 15))
                    .foregroundStyle(.white.opacity(0.85))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)
            }
            .frame(maxHeight: 140)
            .padding(.bottom, 16)
        }
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Pregunta a \(store.voice.label)...", text: $input)
                .font(.system(size: 15))
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.07), in: .capsule)
                .overlay {
                    Capsule().strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                }
                .onSubmit(send)

            Button(action: send) {
                Circle()
                    .fill(theme.gold)
                    .frame(width: 44, height: 44)
                    .overlay {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(.black)
                    }
            }
            .buttonStyle(.plain)
            .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || isThinking)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty, !isThinking else { return }
        input = ""
        isThinking = true
        speech.stop()

        let language = store.voice.isSpanish ? "español" : "inglés"
        let system = "Eres \(store.voice.label), asistente de voz de HGRAND OS para coaches de fitness. Responde en \(language), en 2-4 frases naturales para ser leídas en voz alta. Sin markdown ni listas."
        let history = [
            AIMessage(role: "system", content: system),
            AIMessage(role: "user", content: text)
        ]

        Task {
            do {
                let reply = try await AIService.send(messages: history)
                lastReply = reply
                speech.speak(reply, voice: store.voice, pace: store.speechPace)
            } catch {
                lastReply = "No pude responder. Revisa tu conexión."
            }
            isThinking = false
        }
    }
}
