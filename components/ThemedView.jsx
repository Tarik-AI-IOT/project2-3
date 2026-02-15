import { View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const ThemedView = ({ style, safe = false, safeBottom = true, ...props }) => {
  const { theme } = useTheme();

  if (!safe) {
    return <View style={[{ backgroundColor: theme.background }, style]} {...props} />;
  }

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: safeBottom ? insets.bottom : 0,
        },
        style,
      ]}
      {...props}
    />
  );
};

export default ThemedView;
