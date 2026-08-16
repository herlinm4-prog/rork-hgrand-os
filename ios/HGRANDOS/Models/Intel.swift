import Foundation

enum IntelSeverity: Int, Comparable {
    case critical = 0
    case warning = 1
    case info = 2

    static func < (lhs: IntelSeverity, rhs: IntelSeverity) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

/// A derived coaching insight surfaced on the Command Center.
struct Intel: Identifiable {
    var id: String { studentId + tag }
    let studentId: String
    let studentName: String
    let avatarURL: URL?
    let severity: IntelSeverity
    let title: String
    let suggestion: String
    let tag: String
}
