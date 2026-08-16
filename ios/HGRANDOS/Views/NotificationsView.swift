import SwiftUI

struct NotificationsView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var scheme

    private var theme: Theme { Theme.of(scheme) }

    var body: some View {
        NavigationStack {
            List {
                ForEach(store.notifications) { notification in
                    HStack(alignment: .top, spacing: 12) {
                        Circle()
                            .fill(notification.read ? theme.textQuaternary : theme.gold)
                            .frame(width: 8, height: 8)
                            .padding(.top, 6)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(notification.title)
                                .font(.system(size: 15, weight: .semibold))
                            Text(notification.body)
                                .font(.system(size: 13))
                                .foregroundStyle(.secondary)
                            Text(notification.date, style: .relative)
                                .font(.system(size: 11))
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
            .navigationTitle("Notificaciones")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cerrar") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Marcar leídas") { store.markAllNotificationsRead() }
                        .disabled(store.unreadCount == 0)
                }
            }
        }
    }
}
