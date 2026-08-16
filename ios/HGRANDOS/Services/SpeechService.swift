import AVFoundation
import Observation

/// Wraps AVSpeechSynthesizer so Sol can speak replies with the configured voice and pace.
@Observable
final class SpeechService {
    private let synthesizer = AVSpeechSynthesizer()

    var isSpeaking: Bool {
        synthesizer.isSpeaking
    }

    func speak(_ text: String, voice: VoiceOption, pace: SpeechPace) {
        stop()
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[SpeechService] audio session error: \(error.localizedDescription)")
        }
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: voice.languageCode)
        utterance.rate = pace.rate
        utterance.pitchMultiplier = voice.pitch
        synthesizer.speak(utterance)
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
    }
}
