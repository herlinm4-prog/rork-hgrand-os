import Foundation
import Observation

enum AppTab: Hashable {
    case dashboard
    case students
    case plans
    case assistant
    case settings
}

/// Central observable state for HGRAND OS — roster, tasks, notifications and preferences.
@Observable
final class AppStore {
    var students: [Student] = MockData.students
    var tasks: [CoachTask] = MockData.tasks
    var notifications: [HGNotification] = MockData.notifications
    var coachName: String = "Coach"
    var selectedTab: AppTab = .dashboard
    var appearance: AppearanceMode = .system
    var voice: VoiceOption = .sol
    var speechPace: SpeechPace = .natural

    // MARK: - Derived metrics

    var pendingTasks: [CoachTask] { tasks.filter { !$0.done } }
    var completedTasks: [CoachTask] { tasks.filter(\.done) }
    var unreadCount: Int { notifications.filter { !$0.read }.count }
    var activeStudents: Int { students.count }

    /// Estimated monthly recurring revenue at $75 per active client.
    var monthlyRevenue: Int { activeStudents * 75 }

    /// Roster utilisation against the ideal capacity of 30 clients.
    var capacity: Double { min(1, Double(students.count) / 30) }

    var momentum: Double {
        tasks.isEmpty ? 1 : Double(completedTasks.count) / Double(tasks.count)
    }

    var atRiskCount: Int { intel.filter { $0.severity == .critical }.count }

    func student(withId id: String) -> Student? {
        students.first { $0.id == id }
    }

    // MARK: - Coaching intelligence

    /// Alerts ranked by urgency — same heuristics as the HGRAND Command Center.
    var intel: [Intel] {
        var out: [Intel] = []
        for s in students {
            let adherence = s.adherenceScore ?? 75
            if s.checkIns.isEmpty {
                let daysSinceCreated = Calendar.current.dateComponents([.day], from: s.createdAt, to: Date()).day ?? 0
                out.append(Intel(
                    studentId: s.id,
                    studentName: s.name,
                    avatarURL: s.avatarURL,
                    severity: daysSinceCreated > 7 ? .critical : .warning,
                    title: "\(s.name) no ha enviado ningún check-in",
                    suggestion: "Envíale un recordatorio o agenda su primera evaluación.",
                    tag: "Sin check-in"
                ))
                continue
            }
            if let d = s.daysSinceLastCheckIn {
                if d > 10 {
                    out.append(Intel(studentId: s.id, studentName: s.name, avatarURL: s.avatarURL, severity: .critical, title: "\(s.name) lleva \(d) días sin check-in", suggestion: "Alto riesgo de abandono. Contáctalo hoy mismo.", tag: "Riesgo de fuga"))
                } else if d > 7 {
                    out.append(Intel(studentId: s.id, studentName: s.name, avatarURL: s.avatarURL, severity: .warning, title: "Check-in atrasado de \(s.name)", suggestion: "Recuérdale que registre su semana.", tag: "Atrasado"))
                }
            }
            if s.checkIns.count >= 3 {
                let last3 = s.checkIns.suffix(3).map(\.weight)
                if let first = last3.first, let last = last3.last, abs(last - first) < 0.5 {
                    out.append(Intel(studentId: s.id, studentName: s.name, avatarURL: s.avatarURL, severity: .warning, title: "\(s.name) está estancado hace 3 semanas", suggestion: "Ajusta calorías o varía el estímulo de entrenamiento.", tag: "Estancamiento"))
                }
            }
            if adherence < 60 {
                out.append(Intel(studentId: s.id, studentName: s.name, avatarURL: s.avatarURL, severity: .warning, title: "Adherencia baja de \(s.name) (\(adherence)%)", suggestion: "Simplifica su plan y refuerza la motivación.", tag: "Adherencia"))
            }
            if s.goal == .competition {
                out.append(Intel(studentId: s.id, studentName: s.name, avatarURL: s.avatarURL, severity: .info, title: "\(s.name) está en preparación de competición", suggestion: "Monitoreo diario recomendado en peak week.", tag: "Peak Week"))
            }
        }
        return out.sorted { $0.severity < $1.severity }
    }

    struct TodayCheckInEntry: Identifiable {
        let id: String
        let name: String
        let avatarURL: URL?
        let done: Bool
    }

    var todayCheckIns: [TodayCheckInEntry] {
        students.map { s in
            let doneToday = s.checkIns.contains { Calendar.current.isDateInToday($0.date) }
            return TodayCheckInEntry(id: s.id, name: s.name, avatarURL: s.avatarURL, done: doneToday)
        }
    }

    /// Best recent transformation to celebrate.
    var weeklyWin: (student: Student, metric: String)? {
        var best: (student: Student, delta: Double, metric: String)?
        for s in students {
            guard s.checkIns.count >= 2, let first = s.checkIns.first, let last = s.checkIns.last else { continue }
            let goalDown = s.goal.trendsDown
            let delta = last.weight - first.weight
            let improvement = goalDown ? -delta : delta
            guard improvement > 0 else { continue }
            if best == nil || improvement > best!.delta {
                let metric = String(format: "%.1f kg %@", improvement, goalDown ? "perdidos" : "ganados")
                best = (s, improvement, metric)
            }
        }
        guard let best else { return nil }
        return (best.student, best.metric)
    }

    // MARK: - Mutations

    func addStudent(_ student: Student) {
        students.append(student)
    }

    func toggleTask(_ id: UUID) {
        guard let index = tasks.firstIndex(where: { $0.id == id }) else { return }
        tasks[index].done.toggle()
    }

    func markAllNotificationsRead() {
        for index in notifications.indices {
            notifications[index].read = true
        }
    }
}

/// Katch-McArdle BMR from weight and body-fat percentage.
func calculateBMR(weightKg: Double, bodyFatPercentage: Double) -> Int {
    let leanMass = weightKg * (1 - bodyFatPercentage / 100)
    return Int((370 + 21.6 * leanMass).rounded())
}

func calculateTDEE(bmr: Int, activity: ActivityLevel) -> Int {
    Int((Double(bmr) * activity.multiplier).rounded())
}
