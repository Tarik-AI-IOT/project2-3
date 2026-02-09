import { View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";


const ThemedView = ({ style, safe=false, ...props }) => {
  const { theme } = useTheme();

  if (!safe) return (
    <View 
     style={[{ backgroundColor: theme.background }, style]} 
     {...props} 
   />
  )

  const insets = useSafeAreaInsets();

  return (
    <View 
     style={[{ 
      backgroundColor: theme.background, 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom,
    },
      style
    ]} 
     {...props} 
   />
  )
};

export default ThemedView;
