import Foundation

nonisolated struct AIMessage: Codable, Equatable {
    let role: String
    let content: String
}

nonisolated struct AIRequestBody: Codable {
    let messages: [AIMessage]
}

nonisolated struct AIResponseBody: Codable {
    let completion: String
}

nonisolated enum AIServiceError: LocalizedError {
    case invalidURL
    case badResponse

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL del servicio inválida."
        case .badResponse: return "El asistente no pudo responder. Inténtalo de nuevo."
        }
    }
}

/// Sends chat conversations to the Rork AI proxy and returns the assistant reply.
nonisolated struct AIService {
    static func send(messages: [AIMessage]) async throws -> String {
        let base = Config.EXPO_PUBLIC_TOOLKIT_URL.isEmpty ? "https://toolkit.rork.com" : Config.EXPO_PUBLIC_TOOLKIT_URL
        guard let url = URL(string: base + "/text/llm/") else {
            throw AIServiceError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(AIRequestBody(messages: messages))

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw AIServiceError.badResponse
        }
        let decoded = try JSONDecoder().decode(AIResponseBody.self, from: data)
        return decoded.completion
    }
}
