import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { CheckIn } from '@/types';

interface PhotoComparisonViewProps {
  colors: ThemeColors;
  checkIns: CheckIn[];
  onClose: () => void;
}

function PhotoComparisonViewComponent({ colors, checkIns, onClose }: PhotoComparisonViewProps) {
  const checkInsWithPhotos = checkIns.filter(c => c.photos && c.photos.length > 0);
  const [leftIdx, setLeftIdx] = useState<number>(Math.max(0, checkInsWithPhotos.length - 2));
  const [rightIdx, setRightIdx] = useState<number>(checkInsWithPhotos.length - 1);
  const [selectedPose, setSelectedPose] = useState<string>('front');

  if (checkInsWithPhotos.length < 2) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Comparar Fotos</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <X size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Se necesitan al menos 2 check-ins con fotos para comparar
          </Text>
        </View>
      </View>
    );
  }

  const leftCheckIn = checkInsWithPhotos[leftIdx];
  const rightCheckIn = checkInsWithPhotos[rightIdx];

  const getPhoto = (checkIn: CheckIn, pose: string) => {
    return checkIn.photos?.find(p => p.pose === pose) || checkIn.photos?.[0];
  };

  const leftPhoto = getPhoto(leftCheckIn, selectedPose);
  const rightPhoto = getPhoto(rightCheckIn, selectedPose);

  const poses = ['front', 'back', 'side_left', 'side_right'];
  const poseLabels: Record<string, string> = {
    front: 'Frontal',
    back: 'Espalda',
    side_left: 'Lateral Izq',
    side_right: 'Lateral Der',
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Comparar Fotos</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <X size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.poseBar}>
        {poses.map((pose) => (
          <TouchableOpacity
            key={pose}
            style={[
              styles.poseChip,
              { backgroundColor: selectedPose === pose ? colors.tint : colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedPose(pose)}
            activeOpacity={0.7}
          >
            <Text style={[styles.poseLabel, { color: selectedPose === pose ? '#fff' : colors.textSecondary }]}>
              {poseLabels[pose]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.comparisonRow}>
        <View style={styles.photoSide}>
          <View style={styles.weekSelector}>
            <TouchableOpacity
              onPress={() => setLeftIdx(Math.max(0, leftIdx - 1))}
              disabled={leftIdx === 0}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={leftIdx === 0 ? colors.textQuaternary : colors.text} />
            </TouchableOpacity>
            <Text style={[styles.weekLabel, { color: colors.text }]} numberOfLines={1}>
              {formatDate(leftCheckIn.date)}
            </Text>
            <TouchableOpacity
              onPress={() => setLeftIdx(Math.min(checkInsWithPhotos.length - 1, leftIdx + 1))}
              disabled={leftIdx >= rightIdx - 1}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color={leftIdx >= rightIdx - 1 ? colors.textQuaternary : colors.text} />
            </TouchableOpacity>
          </View>
          {leftPhoto ? (
            <Image source={{ uri: leftPhoto.uri }} style={[styles.photo, { backgroundColor: colors.card }]} resizeMode="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.card }]}>
              <ZoomIn size={24} color={colors.textMuted} />
              <Text style={[styles.noPhotoText, { color: colors.textMuted }]}>Sin foto</Text>
            </View>
          )}
          <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>{leftCheckIn.weight} kg</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.photoSide}>
          <View style={styles.weekSelector}>
            <TouchableOpacity
              onPress={() => setRightIdx(Math.max(leftIdx + 1, rightIdx - 1))}
              disabled={rightIdx <= leftIdx + 1}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={rightIdx <= leftIdx + 1 ? colors.textQuaternary : colors.text} />
            </TouchableOpacity>
            <Text style={[styles.weekLabel, { color: colors.text }]} numberOfLines={1}>
              {formatDate(rightCheckIn.date)}
            </Text>
            <TouchableOpacity
              onPress={() => setRightIdx(Math.min(checkInsWithPhotos.length - 1, rightIdx + 1))}
              disabled={rightIdx === checkInsWithPhotos.length - 1}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color={rightIdx === checkInsWithPhotos.length - 1 ? colors.textQuaternary : colors.text} />
            </TouchableOpacity>
          </View>
          {rightPhoto ? (
            <Image source={{ uri: rightPhoto.uri }} style={[styles.photo, { backgroundColor: colors.card }]} resizeMode="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.card }]}>
              <ZoomIn size={24} color={colors.textMuted} />
              <Text style={[styles.noPhotoText, { color: colors.textMuted }]}>Sin foto</Text>
            </View>
          )}
          <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>{rightCheckIn.weight} kg</Text>
        </View>
      </View>

      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cambio peso</Text>
          <Text style={[styles.statValue, {
            color: rightCheckIn.weight - leftCheckIn.weight > 0 ? colors.warning : colors.success,
          }]}>
            {(rightCheckIn.weight - leftCheckIn.weight) > 0 ? '+' : ''}{(rightCheckIn.weight - leftCheckIn.weight).toFixed(1)} kg
          </Text>
        </View>
        {leftCheckIn.bodyFatPercentage && rightCheckIn.bodyFatPercentage && (
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cambio BF%</Text>
            <Text style={[styles.statValue, {
              color: (rightCheckIn.bodyFatPercentage - leftCheckIn.bodyFatPercentage) > 0 ? colors.warning : colors.success,
            }]}>
              {(rightCheckIn.bodyFatPercentage - leftCheckIn.bodyFatPercentage) > 0 ? '+' : ''}
              {(rightCheckIn.bodyFatPercentage - leftCheckIn.bodyFatPercentage).toFixed(1)}%
            </Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Período</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round((new Date(rightCheckIn.date).getTime() - new Date(leftCheckIn.date).getTime()) / (7 * 24 * 60 * 60 * 1000))} sem
          </Text>
        </View>
      </View>
    </View>
  );
}

export const PhotoComparisonView = React.memo(PhotoComparisonViewComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  poseBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  poseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  poseLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  comparisonRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 2,
  },
  photoSide: {
    flex: 1,
    alignItems: 'center',
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    minWidth: 60,
    textAlign: 'center',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  noPhotoText: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    marginVertical: 30,
  },
  weightLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
