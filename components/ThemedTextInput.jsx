import { TextInput } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const ThemedTextInput = ({ style, ...props }) => {
  const { theme } = useTheme()
  return (
    <TextInput 
      style={[{ backgroundColor: theme.inputBackground, color: theme.text, padding: 20, borderRadius: 6 }, style]} 
      {...props} 
    />
  )
}

export default ThemedTextInput

