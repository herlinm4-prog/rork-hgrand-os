import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { TrendingDown, TrendingUp, Minus, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Student } from '@/types';
import { getWeightChange } from '@/utils/calculations';

interface StudentCardProps {
  student: Student;
  onPress: () => void;
}

export default React.memo(function StudentCard({ student, onPress }: StudentCardProps) {
  const { colors } = useTheme();
  const weightChange = getWeightChange(student.checkIns);
  const lastCheckIn = student.checkIns.length > 0 ? student.checkIns[student.checkIns.length - 1] : null;
  const daysSinceCheckIn = lastCheckIn
    ? Math.floor((Date.now() - new Date(lastCheckIn.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.6} testID={`student-card-${student.id}`}>
      <View style={styles.avatarWrap}>
        {student.avatar ? (
          <Image source={{ uri: student.avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.elevated }]}>
            <Text style={[styles.avatarText, { color: colors.gold }]}>{student.name.charAt(0)}</Text>
          </View>
        )}
        {daysSinceCheckIn !== null && daysSinceCheckIn <= 3 && (
          <View style={[styles.activeDot, { backgroundColor: colors.green, borderColor: colors.card }]} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{student.name}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {student.weight} kg
          </Text>
          {student.bodyFatPercentage && (
            <>
              <View style={[styles.metaDot, { backgroundColor: colors.textQuaternary }]} />
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {student.bodyFatPercentage}% bf
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {weightChange !== null && (
          <View style={styles.changeRow}>
            {weightChange < 0 ? (
              <TrendingDown size={12} color={colors.green} />
            ) : weightChange > 0 ? (
              <TrendingUp size={12} color={colors.orange} />
            ) : (
              <Minus size={12} color={colors.textMuted} />
            )}
            <Text
              style={[
                styles.changeText,
                { color: weightChange < 0 ? colors.green : weightChange > 0 ? colors.orange : colors.textMuted },
              ]}
            >
              {weightChange > 0 ? '+' : ''}{weightChange}
            </Text>
          </View>
        )}
        {daysSinceCheckIn !== null ? (
          <Text style={[styles.daysText, { color: colors.textMuted }, daysSinceCheckIn > 7 && { color: colors.orange }]}>
            {daysSinceCheckIn === 0 ? 'Today' : `${daysSinceCheckIn}d`}
          </Text>
        ) : (
          <Text style={[styles.newBadge, { color: colors.gold }]}>New</Text>
        )}
      </View>
      <ChevronRight size={14} color={colors.textQuaternary} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    position: 'relative' as const,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  activeDot: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  meta: {
    fontSize: 13,
  },
  right: {
    alignItems: 'flex-end' as const,
    gap: 3,
    marginRight: 4,
  },
  changeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 3,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  daysText: {
    fontSize: 12,
  },
  newBadge: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
