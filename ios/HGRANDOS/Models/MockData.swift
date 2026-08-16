import Foundation

/// Demo roster mirroring the HGRAND OS seed data.
enum MockData {
    static func daysAgo(_ days: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
    }

    static let students: [Student] = [
        Student(
            id: "1",
            name: "Carlos Mendoza",
            email: "carlos@email.com",
            phone: "+58 412-555-0101",
            instagram: "@carlosmendoza_fit",
            avatarURL: URL(string: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop&crop=face"),
            age: 28,
            gender: .male,
            height: 178,
            weight: 82,
            goalWeight: 75,
            activityLevel: .active,
            goal: .loseFat,
            notes: "Entrena 5 veces por semana. Quiere definir para verano.",
            occupation: "Personal Trainer",
            allergies: ["Lactosa"],
            injuries: ["Esguince tobillo izquierdo (2024)"],
            bloodType: "O+",
            bmr: 1842,
            tdee: 3177,
            bodyFatPercentage: 17,
            adherenceScore: 85,
            createdAt: daysAgo(120),
            checkIns: [
                CheckIn(id: "c1", date: daysAgo(21), weight: 84, bodyFatPercentage: 18, notes: "Buen progreso en la semana", mood: 4, sleepHours: 7, waterIntake: 3, stressLevel: 2, energyLevel: 4, trainingPerformance: 4),
                CheckIn(id: "c2", date: daysAgo(14), weight: 83, bodyFatPercentage: 17, notes: "Bajó 1kg, buena adherencia", coachFeedback: "Excelente progreso, mantener déficit", mood: 5, sleepHours: 8, waterIntake: 3.5, stressLevel: 1, energyLevel: 5, trainingPerformance: 5),
                CheckIn(id: "c3", date: daysAgo(7), weight: 82, bodyFatPercentage: 16.5, notes: "Sigue bajando, fuerza estable", coachFeedback: "Continuar con el plan actual", mood: 4, sleepHours: 7.5, waterIntake: 3, stressLevel: 2, energyLevel: 4, trainingPerformance: 4)
            ],
            nutritionPlan: NutritionPlan(
                id: "np1",
                calories: 2400,
                protein: 180,
                carbs: 240,
                fats: 67,
                meals: [
                    Meal(id: "m1", name: "Comida 1 — Pre entrenamiento", time: "07:00", foods: [
                        FoodItem(name: "Avena en seco", quantity: 80, unit: "g", calories: 300, protein: 10, carbs: 54, fats: 5),
                        FoodItem(name: "Claras de huevo", quantity: 200, unit: "ml", calories: 100, protein: 22, carbs: 0, fats: 0),
                        FoodItem(name: "Banana", quantity: 1, unit: "unidad", calories: 105, protein: 1, carbs: 27, fats: 0)
                    ], objective: "Estabilidad glucémica y rendimiento"),
                    Meal(id: "m2", name: "Comida 2 — Post entrenamiento", time: "12:30", foods: [
                        FoodItem(name: "Pollo hervido", quantity: 220, unit: "g", calories: 330, protein: 62, carbs: 0, fats: 7),
                        FoodItem(name: "Arroz basmati cocido", quantity: 130, unit: "g", calories: 350, protein: 7, carbs: 77, fats: 3),
                        FoodItem(name: "Zucchini", quantity: 100, unit: "g", calories: 35, protein: 2, carbs: 6, fats: 0)
                    ], objective: "Maximizar recuperación y utilización de glucosa")
                ],
                supplements: [
                    Supplement(name: "Proteína Whey", dosage: "30g", timing: "Post-entreno"),
                    Supplement(name: "Creatina", dosage: "5g", timing: "Con desayuno"),
                    Supplement(name: "Omega-3", dosage: "2g", timing: "Con almuerzo")
                ],
                notes: "Ajustar carbos en días de descanso -30g",
                createdAt: daysAgo(45)
            ),
            trainingPlan: TrainingPlan(
                id: "tp1",
                name: "Push Pull Legs - Definición",
                phase: "Hipertrofia",
                notes: "Mantener intensidad alta, reducir volumen si fatiga acumulada",
                weekDays: [
                    TrainingDay(id: "td1", dayName: "Lunes - Push", muscleGroups: ["Pecho", "Hombros", "Tríceps"], exercises: [
                        Exercise(id: "e1", name: "Press banca plano", sets: 4, reps: "8-10", weight: 90, rir: 2, restSeconds: 120),
                        Exercise(id: "e2", name: "Press inclinado mancuernas", sets: 3, reps: "10-12", weight: 32, rir: 2, restSeconds: 90),
                        Exercise(id: "e3", name: "Press militar", sets: 4, reps: "8-10", weight: 50, rir: 2, restSeconds: 120),
                        Exercise(id: "e4", name: "Elevaciones laterales", sets: 3, reps: "12-15", weight: 12, rir: 1, restSeconds: 60),
                        Exercise(id: "e5", name: "Fondos en paralelas", sets: 3, reps: "10-12", rir: 2, restSeconds: 90)
                    ]),
                    TrainingDay(id: "td2", dayName: "Martes - Pull", muscleGroups: ["Espalda", "Bíceps"], exercises: [
                        Exercise(id: "e6", name: "Dominadas", sets: 4, reps: "8-10", rir: 2, restSeconds: 120),
                        Exercise(id: "e7", name: "Remo con barra", sets: 4, reps: "8-10", weight: 80, rir: 2, restSeconds: 120),
                        Exercise(id: "e8", name: "Jalón al pecho", sets: 3, reps: "10-12", weight: 60, rir: 2, restSeconds: 90),
                        Exercise(id: "e9", name: "Curl bíceps barra", sets: 3, reps: "10-12", weight: 30, rir: 1, restSeconds: 60)
                    ]),
                    TrainingDay(id: "td3", dayName: "Miércoles - Legs", muscleGroups: ["Cuádriceps", "Isquios", "Glúteos"], exercises: [
                        Exercise(id: "e11", name: "Sentadilla", sets: 4, reps: "6-8", weight: 120, rir: 2, restSeconds: 180),
                        Exercise(id: "e12", name: "Prensa", sets: 4, reps: "10-12", weight: 200, rir: 2, restSeconds: 120),
                        Exercise(id: "e13", name: "Curl femoral", sets: 3, reps: "10-12", weight: 45, rir: 2, restSeconds: 90),
                        Exercise(id: "e15", name: "Elevación de pantorrillas", sets: 4, reps: "15-20", weight: 60, rir: 1, restSeconds: 60)
                    ])
                ],
                createdAt: daysAgo(45)
            )
        ),
        Student(
            id: "2",
            name: "María García",
            email: "maria@email.com",
            phone: "+58 414-555-0202",
            instagram: "@mariagarcia_wellness",
            avatarURL: URL(string: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face"),
            age: 32,
            gender: .female,
            height: 165,
            weight: 62,
            goalWeight: 58,
            activityLevel: .moderate,
            goal: .loseFat,
            notes: "Madre de 2 hijos. Entrena 3 veces por semana en casa.",
            occupation: "Diseñadora gráfica",
            medicalConditions: ["Hipotiroidismo"],
            allergies: ["Gluten"],
            medications: ["Levotiroxina 50mcg"],
            bloodType: "A+",
            bmr: 1398,
            tdee: 2167,
            bodyFatPercentage: 26,
            adherenceScore: 60,
            createdAt: daysAgo(90),
            checkIns: [
                CheckIn(id: "c4", date: daysAgo(0), weight: 63, bodyFatPercentage: 26, notes: "Primera semana de adaptación", mood: 3, sleepHours: 5.5, waterIntake: 2, stressLevel: 4, energyLevel: 2, trainingPerformance: 3)
            ]
        ),
        Student(
            id: "3",
            name: "Diego Ramírez",
            email: "diego@email.com",
            phone: "+58 424-555-0303",
            instagram: "@diegoramirez_bb",
            avatarURL: URL(string: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"),
            age: 24,
            gender: .male,
            height: 182,
            weight: 72,
            goalWeight: 82,
            activityLevel: .veryActive,
            goal: .buildMuscle,
            notes: "Competidor natural. Fase de volumen limpio.",
            occupation: "Estudiante universitario",
            injuries: ["Tendinitis rotuliana leve"],
            bloodType: "B+",
            bmr: 1798,
            tdee: 3416,
            bodyFatPercentage: 13,
            adherenceScore: 95,
            createdAt: daysAgo(150),
            checkIns: [
                CheckIn(id: "c5", date: daysAgo(32), weight: 70, bodyFatPercentage: 12, notes: "Inicio de volumen", mood: 5, sleepHours: 8, waterIntake: 4, stressLevel: 1, energyLevel: 5, trainingPerformance: 5),
                CheckIn(id: "c6", date: daysAgo(2), weight: 72, bodyFatPercentage: 13, notes: "+2kg en un mes, fuerza subiendo", coachFeedback: "Ganancia limpia, seguir igual", mood: 5, sleepHours: 8.5, waterIntake: 4, stressLevel: 1, energyLevel: 5, trainingPerformance: 5)
            ],
            trainingPlan: TrainingPlan(
                id: "tp2",
                name: "Upper Lower - Volumen",
                phase: "Hipertrofia",
                notes: "Progresión lineal en compuestos. Deload cada 4 semanas.",
                weekDays: [
                    TrainingDay(id: "td4", dayName: "Lunes - Upper A", muscleGroups: ["Pecho", "Espalda", "Hombros"], exercises: [
                        Exercise(id: "e16", name: "Press banca", sets: 4, reps: "6-8", weight: 80, rir: 2, restSeconds: 180),
                        Exercise(id: "e17", name: "Remo pendlay", sets: 4, reps: "6-8", weight: 70, rir: 2, restSeconds: 120),
                        Exercise(id: "e18", name: "Press militar", sets: 3, reps: "8-10", weight: 45, rir: 2, restSeconds: 120)
                    ]),
                    TrainingDay(id: "td5", dayName: "Martes - Lower A", muscleGroups: ["Cuádriceps", "Isquios", "Pantorrillas"], exercises: [
                        Exercise(id: "e20", name: "Sentadilla", sets: 5, reps: "5-6", weight: 100, rir: 2, restSeconds: 180),
                        Exercise(id: "e21", name: "Peso muerto rumano", sets: 4, reps: "8-10", weight: 80, rir: 2, restSeconds: 120),
                        Exercise(id: "e22", name: "Prensa", sets: 3, reps: "10-12", weight: 180, rir: 2, restSeconds: 120)
                    ])
                ],
                createdAt: daysAgo(60)
            )
        ),
        Student(
            id: "4",
            name: "Ana Rodríguez",
            email: "ana@email.com",
            phone: "+58 416-555-0404",
            instagram: "@ana_bikini_fitness",
            avatarURL: URL(string: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face"),
            age: 27,
            gender: .female,
            height: 170,
            weight: 65,
            activityLevel: .active,
            goal: .competition,
            notes: "Preparación bikini fitness. Competencia en julio.",
            bmr: 1478,
            tdee: 2550,
            adherenceScore: 70,
            createdAt: daysAgo(30)
        ),
        Student(
            id: "5",
            name: "Roberto Silva",
            email: "roberto@email.com",
            phone: "+58 426-555-0505",
            instagram: "@robertosilva_exec",
            avatarURL: URL(string: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face"),
            age: 35,
            gender: .male,
            height: 175,
            weight: 90,
            goalWeight: 80,
            activityLevel: .light,
            goal: .loseFat,
            notes: "Ejecutivo, poco tiempo. Necesita planes eficientes.",
            bmr: 1900,
            tdee: 2613,
            adherenceScore: 40,
            createdAt: daysAgo(14)
        )
    ]

    static let tasks: [CoachTask] = [
        CoachTask(title: "Revisar check-in de María", detail: "Ajustar calorías si es necesario", done: false),
        CoachTask(title: "Preparar peak week de Ana", detail: "Protocolo de agua y sodio", done: false),
        CoachTask(title: "Enviar plan actualizado a Carlos", detail: "Reducir carbos días de descanso", done: true),
        CoachTask(title: "Llamar a Roberto", detail: "Seguimiento de adherencia", done: false),
        CoachTask(title: "Actualizar progresión de Diego", detail: "Subir pesos en compuestos", done: true)
    ]

    static let notifications: [HGNotification] = [
        HGNotification(title: "Check-in recibido", body: "María García envió su check-in semanal.", read: false, date: daysAgo(0)),
        HGNotification(title: "Riesgo de fuga", body: "Roberto Silva lleva 14 días sin actividad.", read: false, date: daysAgo(1)),
        HGNotification(title: "Logro desbloqueado", body: "Carlos Mendoza alcanzó -2 kg este mes.", read: true, date: daysAgo(3))
    ]
}
