import Foundation

enum ChatRole {
    case user
    case assistant
}

struct ChatMessage: Identifiable, Equatable {
    let id = UUID()
    let role: ChatRole
    var text: String
}
