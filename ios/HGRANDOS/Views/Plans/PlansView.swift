import SwiftUI

enum PlanFilter: String, CaseIterable, Identifiable {
    case all
    case nutrition
    case training

    var id: String { rawValue }

    var label: String {
        switch self {
        case .all: return "Todos"
        case .nutrition: return "Nutrición"
        case .training: return "Entreno"
        }
    }
}

struct PlansView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    @State private var filter: PlanFilter = .all

    private var theme: Theme { Theme.of(scheme) }

    private var filtered: [Student] {
        switch filter {
        case .all: return store.students
        case .nutrition: return store.students.filter { $0.nutritionPlan != nil }
        case .training: return store.students.filter { $0.trainingPlan != nil }
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Planes")
                        .font(.system(size: 32, weight: .heavy))
                        .foregroundStyle(theme.text)

                    summaryRow
                    filterRow

                    if filtered.isEmpty {
                        emptyState
                    } else {
                        VStack(spacing: 10) {
                            ForEach(filtered) { student in
                                planCard(student)
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 30)
            }
            .background(theme.background)
            .navigationDestination(for: String.self) { id in
                StudentDetailView(studentId: id)
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var summaryRow: some View {
        HStack(spacing: 12) {
            summaryCard(icon: "fork.knife", tint: theme.success, count: store.students.filter { $0.nutritionPlan != nil }.count, label: "Nutrición")
            summaryCard(icon: "dumbbell.fill", tint: theme.info, count: store.students.filter { $0.trainingPlan != nil }.count, label: "Entrenamiento")
        }
    }

    private func summaryCard(icon: String, tint: Color, count: Int, label: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            RoundedRectangle(cornerRadius: 10)
                .fill(tint.opacity(0.1))
                .frame(width: 36, height: 36)
                .overlay {
                    Image(systemName: icon)
                        .font(.system(size: 15))
                        .foregroundStyle(tint)
                }
                .padding(.bottom, 12)
            Text("\(count)")
                .font(.system(size: 28, weight: .heavy))
                .monospacedDigit()
                .foregroundStyle(theme.gold)
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(theme.textMuted)
                .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(theme.card)
        .clipShape(.rect(cornerRadius: 16))
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(theme.cardBorder, lineWidth: 1)
        }
    }

    private var filterRow: some View {
        HStack(spacing: 8) {
            ForEach(PlanFilter.allCases) { f in
                Button {
                    withAnimation(.spring(duration: 0.3)) { filter = f }
                } label: {
                    Text(f.label)
                        .font(.system(size: 14, weight: filter == f ? .bold : .medium))
                        .foregroundStyle(filter == f ? .white : theme.textMuted)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 8)
                        .background(filter == f ? theme.gold : theme.card, in: .capsule)
                        .overlay {
                            Capsule()
                                .strokeBorder(filter == f ? theme.gold : theme.cardBorder, lineWidth: 1)
                        }
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
    }

    private func planCard(_ student: Student) -> some View {
        NavigationLink(value: student.id) {
            HStack(spacing: 14) {
                AvatarView(url: student.avatarURL, name: student.name, size: 44)
                VStack(alignment: .leading, spacing: 6) {
                    Text(student.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(theme.text)
                        .lineLimit(1)
                    HStack(spacing: 8) {
                        if let nutrition = student.nutritionPlan {
                            badge(icon: "fork.knife", text: "\(nutrition.calories) kcal", color: theme.success)
                        }
                        if let training = student.trainingPlan {
                            badge(icon: "dumbbell.fill", text: "\(training.weekDays.count) días", color: theme.info)
                        }
                        if student.nutritionPlan == nil && student.trainingPlan == nil {
                            Text("Sin plan")
                                .font(.system(size: 13))
                                .foregroundStyle(theme.textMuted)
                        }
                    }
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13))
                    .foregroundStyle(theme.textQuaternary)
            }
            .padding(14)
            .background(theme.card)
            .clipShape(.rect(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(theme.cardBorder, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
    }

    private func badge(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 9))
            Text(text)
                .font(.system(size: 11, weight: .semibold))
        }
        .foregroundStyle(color)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(color.opacity(0.1), in: .rect(cornerRadius: 6))
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Circle()
                .fill(theme.card)
                .frame(width: 72, height: 72)
                .overlay {
                    Image(systemName: "list.clipboard")
                        .font(.system(size: 30))
                        .foregroundStyle(theme.gold)
                }
            Text("Sin planes")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(theme.text)
            Text("Crea planes desde los perfiles de tus clientes")
                .font(.system(size: 14))
                .foregroundStyle(theme.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }
}
