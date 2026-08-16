import Foundation

struct FoodItem: Identifiable {
    let id = UUID()
    var name: String
    var quantity: Double
    var unit: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fats: Int
}

struct Meal: Identifiable {
    let id: String
    var name: String
    var time: String
    var foods: [FoodItem]
    var objective: String?

    init(id: String, name: String, time: String, foods: [FoodItem], objective: String? = nil) {
        self.id = id
        self.name = name
        self.time = time
        self.foods = foods
        self.objective = objective
    }
}

struct Supplement: Identifiable {
    let id = UUID()
    var name: String
    var dosage: String
    var timing: String
}

struct NutritionPlan {
    let id: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fats: Int
    var meals: [Meal]
    var supplements: [Supplement]
    var notes: String
    var createdAt: Date
}

struct Exercise: Identifiable {
    let id: String
    var name: String
    var sets: Int
    var reps: String
    var weight: Double?
    var rir: Int?
    var restSeconds: Int

    init(id: String, name: String, sets: Int, reps: String, weight: Double? = nil, rir: Int? = nil, restSeconds: Int) {
        self.id = id
        self.name = name
        self.sets = sets
        self.reps = reps
        self.weight = weight
        self.rir = rir
        self.restSeconds = restSeconds
    }
}

struct TrainingDay: Identifiable {
    let id: String
    var dayName: String
    var muscleGroups: [String]
    var exercises: [Exercise]
}

struct TrainingPlan {
    let id: String
    var name: String
    var phase: String
    var notes: String
    var weekDays: [TrainingDay]
    var createdAt: Date
}
