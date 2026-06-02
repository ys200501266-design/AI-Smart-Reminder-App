import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface SegmentControlProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export const SegmentControl = <T extends string,>({
  label,
  value,
  options,
  onChange,
}: SegmentControlProps<T>) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selectedOption]}
          >
            <Text style={[styles.optionText, selected && styles.selectedText]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  track: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#e8eef7',
    padding: 4,
  },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  selectedOption: {
    backgroundColor: '#2563eb',
  },
  optionText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedText: {
    color: '#ffffff',
  },
});
