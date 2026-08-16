import SwiftUI

struct StudentsListView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    @State private var search = ""
    @State private var showAdd = false

    private var theme: Theme { Theme.of(scheme) }

    private var filtered: [Student] {
        guard !search.isEmpty else { return store.students }
        return store.students.filter {
            $0.name.localizedStandardContains(search) || $0.email.localizedStandardContains(search)
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if filtered.isEmpty {
                    emptyState
                } else {
                    List {
                        Section {
                            ForEach(filtered) { student in
                                NavigationLink(value: student.id) {
                                    StudentRow(student: student)
                                }
                                .listRowBackground(theme.card)
                            }
                        } header: {
                            Text("\(filtered.count) clientes")
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .background(theme.background)
            .navigationTitle("Clientes")
            .searchable(text: $search, prompt: "Buscar clientes...")
            .navigationDestination(for: String.self) { id in
                StudentDetailView(studentId: id)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAdd = true
                    } label: {
                        Image(systemName: "plus")
                            .fontWeight(.semibold)
                    }
                }
            }
            .sheet(isPresented: $showAdd) {
                AddStudentView()
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Circle()
                .fill(theme.card)
                .frame(width: 72, height: 72)
                .overlay {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 28))
                        .foregroundStyle(theme.gold)
                }
                .padding(.bottom, 8)
            Text("Sin clientes aún")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(theme.text)
            Text("Añade tu primer cliente para comenzar")
                .font(.system(size: 15))
                .foregroundStyle(theme.textMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
