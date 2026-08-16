import Foundation

enum Gender: String, CaseIterable, Identifiable {
    case male
    case female

    var id: String { rawValue }

    var label: String {
        switch self {
        case .male: return "M"
        case .female: return "F"
        }
    }
}

enum ActivityLevel: String, CaseIterable, Identifiable {
    case sedentary
    case light
    case moderate
    case active
    case veryActive

    var id: String { rawValue }

    var label: String {
        switch self {
        case .sedentary: return "Sedentario"
        case .light: return "Ligero"
        case .moderate: return "Moderado"
        case .active: return "Activo"
        case .veryActive: return "Muy activo"
        }
    }

    var multiplier: Double {
        switch self {
        case .sedentary: return 1.2
        case .light: return 1.375
        case .moderate: return 1.55
        case .active: return 1.725
        case .veryActive: return 1.9
        }
    }
}

enum FitnessGoal: String, CaseIterable, Identifiable {
    case loseFat
    case buildMuscle
    case maintain
    case competition
    case recomposition

    var id: String { rawValue }

    var label: String {
        switch self {
        case .loseFat: return "Perder grasa"
        case .buildMuscle: return "Ganar músculo"
        case .maintain: return "Mantener"
        case .competition: return "Competición"
        case .recomposition: return "Recomposición"
        }
    }

    /// Whether progress for this goal means the scale trending down.
    var trendsDown: Bool {
        self == .loseFat || self == .competition
    }
}

struct EmergencyContact {
    var name: String
    var phone: String
    var relationship: String
}

struct CheckIn: Identifiable {
    let id: String
    var date: Date
    var weight: Double
    var bodyFatPercentage: Double?
    var notes: String
    var coachFeedback: String?
    var mood: Int?
    var sleepHours: Double?
    var waterIntake: Double?
    var stressLevel: Int?
    var energyLevel: Int?
    var trainingPerformance: Int?

    init(
        id: String,
        date: Date,
        weight: Double,
        bodyFatPercentage: Double? = nil,
        notes: String = "",
        coachFeedback: String? = nil,
        mood: Int? = nil,
        sleepHours: Double? = nil,
        waterIntake: Double? = nil,
        stressLevel: Int? = nil,
        energyLevel: Int? = nil,
        trainingPerformance: Int? = nil
    ) {
        self.id = id
        self.date = date
        self.weight = weight
        self.bodyFatPercentage = bodyFatPercentage
        self.notes = notes
        self.coachFeedback = coachFeedback
        self.mood = mood
        self.sleepHours = sleepHours
        self.waterIntake = waterIntake
        self.stressLevel = stressLevel
        self.energyLevel = energyLevel
        self.trainingPerformance = trainingPerformance
    }
}

struct Student: Identifiable, Hashable {
    let id: String
    var name: String
    var email: String
    var phone: String?
    var instagram: String?
    var avatarURL: URL?
    var age: Int
    var gender: Gender
    var height: Double
    var weight: Double
    var goalWeight: Double?
    var activityLevel: ActivityLevel
    var goal: FitnessGoal
    var notes: String
    var occupation: String?
    var medicalConditions: [String]
    var allergies: [String]
    var injuries: [String]
    var medications: [String]
    var bloodType: String?
    var bmr: Int
    var tdee: Int
    var bodyFatPercentage: Double?
    var adherenceScore: Int?
    var createdAt: Date
    var checkIns: [CheckIn]
    var nutritionPlan: NutritionPlan?
    var trainingPlan: TrainingPlan?

    static func == (lhs: Student, rhs: Student) -> Bool { lhs.id == rhs.id }

    func hash(into hasher: inout Hasher) { hasher.combine(id) }

    var lastCheckIn: CheckIn? { checkIns.last }

    var daysSinceLastCheckIn: Int? {
        guard let last = checkIns.last else { return nil }
        return Calendar.current.dateComponents([.day], from: last.date, to: Date()).day
    }

    /// Weight delta between first and last check-in, rounded to one decimal.
    var weightChange: Double? {
        guard checkIns.count >= 2, let first = checkIns.first, let last = checkIns.last else { return nil }
        return ((last.weight - first.weight) * 10).rounded() / 10
    }

    init(
        id: String,
        name: String,
        email: String,
        phone: String? = nil,
        instagram: String? = nil,
        avatarURL: URL? = nil,
        age: Int,
        gender: Gender,
        height: Double,
        weight: Double,
        goalWeight: Double? = nil,
        activityLevel: ActivityLevel,
        goal: FitnessGoal,
        notes: String = "",
        occupation: String? = nil,
        medicalConditions: [String] = [],
        allergies: [String] = [],
        injuries: [String] = [],
        medications: [String] = [],
        bloodType: String? = nil,
        bmr: Int,
        tdee: Int,
        bodyFatPercentage: Double? = nil,
        adherenceScore: Int? = nil,
        createdAt: Date,
        checkIns: [CheckIn] = [],
        nutritionPlan: NutritionPlan? = nil,
        trainingPlan: TrainingPlan? = nil
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.phone = phone
        self.instagram = instagram
        self.avatarURL = avatarURL
        self.age = age
        self.gender = gender
        self.height = height
        self.weight = weight
        self.goalWeight = goalWeight
        self.activityLevel = activityLevel
        self.goal = goal
        self.notes = notes
        self.occupation = occupation
        self.medicalConditions = medicalConditions
        self.allergies = allergies
        self.injuries = injuries
        self.medications = medications
        self.bloodType = bloodType
        self.bmr = bmr
        self.tdee = tdee
        self.bodyFatPercentage = bodyFatPercentage
        self.adherenceScore = adherenceScore
        self.createdAt = createdAt
        self.checkIns = checkIns
        self.nutritionPlan = nutritionPlan
        self.trainingPlan = trainingPlan
    }
}
