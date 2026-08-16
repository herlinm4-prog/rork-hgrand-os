import Foundation

struct CoachTask: Identifiable {
    let id = UUID()
    var title: String
    var detail: String
    var done: Bool
}

struct HGNotification: Identifiable {
    let id = UUID()
    var title: String
    var body: String
    var read: Bool
    var date: Date
}
