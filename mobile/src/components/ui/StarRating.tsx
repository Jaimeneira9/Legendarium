import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  rating: number | null;
  onChange: (rating: number) => void;
  size?: number;
}

export const StarRating: React.FC<Props> = ({ rating, onChange, size = 32 }) => {
  const { t } = useTheme();

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const isFull = (rating || 0) >= starValue;
    const isHalf = (rating || 0) >= starValue - 0.5 && (rating || 0) < starValue;

    return (
      <View key={index} style={[styles.starContainer, { width: size, height: size }]}>
        {/* Background Empty Star */}
        <Text style={[styles.starBase, { fontSize: size, color: t.ringStrong }]}>★</Text>
        
        {/* Full/Half Color Overlay */}
        {(isFull || isHalf) && (
          <View style={[
            styles.starOverlay, 
            { width: isHalf ? '50%' : '100%', overflow: 'hidden' }
          ]}>
            <Text style={[styles.starActive, { fontSize: size, color: t.accent, width: size }]}>★</Text>
          </View>
        )}

        {/* Touchable areas for half increments */}
        <View style={styles.touchOverlay}>
          <TouchableOpacity 
            style={styles.halfTouch} 
            onPress={() => onChange(starValue - 0.5)}
          />
          <TouchableOpacity 
            style={styles.halfTouch} 
            onPress={() => onChange(starValue)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map(renderStar)}
      {rating !== null && (
        <TouchableOpacity onPress={() => onChange(0)} style={styles.clearBtn}>
           <Text style={[styles.clearText, { color: t.muted }]}>Borrar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starBase: {
    position: 'absolute',
  },
  starOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
  },
  starActive: {
    position: 'absolute',
    left: 0,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  halfTouch: {
    flex: 1,
  },
  clearBtn: {
    marginLeft: 12,
    padding: 4,
  },
  clearText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});
