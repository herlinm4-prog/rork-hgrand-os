import SwiftUI
import Charts

/// Full athlete profile — stats, weight progress chart, plans, medical data and check-ins.
struct StudentDetailView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    let studentId: String

    private var theme: Theme { Theme.of(scheme) }
    private var student: Student? { store.student(withId: studentId) }

    var body: some View {
        Group {
            if let student {
                content(student)
            } else {
                Text("Cliente no encontrado")
                    .foregroundStyle(theme.textMuted)
            }
        }
        .background(theme.background)
    }

    private func content(_ s: Student) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                headerSection(s)
                statsGrid(s)
                if s.checkIns.count >= 2 {
                    weightChart(s)
                }
                if let plan = s.nutritionPlan {
                    nutritionSection(plan)
                }
                if let plan = s.trainingPlan {
                    trainingSection(plan)
                }
                medicalSection(s)
                if !s.checkIns.isEmpty {
                    checkInsSection(s)
                }
                if !s.notes.isEmpty {
                    notesSection(s)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
        .navigationTitle(s.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Header

    private func headerSection(_ s: Student) -> some View {
        VStack(spacing: 12) {
            AvatarView(url: s.avatarURL, name: s.name, size: 88)
                .overlay {
                    Circle().strokeBorder(theme.gold, lineWidth: 2)
                }
            Text(s.name)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(theme.text)
            HStack(spacing: 8) {
                chip(s.goal.label, color: theme.gold)
                chip("\(s.age) años", color: theme.info)
                chip(s.activityLevel.label, color: theme.success)
            }
            if let instagram = s.instagram {
                Text(instagram)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(theme.textMuted)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }

    private func chip(_ text: String, color: Color) -> some View {
        Text(text)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.12), in: .capsule)
    }

    // MARK: - Stats

    private func statsGrid(_ s: Student) -> some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible())], spacing: 12) {
            statCard(label: "Peso actual", value: "\(s.weight.formatted()) kg", icon: "scalemass", tint: theme.gold)
            statCard(label: "Grasa corporal", value: s.bodyFatPercentage.map { "\($0.formatted())%" } ?? "—", icon: "percent", tint: theme.info)
            statCard(label: "TDEE", value: "\(s.tdee) kcal", icon: "flame", tint: theme.orange)
            statCard(label: "Adherencia", value: s.adherenceScore.map { "\($0)%" } ?? "—", icon: "chart.bar", tint: theme.success)
        }
    }

    private func statCard(label: String, value: String, icon: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                    .foregroundStyle(tint)
                Text(label)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(theme.textMuted)
            }
            Text(value)
                .font(.system(size: 21, weight: .heavy))
                .monospacedDigit()
                .foregroundStyle(theme.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(theme.card)
        .clipShape(.rect(cornerRadius: 16))
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(theme.cardBorder, lineWidth: 1)
        }
    }

    // MARK: - Weight chart

    private func weightChart(_ s: Student) -> some View {
        sectionCard(title: "Progreso de peso", icon: "chart.xyaxis.line") {
            Chart(s.checkIns) { checkIn in
                LineMark(
                    x: .value("Fecha", checkIn.date),
                    y: .value("Peso", checkIn.weight)
                )
                .foregroundStyle(theme.gold)
                .interpolationMethod(.catmullRom)
                .lineStyle(StrokeStyle(lineWidth: 2.5, lineCap: .round))

                AreaMark(
                    x: .value("Fecha", checkIn.date),
                    y: .value("Peso", checkIn.weight)
                )
                .foregroundStyle(
                    LinearGradient(colors: [theme.gold.opacity(0.25), .clear], startPoint: .top, endPoint: .bottom)
                )
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("Fecha", checkIn.date),
                    y: .value("Peso", checkIn.weight)
                )
                .foregroundStyle(theme.gold)
                .symbolSize(40)
            }
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 180)
        }
    }

    // MARK: - Nutrition

    private func nutritionSection(_ plan: NutritionPlan) -> some View {
        sectionCard(title: "Plan nutricional", icon: "fork.knife") {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    macroPill("\(plan.calories)", "kcal", theme.gold)
                    macroPill("\(plan.protein)g", "Proteína", theme.info)
                    macroPill("\(plan.carbs)g", "Carbos", theme.success)
                    macroPill("\(plan.fats)g", "Grasas", theme.orange)
                }
                ForEach(plan.meals) { meal in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(meal.name.uppercased())
                                .font(.system(size: 13, weight: .heavy))
                                .kerning(0.5)
                                .foregroundStyle(Color(hex: "2E5D43"))
                            Spacer()
                            Text(meal.time)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(theme.textMuted)
                        }
                        ForEach(meal.foods) { food in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(theme.textQuaternary)
                                    .frame(width: 3, height: 3)
                                Text("\(food.quantity.formatted()) \(food.unit) \(food.name)")
                                    .font(.system(size: 13.5))
                                    .foregroundStyle(theme.textSecondary)
                                Spacer()
                                Text("\(food.calories) kcal")
                                    .font(.system(size: 12))
                                    .monospacedDigit()
                                    .foregroundStyle(theme.textMuted)
                            }
                        }
                        if let objective = meal.objective {
                            Text("Objetivo: \(objective)")
                                .font(.system(size: 12))
                                .italic()
                                .foregroundStyle(theme.textMuted)
                                .padding(.top, 2)
                        }
                    }
                    .padding(.top, 6)
                }
                if !plan.supplements.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("SUPLEMENTOS")
                            .font(.system(size: 11, weight: .heavy))
                            .kerning(1)
                            .foregroundStyle(theme.textMuted)
                        ForEach(plan.supplements) { supplement in
                            Text("• \(supplement.name) — \(supplement.dosage) · \(supplement.timing)")
                                .font(.system(size: 13))
                                .foregroundStyle(theme.textSecondary)
                        }
                    }
                    .padding(.top, 6)
                }
            }
        }
    }

    private func macroPill(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 15, weight: .heavy))
                .monospacedDigit()
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(theme.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.08), in: .rect(cornerRadius: 10))
    }

    // MARK: - Training

    private func trainingSection(_ plan: TrainingPlan) -> some View {
        sectionCard(title: plan.name, icon: "dumbbell") {
            VStack(alignment: .leading, spacing: 12) {
                chip(plan.phase, color: theme.info)
                ForEach(plan.weekDays) { day in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(day.dayName)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(theme.text)
                        Text(day.muscleGroups.joined(separator: " · "))
                            .font(.system(size: 12))
                            .foregroundStyle(theme.textMuted)
                        ForEach(day.exercises) { exercise in
                            HStack {
                                Text(exercise.name)
                                    .font(.system(size: 13))
                                    .foregroundStyle(theme.textSecondary)
                                Spacer()
                                Text("\(exercise.sets)×\(exercise.reps)\(exercise.weight.map { " · \($0.formatted())kg" } ?? "")")
                                    .font(.system(size: 12, weight: .medium))
                                    .monospacedDigit()
                                    .foregroundStyle(theme.textMuted)
                            }
                        }
                    }
                    .padding(.top, 4)
                }
            }
        }
    }

    // MARK: - Medical

    @ViewBuilder
    private func medicalSection(_ s: Student) -> some View {
        let hasData = !s.medicalConditions.isEmpty || !s.allergies.isEmpty || !s.injuries.isEmpty || !s.medications.isEmpty || s.bloodType != nil
        if hasData {
            sectionCard(title: "Historial médico", icon: "heart.text.square") {
                VStack(alignment: .leading, spacing: 10) {
                    if let bloodType = s.bloodType {
                        medicalRow(icon: "drop.fill", tint: theme.danger, label: "Sangre", values: [bloodType])
                    }
                    if !s.medicalConditions.isEmpty {
                        medicalRow(icon: "exclamationmark.triangle.fill", tint: theme.warning, label: "Condiciones", values: s.medicalConditions)
                    }
                    if !s.allergies.isEmpty {
                        medicalRow(icon: "allergens", tint: theme.orange, label: "Alergias", values: s.allergies)
                    }
                    if !s.injuries.isEmpty {
                        medicalRow(icon: "bandage.fill", tint: theme.danger, label: "Lesiones", values: s.injuries)
                    }
                    if !s.medications.isEmpty {
                        medicalRow(icon: "pills.fill", tint: theme.info, label: "Medicamentos", values: s.medications)
                    }
                }
            }
        }
    }

    private func medicalRow(icon: String, tint: Color, label: String, values: [String]) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(tint)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(theme.textMuted)
                Text(values.joined(separator: ", "))
                    .font(.system(size: 14))
                    .foregroundStyle(theme.text)
            }
        }
    }

    // MARK: - Check-ins

    private func checkInsSection(_ s: Student) -> some View {
        sectionCard(title: "Check-ins", icon: "checkmark.clipboard") {
            VStack(spacing: 10) {
                ForEach(s.checkIns.reversed()) { checkIn in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(checkIn.date, format: .dateTime.day().month(.wide))
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(theme.text)
                            Spacer()
                            Text("\(checkIn.weight.formatted()) kg")
                                .font(.system(size: 14, weight: .heavy))
                                .monospacedDigit()
                                .foregroundStyle(theme.gold)
                        }
                        if !checkIn.notes.isEmpty {
                            Text(checkIn.notes)
                                .font(.system(size: 13))
                                .foregroundStyle(theme.textTertiary)
                        }
                        if let feedback = checkIn.coachFeedback {
                            Text("Coach: \(feedback)")
                                .font(.system(size: 12))
                                .italic()
                                .foregroundStyle(theme.success)
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(theme.cardAlt, in: .rect(cornerRadius: 12))
                }
            }
        }
    }

    private func notesSection(_ s: Student) -> some View {
        sectionCard(title: "Notas", icon: "note.text") {
            Text(s.notes)
                .font(.system(size: 14))
                .foregroundStyle(theme.textSecondary)
        }
    }

    // MARK: - Section shell

    private func sectionCard<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(theme.gold)
                Text(title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(theme.text)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(theme.card)
        .clipShape(.rect(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .strokeBorder(theme.cardBorder, lineWidth: 1)
        }
    }
}
