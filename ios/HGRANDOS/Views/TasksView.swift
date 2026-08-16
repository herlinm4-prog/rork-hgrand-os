import SwiftUI

struct TasksView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var scheme

    private var theme: Theme { Theme.of(scheme) }

    var body: some View {
        NavigationStack {
            List {
                Section("Pendientes") {
                    ForEach(store.pendingTasks) { task in
                        taskRow(task)
                    }
                    if store.pendingTasks.isEmpty {
                        Text("Sin tareas pendientes")
                            .foregroundStyle(.secondary)
                    }
                }
                Section("Completadas") {
                    ForEach(store.completedTasks) { task in
                        taskRow(task)
                    }
                }
            }
            .navigationTitle("Tareas")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }

    private func taskRow(_ task: CoachTask) -> some View {
        Button {
            withAnimation(.spring(duration: 0.35)) {
                store.toggleTask(task.id)
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: task.done ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22))
                    .foregroundStyle(task.done ? theme.success : theme.textQuaternary)
                VStack(alignment: .leading, spacing: 2) {
                    Text(task.title)
                        .font(.system(size: 15, weight: .medium))
                        .strikethrough(task.done)
                        .foregroundStyle(task.done ? .secondary : .primary)
                    Text(task.detail)
                        .font(.system(size: 12.5))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
