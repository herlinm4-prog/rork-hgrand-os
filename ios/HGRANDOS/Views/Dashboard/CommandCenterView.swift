import SwiftUI

/// HGRAND OS home — greeting, voice orb, daily priority, KPIs, control center, gauges and alerts.
struct CommandCenterView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    @State private var showNotifications = false
    @State private var showTasks = false
    @State private var showVoice = false
    @State private var appeared = false

    private var theme: Theme { Theme.of(scheme) }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                theme.background.ignoresSafeArea()
                LinearGradient(
                    colors: [theme.gold.opacity(0.13), .clear],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 220)
                .ignoresSafeArea(edges: .top)
                .allowsHitTesting(false)

                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        header
                        VoiceOrbCard { showVoice = true }
                        heroCard
                        kpiGrid
                        controlCenter
                        gaugesRow
                        alertsSection
                        winSection
                        todayCheckInsSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 40)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 20)
                }
            }
            .navigationDestination(for: String.self) { id in
                StudentDetailView(studentId: id)
            }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showNotifications) { NotificationsView() }
            .sheet(isPresented: $showTasks) { TasksView() }
            .fullScreenCover(isPresented: $showVoice) { VoiceConversationView() }
            .onAppear {
                withAnimation(.spring(duration: 0.6)) { appeared = true }
            }
        }
    }

    // MARK: - Header

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 6 { return "Madrugada" }
        if hour < 12 { return "Buenos días" }
        if hour < 19 { return "Buenas tardes" }
        return "Buenas noches"
    }

    private var dateLabel: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateFormat = "EEEE, d 'de' MMMM"
        let raw = formatter.string(from: Date())
        return raw.prefix(1).uppercased() + raw.dropFirst()
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 8) {
            VStack(alignment: .leading, spacing: 3) {
                Text("HGRAND OS")
                    .font(.system(size: 11, weight: .heavy))
                    .kerning(2)
                    .foregroundStyle(theme.gold)
                Text("\(greeting), \(store.coachName)")
                    .font(.system(size: 25, weight: .heavy))
                    .foregroundStyle(theme.text)
                    .lineLimit(1)
                Text(dateLabel)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(theme.textMuted)
            }
            Spacer()
            headerButton("magnifyingglass") { store.selectedTab = .students }
            headerButton("bell") { showNotifications = true }
                .overlay(alignment: .topTrailing) {
                    if store.unreadCount > 0 {
                        Text("\(min(store.unreadCount, 9))")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundStyle(.white)
                            .frame(width: 17, height: 17)
                            .background(theme.danger, in: .circle)
                            .offset(x: 3, y: -3)
                    }
                }
            Button {
                store.selectedTab = .settings
            } label: {
                Circle()
                    .fill(theme.gold.opacity(0.14))
                    .strokeBorder(theme.gold, lineWidth: 2)
                    .frame(width: 42, height: 42)
                    .overlay {
                        Text(String(store.coachName.prefix(1)))
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(theme.gold)
                    }
            }
            .buttonStyle(.plain)
        }
    }

    private func headerButton(_ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Circle()
                .fill(theme.card)
                .strokeBorder(theme.cardBorder, lineWidth: 1)
                .frame(width: 40, height: 40)
                .overlay {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(theme.text)
                }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Hero priority

    @ViewBuilder
    private var heroCard: some View {
        let priority = store.intel.first
        let accent: Color = {
            guard let priority else { return theme.success }
            switch priority.severity {
            case .critical: return theme.danger
            case .warning: return theme.warning
            case .info: return theme.info
            }
        }()

        NavigationLink(value: priority?.studentId ?? "") {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12))
                            .foregroundStyle(theme.gold)
                        Text(priority != nil ? "PRIORIDAD DE HOY" : "TODO BAJO CONTROL")
                            .font(.system(size: 11, weight: .heavy))
                            .kerning(1.2)
                            .foregroundStyle(theme.gold)
                    }
                    Spacer()
                    if store.intel.count > 1 {
                        Text("+\(store.intel.count - 1) más")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(theme.textMuted)
                    }
                }
                .padding(.bottom, 12)

                Text(priority?.title ?? "Sin pendientes críticos")
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundStyle(theme.text)
                    .multilineTextAlignment(.leading)
                Text(priority?.suggestion ?? "Buen momento para crear contenido o planificar la próxima semana.")
                    .font(.system(size: 14))
                    .foregroundStyle(theme.textTertiary)
                    .multilineTextAlignment(.leading)
                    .padding(.top, 6)

                if priority != nil {
                    HStack(spacing: 6) {
                        Text("Resolver ahora")
                            .font(.system(size: 14, weight: .bold))
                        Image(systemName: "arrow.right")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(theme.gold, in: .rect(cornerRadius: 14))
                    .padding(.top, 16)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background {
                LinearGradient(
                    colors: [accent.opacity(0.15), theme.card],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
            .clipShape(.rect(cornerRadius: 22))
            .overlay {
                RoundedRectangle(cornerRadius: 22)
                    .strokeBorder(theme.cardBorder, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
        .disabled(priority == nil)
    }

    // MARK: - KPIs

    private var kpiGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible())], spacing: 12) {
            kpiCard(icon: "person.2.fill", tint: theme.info, value: "\(store.activeStudents)", label: "Clientes activos") {
                store.selectedTab = .students
            }
            kpiCard(icon: "checkmark.clipboard.fill", tint: theme.success, value: "\(store.todayCheckIns.filter(\.done).count)/\(store.todayCheckIns.count)", label: "Check-ins hoy") {
                showTasks = true
            }
            kpiCard(icon: "exclamationmark.triangle.fill", tint: store.atRiskCount > 0 ? theme.danger : theme.textMuted, value: "\(store.atRiskCount)", label: "En riesgo") {
                showNotifications = true
            }
            kpiCard(icon: "dollarsign.circle.fill", tint: theme.gold, value: String(format: "$%.1fk", Double(store.monthlyRevenue) / 1000), label: "Ingreso mensual") {
                store.selectedTab = .settings
            }
        }
    }

    private func kpiCard(icon: String, tint: Color, value: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 0) {
                RoundedRectangle(cornerRadius: 9)
                    .fill(tint.opacity(0.12))
                    .frame(width: 32, height: 32)
                    .overlay {
                        Image(systemName: icon)
                            .font(.system(size: 14))
                            .foregroundStyle(tint)
                    }
                    .padding(.bottom, 12)
                Text(value)
                    .font(.system(size: 26, weight: .heavy))
                    .monospacedDigit()
                    .foregroundStyle(theme.text)
                Text(label)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(theme.textMuted)
                    .padding(.top, 2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(theme.card)
            .clipShape(.rect(cornerRadius: 18))
            .overlay {
                RoundedRectangle(cornerRadius: 18)
                    .strokeBorder(theme.cardBorder, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Control center

    private struct Shortcut: Identifiable {
        let id: String
        let label: String
        let icon: String
        let action: ShortcutAction
    }

    private enum ShortcutAction {
        case tab(AppTab)
        case tasks
        case voice
    }

    private var shortcuts: [Shortcut] {
        [
            Shortcut(id: "new", label: "Nuevo\ncliente", icon: "person.badge.plus", action: .tab(.students)),
            Shortcut(id: "meal", label: "Plan de\ncomida", icon: "fork.knife", action: .tab(.plans)),
            Shortcut(id: "broadcast", label: "Mensaje\nmasivo", icon: "megaphone", action: .tab(.settings)),
            Shortcut(id: "ai", label: "Asistente\nIA", icon: "brain.head.profile", action: .tab(.assistant)),
            Shortcut(id: "tasks", label: "Tareas", icon: "checklist", action: .tasks),
            Shortcut(id: "voice", label: "Voz", icon: "waveform", action: .voice),
            Shortcut(id: "plans", label: "Planes", icon: "chart.line.uptrend.xyaxis", action: .tab(.plans)),
            Shortcut(id: "settings", label: "Ajustes", icon: "gearshape", action: .tab(.settings))
        ]
    }

    private var controlCenter: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Centro de control")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(theme.text)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 16) {
                ForEach(shortcuts) { shortcut in
                    Button {
                        handle(shortcut.action)
                    } label: {
                        VStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 18)
                                .fill(theme.card)
                                .strokeBorder(theme.cardBorder, lineWidth: 1)
                                .frame(width: 56, height: 56)
                                .overlay {
                                    Image(systemName: shortcut.icon)
                                        .font(.system(size: 20))
                                        .foregroundStyle(theme.gold)
                                }
                            Text(shortcut.label)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(theme.textTertiary)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func handle(_ action: ShortcutAction) {
        switch action {
        case .tab(let tab): store.selectedTab = tab
        case .tasks: showTasks = true
        case .voice: showVoice = true
        }
    }

    // MARK: - Gauges

    private var gaugesRow: some View {
        HStack(spacing: 12) {
            gaugeCard(icon: "flame", iconTint: theme.gold, title: "Momentum", progress: store.momentum, color: theme.gold, foot: "\(store.completedTasks.count)/\(store.tasks.count) tareas")
            gaugeCard(icon: "gauge.with.needle", iconTint: theme.info, title: "Capacidad", progress: store.capacity, color: store.capacity > 0.85 ? theme.danger : theme.info, foot: "\(store.students.count)/30 cupos")
        }
    }

    private func gaugeCard(icon: String, iconTint: Color, title: String, progress: Double, color: Color, foot: String) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundStyle(iconTint)
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(theme.textTertiary)
                Spacer()
            }
            .padding(.bottom, 14)
            RingGauge(size: 84, stroke: 8, progress: progress, color: color, track: theme.cardBorder, label: "\(Int((progress * 100).rounded()))%")
                .foregroundStyle(theme.text)
            Text(foot)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(theme.textMuted)
                .padding(.top, 12)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(theme.card)
        .clipShape(.rect(cornerRadius: 20))
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(theme.cardBorder, lineWidth: 1)
        }
    }

    // MARK: - Alerts

    @ViewBuilder
    private var alertsSection: some View {
        if !store.intel.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("Atención requerida")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(theme.text)
                    Spacer()
                    Button {
                        showNotifications = true
                    } label: {
                        HStack(spacing: 2) {
                            Text("Ver todo")
                                .font(.system(size: 13, weight: .semibold))
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundStyle(theme.gold)
                    }
                }
                VStack(spacing: 8) {
                    ForEach(store.intel.prefix(4)) { item in
                        alertRow(item)
                    }
                }
            }
        }
    }

    private func severityColor(_ severity: IntelSeverity) -> Color {
        switch severity {
        case .critical: return theme.danger
        case .warning: return theme.warning
        case .info: return theme.info
        }
    }

    private func alertRow(_ item: Intel) -> some View {
        let color = severityColor(item.severity)
        return NavigationLink(value: item.studentId) {
            HStack(spacing: 12) {
                AvatarView(url: item.avatarURL, name: item.studentName, size: 40, tint: color)
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(theme.text)
                        .lineLimit(1)
                    Text(item.suggestion)
                        .font(.system(size: 12.5))
                        .foregroundStyle(theme.textTertiary)
                        .lineLimit(1)
                }
                Spacer()
                Text(item.tag)
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(color)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(color.opacity(0.1), in: .rect(cornerRadius: 8))
            }
            .padding(12)
            .background(theme.card)
            .clipShape(.rect(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(theme.cardBorder, lineWidth: 1)
            }
            .overlay(alignment: .leading) {
                UnevenRoundedRectangle(topLeadingRadius: 16, bottomLeadingRadius: 16)
                    .fill(color)
                    .frame(width: 3)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Win of the week

    @ViewBuilder
    private var winSection: some View {
        if let win = store.weeklyWin {
            VStack(alignment: .leading, spacing: 14) {
                Text("Logro de la semana")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(theme.text)
                NavigationLink(value: win.student.id) {
                    HStack(spacing: 14) {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(theme.success.opacity(0.12))
                            .frame(width: 48, height: 48)
                            .overlay {
                                Image(systemName: "trophy.fill")
                                    .font(.system(size: 20))
                                    .foregroundStyle(theme.success)
                            }
                        VStack(alignment: .leading, spacing: 3) {
                            Text(win.student.name)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(theme.text)
                            HStack(spacing: 4) {
                                Image(systemName: win.student.goal.trendsDown ? "chart.line.downtrend.xyaxis" : "chart.line.uptrend.xyaxis")
                                    .font(.system(size: 12))
                                Text(win.metric)
                                    .font(.system(size: 13, weight: .semibold))
                            }
                            .foregroundStyle(theme.success)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14))
                            .foregroundStyle(theme.textQuaternary)
                    }
                    .padding(14)
                    .background {
                        LinearGradient(
                            colors: [theme.success.opacity(0.15), theme.card],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    }
                    .clipShape(.rect(cornerRadius: 18))
                    .overlay {
                        RoundedRectangle(cornerRadius: 18)
                            .strokeBorder(theme.cardBorder, lineWidth: 1)
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Today's check-ins

    @ViewBuilder
    private var todayCheckInsSection: some View {
        let entries = store.todayCheckIns
        if !entries.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("Check-ins de hoy")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(theme.text)
                    Spacer()
                    Text("\(entries.filter(\.done).count)/\(entries.count)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(theme.gold)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(theme.gold.opacity(0.1), in: .capsule)
                }
                VStack(spacing: 8) {
                    ForEach(entries.prefix(5)) { entry in
                        NavigationLink(value: entry.id) {
                            HStack(spacing: 12) {
                                AvatarView(url: entry.avatarURL, name: entry.name, size: 36, tint: theme.gold)
                                Text(entry.name)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(theme.text)
                                    .lineLimit(1)
                                Spacer()
                                HStack(spacing: 5) {
                                    Circle()
                                        .fill(entry.done ? theme.success : theme.warning)
                                        .frame(width: 6, height: 6)
                                    Text(entry.done ? "Enviado" : "Pendiente")
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(entry.done ? theme.success : theme.warning)
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background((entry.done ? theme.success : theme.warning).opacity(0.1), in: .capsule)
                            }
                            .padding(12)
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
            }
        }
    }
}
