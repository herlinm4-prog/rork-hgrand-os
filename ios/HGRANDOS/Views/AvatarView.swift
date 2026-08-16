import SwiftUI

/// Circular remote avatar with a gold-letter fallback.
struct AvatarView: View {
    @Environment(\.colorScheme) private var scheme
    let url: URL?
    let name: String
    let size: CGFloat
    var tint: Color?

    private var theme: Theme { Theme.of(scheme) }

    var body: some View {
        Circle()
            .fill(theme.elevated)
            .frame(width: size, height: size)
            .overlay {
                if let url {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .allowsHitTesting(false)
                        } else {
                            initial
                        }
                    }
                } else {
                    initial
                }
            }
            .clipShape(.circle)
    }

    private var initial: some View {
        Text(String(name.prefix(1)))
            .font(.system(size: size * 0.4, weight: .bold))
            .foregroundStyle(tint ?? theme.gold)
    }
}
