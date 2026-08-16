import SwiftUI

/// New client intake form — physical data, activity, goal, medical history and emergency contact.
struct AddStudentView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var instagram = ""
    @State private var age = ""
    @State private var gender: Gender = .male
    @State private var height = ""
    @State private var weight = ""
    @State private var bodyFat = ""
    @State private var goalWeight = ""
    @State private var activity: ActivityLevel = .moderate
    @State private var goal: FitnessGoal = .loseFat
    @State private var occupation = ""
    @State private var bloodType = ""
    @State private var conditionsText = ""
    @State private var allergiesText = ""
    @State private var injuriesText = ""
    @State private var notes = ""
    @State private var showValidationError = false

    private let bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Nombre *") {
                    TextField("Nombre completo", text: $name)
                }

                Section("Contacto") {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    TextField("Teléfono", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("@usuario_instagram", text: $instagram)
                        .textInputAutocapitalization(.never)
                }

                Section("Datos físicos *") {
                    LabeledContent("Edad") {
                        TextField("25", text: $age)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                    }
                    Picker("Sexo", selection: $gender) {
                        ForEach(Gender.allCases) { g in
                            Text(g.label).tag(g)
                        }
                    }
                    .pickerStyle(.segmented)
                    LabeledContent("Altura (cm)") {
                        TextField("175", text: $height)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                    }
                    LabeledContent("Peso (kg)") {
                        TextField("80", text: $weight)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                    }
                    LabeledContent("Grasa corporal %") {
                        TextField("15", text: $bodyFat)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                    }
                    LabeledContent("Peso objetivo (kg)") {
                        TextField("75", text: $goalWeight)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 90)
                    }
                }

                Section("Perfil") {
                    Picker("Nivel de actividad", selection: $activity) {
                        ForEach(ActivityLevel.allCases) { level in
                            Text(level.label).tag(level)
                        }
                    }
                    Picker("Objetivo", selection: $goal) {
                        ForEach(FitnessGoal.allCases) { g in
                            Text(g.label).tag(g)
                        }
                    }
                    TextField("Ocupación", text: $occupation)
                }

                Section("Historial médico") {
                    Picker("Tipo de sangre", selection: $bloodType) {
                        Text("—").tag("")
                        ForEach(bloodTypes, id: \.self) { bt in
                            Text(bt).tag(bt)
                        }
                    }
                    TextField("Patologías (separadas por coma)", text: $conditionsText)
                    TextField("Alergias (separadas por coma)", text: $allergiesText)
                    TextField("Lesiones (separadas por coma)", text: $injuriesText)
                }

                Section("Notas adicionales") {
                    TextField("Historial deportivo, preferencias, horarios...", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section {
                    Button(action: save) {
                        HStack {
                            Spacer()
                            Label("Añadir Cliente", systemImage: "person.badge.plus")
                                .fontWeight(.bold)
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Nuevo Cliente")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { dismiss() }
                }
            }
            .alert("Completa los campos obligatorios", isPresented: $showValidationError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Nombre, edad, altura y peso son necesarios.")
            }
        }
    }

    private func splitTags(_ text: String) -> [String] {
        text.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
    }

    private func save() {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty,
              let ageValue = Int(age),
              let heightValue = Double(height),
              let weightValue = Double(weight) else {
            showValidationError = true
            return
        }

        let bodyFatValue = Double(bodyFat) ?? (gender == .male ? 15 : 25)
        let bmr = calculateBMR(weightKg: weightValue, bodyFatPercentage: bodyFatValue)
        let tdee = calculateTDEE(bmr: bmr, activity: activity)

        let student = Student(
            id: UUID().uuidString,
            name: name.trimmingCharacters(in: .whitespaces),
            email: email.trimmingCharacters(in: .whitespaces),
            phone: phone.isEmpty ? nil : phone,
            instagram: instagram.isEmpty ? nil : instagram,
            age: ageValue,
            gender: gender,
            height: heightValue,
            weight: weightValue,
            goalWeight: Double(goalWeight),
            activityLevel: activity,
            goal: goal,
            notes: notes,
            occupation: occupation.isEmpty ? nil : occupation,
            medicalConditions: splitTags(conditionsText),
            allergies: splitTags(allergiesText),
            injuries: splitTags(injuriesText),
            bloodType: bloodType.isEmpty ? nil : bloodType,
            bmr: bmr,
            tdee: tdee,
            bodyFatPercentage: Double(bodyFat),
            adherenceScore: 75,
            createdAt: Date()
        )
        store.addStudent(student)
        dismiss()
    }
}
