import SwiftUI

struct ContentView: View {
    @State private var store = AppStore()
    @Environment(\.colorScheme) private var scheme

    private var theme: Theme { Theme.of(scheme) }

    var body: some View {
        TabView(selection: $store.selectedTab) {
            CommandCenterView()
                .tabItem { Label("Inicio", systemImage: "square.grid.2x2") }
                .tag(AppTab.dashboard)

            StudentsListView()
                .tabItem { Label("Clientes", systemImage: "person.2") }
                .tag(AppTab.students)

            PlansView()
                .tabItem { Label("Planes", systemImage: "list.clipboard") }
                .tag(AppTab.plans)
                .badge(store.pendingTasks.count)

            AssistantView()
                .tabItem { Label("Asistente", systemImage: "brain.head.profile") }
                .tag(AppTab.assistant)

            SettingsView()
                .tabItem { Label("Ajustes", systemImage: "line.3.horizontal") }
                .tag(AppTab.settings)
                .badge(store.unreadCount)
        }
        .tint(theme.gold)
        .environment(store)
        .preferredColorScheme(store.appearance.preferredScheme)
    }
}

#Preview {
    ContentView()
}
