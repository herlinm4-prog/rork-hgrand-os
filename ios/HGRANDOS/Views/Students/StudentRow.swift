import SwiftUI

/// Compact roster row — avatar, weight metadata and trend, mirroring the HGRAND client card.
struct StudentRow: View {
    @Environment(\.colorScheme) private var scheme
    let student: Student

    private var theme: Theme { Theme.of(scheme) }

    var body: some View {
        HStack(spacing: 14) {
            AvatarView(url: student.avatarURL, name: student.name, size: 46)
                .overlay(alignment: .bottomTrailing) {
                    if let days = student.daysSinceLastCheckIn, days <= 3 {
                        Circle()
                            .fill(theme.green)
                            .strokeBorder(theme.card, lineWidth: 2.5)
                            .frame(width: 12, height: 12)
                    }
                }

            VStack(alignment: .leading, spacing: 3) {
                Text(student.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(theme.text)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text("\(student.weight.formatted()) kg")
                        .font(.system(size: 13))
                        .foregroundStyle(theme.textMuted)
                    if let bf = student.bodyFatPercentage {
                        Circle()
                            .fill(theme.textQuaternary)
                            .frame(width: 3, height: 3)
                        Text("\(bf.formatted())% bf")
                            .font(.system(size: 13))
                            .foregroundStyle(theme.textMuted)
                    }
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                if let change = student.weightChange {
                    HStack(spacing: 3) {
                        Image(systemName: change < 0 ? "arrow.down.right" : change > 0 ? "arrow.up.right" : "minus")
                            .font(.system(size: 10, weight: .bold))
                        Text("\(change > 0 ? "+" : "")\(change.formatted())")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(change < 0 ? theme.green : change > 0 ? theme.orange : theme.textMuted)
                }
                if let days = student.daysSinceLastCheckIn {
                    Text(days == 0 ? "Hoy" : "\(days)d")
                        .font(.system(size: 12))
                        .foregroundStyle(days > 7 ? theme.orange : theme.textMuted)
                } else {
                    Text("Nuevo")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(theme.gold)
                }
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(theme.textQuaternary)
        }
        .padding(.vertical, 4)
    }
}
