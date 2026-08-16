import SwiftUI

/// Sol — the HGRAND OS AI coaching assistant (chat mode).
struct AssistantView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var isThinking = false
    @State private var showVoice = false

    private var theme: Theme { Theme.of(scheme) }

    private let suggestions = [
        "Resumen de mis clientes",
        "¿Quién necesita atención hoy?",
        "Ideas para retención de alumnos",
        "Ajustes para fase de definición"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if messages.isEmpty {
                    emptyState
                } else {
                    chatList
                }
                inputBar
            }
            .background(theme.background)
            .navigationTitle("Sol")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showVoice = true
                    } label: {
                        Image(systemName: "waveform.circle.fill")
                            .font(.system(size: 22))
                    }
                }
            }
            .fullScreenCover(isPresented: $showVoice) {
                VoiceConversationView()
            }
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        ScrollView {
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(theme.gold.opacity(0.1))
                        .frame(width: 88, height: 88)
                    Image(systemName: "sparkles")
                        .font(.system(size: 34))
                        .foregroundStyle(theme.gold)
                }
                .padding(.top, 48)

                VStack(spacing: 6) {
                    Text("Hola, soy Sol")
                        .font(.system(size: 24, weight: .heavy))
                        .foregroundStyle(theme.text)
                    Text("Tu copiloto de coaching. Pregúntame sobre tus clientes, planes o estrategia.")
                        .font(.system(size: 14))
                        .foregroundStyle(theme.textMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }

                VStack(spacing: 8) {
                    ForEach(suggestions, id: \.self) { suggestion in
                        Button {
                            input = suggestion
                            send()
                        } label: {
                            HStack {
                                Text(suggestion)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(theme.text)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 12))
                                    .foregroundStyle(theme.gold)
                            }
                            .padding(14)
                            .background(theme.card)
                            .clipShape(.rect(cornerRadius: 14))
                            .overlay {
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(theme.cardBorder, lineWidth: 1)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
            }
        }
    }

    // MARK: - Chat

    private var chatList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(messages) { message in
                        bubble(message)
                            .id(message.id)
                    }
                    if isThinking {
                        HStack {
                            ProgressView()
                                .padding(14)
                                .background(theme.card, in: .rect(cornerRadius: 16))
                            Spacer()
                        }
                        .id("thinking")
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .onChange(of: messages) { _, newValue in
                if let last = newValue.last {
                    withAnimation(.spring(duration: 0.4)) {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    private func bubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.role == .user { Spacer(minLength: 48) }
            Text(message.text)
                .font(.system(size: 15))
                .foregroundStyle(message.role == .user ? .white : theme.text)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(message.role == .user ? theme.gold : theme.card)
                .clipShape(.rect(cornerRadius: 18))
                .overlay {
                    if message.role == .assistant {
                        RoundedRectangle(cornerRadius: 18)
                            .strokeBorder(theme.cardBorder, lineWidth: 1)
                    }
                }
            if message.role == .assistant { Spacer(minLength: 48) }
        }
    }

    // MARK: - Input

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Pregunta a Sol...", text: $input, axis: .vertical)
                .lineLimit(1...4)
                .font(.system(size: 15))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(theme.card, in: .rect(cornerRadius: 20))
                .overlay {
                    RoundedRectangle(cornerRadius: 20)
                        .strokeBorder(theme.cardBorder, lineWidth: 1)
                }
                .onSubmit(send)

            Button(action: send) {
                Circle()
                    .fill(input.trimmingCharacters(in: .whitespaces).isEmpty ? theme.elevated : theme.gold)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(input.trimmingCharacters(in: .whitespaces).isEmpty ? theme.textMuted : .white)
                    }
            }
            .buttonStyle(.plain)
            .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || isThinking)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(theme.background)
    }

    // MARK: - Send

    private var systemPrompt: String {
        let roster = store.students.map { s in
            let lastCheckIn = s.daysSinceLastCheckIn.map { "último check-in hace \($0) días" } ?? "sin check-ins"
            return "- \(s.name): \(s.weight)kg, objetivo \(s.goal.label), adherencia \(s.adherenceScore ?? 75)%, \(lastCheckIn)"
        }.joined(separator: "\n")
        return """
        Eres Sol, el asistente inteligente de HGRAND OS, un sistema operativo premium para coaches de fitness y bodybuilding. \
        Respondes en español de forma concisa, profesional y accionable. \
        Conoces el roster actual del coach:
        \(roster)
        Tareas pendientes: \(store.pendingTasks.count). Alertas activas: \(store.intel.count).
        """
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty, !isThinking else { return }
        input = ""
        messages.append(ChatMessage(role: .user, text: text))
        isThinking = true

        let history: [AIMessage] = [AIMessage(role: "system", content: systemPrompt)] +
            messages.map { AIMessage(role: $0.role == .user ? "user" : "assistant", content: $0.text) }

        Task {
            do {
                let reply = try await AIService.send(messages: history)
                messages.append(ChatMessage(role: .assistant, text: reply))
            } catch {
                messages.append(ChatMessage(role: .assistant, text: "No pude procesar tu mensaje. Revisa tu conexión e inténtalo de nuevo."))
            }
            isThinking = false
        }
    }
}
