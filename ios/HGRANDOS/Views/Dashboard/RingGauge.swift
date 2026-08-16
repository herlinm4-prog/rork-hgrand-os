import SwiftUI

/// Circular progress ring used by the Momentum / Capacidad gauges.
struct RingGauge: View {
    let size: CGFloat
    let stroke: CGFloat
    let progress: Double
    let color: Color
    let track: Color
    let label: String

    var body: some View {
        ZStack {
            Circle()
                .stroke(track, lineWidth: stroke)
            Circle()
                .trim(from: 0, to: max(0, min(1, progress)))
                .stroke(color, style: StrokeStyle(lineWidth: stroke, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.spring(duration: 0.8), value: progress)
            Text(label)
                .font(.system(size: 19, weight: .heavy))
                .monospacedDigit()
        }
        .frame(width: size, height: size)
    }
}
