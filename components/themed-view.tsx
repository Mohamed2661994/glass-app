import { View, Text, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  children,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return (
    <View style={[{ backgroundColor }, style]} {...otherProps}>
      {React.Children.map(children, child => {
        if (typeof child === 'string') {
          return <Text>{child}</Text>; // 👈 يحل المشكلة جذريًا
        }
        return child;
      })}
    </View>
  );
}
