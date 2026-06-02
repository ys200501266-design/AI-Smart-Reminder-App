import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputFieldProps extends TextInputProps {
  label: string;
}

export const InputField = ({ label, style, ...props }: InputFieldProps) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor="#94a3b8"
      style={[styles.input, style]}
      {...props}
    />
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
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 15,
  },
});
