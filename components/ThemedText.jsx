import { View, Text } from 'react-native'
import { Colors } from '../contants/Colors'
import { useTheme } from '../context/ThemeContext'


const ThemedText = ({style, title = false, children,...props}) => {
    const { theme } = useTheme();
  return (
      <Text style={[{ color: theme.text }, title && { fontSize: 18, fontWeight: "bold" },style]} {...props}>
        {children}
      </Text>
  )
}

export default ThemedText