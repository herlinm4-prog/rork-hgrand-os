import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    @State private var showNotifications = false
    @State private var showTasks = false

    private var theme: Theme { Theme.of(scheme) }

    var body: some View {
        @Bindable var store = store
        NavigationStack {
            List {
                Section("Perfil") {
                    HStack(spacing: 14) {
                        Circle()
                            .fill(theme.gold.opacity(0.14))
                            .strokeBorder(theme.gold, lineWidth: 2)
                            .frame(width: 52, height: 52)
                            .overlay {
                                Text(String(store.coachName.prefix(1)))
                                    .font(.system(size: 20, weight: .heavy))
                                    .foregroundStyle(theme.gold)
                            }
                        VStack(alignment: .leading, spacing: 2) {
                            TextField("Nombre del coach", text: $store.coachName)
                                .font(.system(size: 17, weight: .semibold))
                            Text("HGRAND OS · Elite Coaching")
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Apariencia") {
                    Picker("Tema", selection: $store.appearance) {
                        ForEach(AppearanceMode.allCases) { mode in
                            Text(mode.label).tag(mode)
                        }
                    }
                }

                Section {
                    Picker("Voz", selection: $store.voice) {
                        ForEach(VoiceOption.allCases) { voice in
                            Text("\(voice.label) — \(voice.detail)").tag(voice)
                        }
                    }
                    Picker("Velocidad", selection: $store.speechPace) {
                        ForEach(SpeechPace.allCases) { pace in
                            Text(pace.label).tag(pace)
                        }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("Asistente de voz")
                } footer: {
                    Text("3 voces en español y 3 en inglés: mujer, hombre y hombre con voz grave.")
                }

                Section("Gestión") {
                    Button {
                        showNotifications = true
                    } label: {
                        settingsRow(icon: "bell.fill", tint: theme.danger, title: "Notificaciones", badge: store.unreadCount)
                    }
                    Button {
                        showTasks = true
                    } label: {
                        settingsRow(icon: "checklist", tint: theme.info, title: "Tareas", badge: store.pendingTasks.count)
                    }
                }

                Section("Negocio") {
                    LabeledContent("Clientes activos", value: "\(store.activeStudents)")
                    LabeledContent("Ingreso mensual estimado", value: "$\(store.monthlyRevenue)")
                    LabeledContent("Capacidad", value: "\(store.students.count)/30")
                }

                Section("Acerca de") {
                    LabeledContent("Versión", value: "1.0")
                    LabeledContent("Sistema", value: "HGRAND OS")
                }
            }
            .navigationTitle("Ajustes")
            .sheet(isPresented: $showNotifications) { NotificationsView() }
            .sheet(isPresented: $showTasks) { TasksView() }
        }
    }

    private func settingsRow(icon: String, tint: Color, title: String, badge: Int) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 7)
                .fill(tint)
                .frame(width: 29, height: 29)
                .overlay {
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundStyle(.white)
                }
            Text(title)
                .foregroundStyle(.primary)
            Spacer()
            if badge > 0 {
                Text("\(badge)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(tint, in: .capsule)
            }
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.tertiary)
        }
    }
}
