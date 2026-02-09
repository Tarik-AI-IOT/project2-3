import { Pressable, StyleSheet } from 'react-native'
import { Colors } from '../contants/Colors'


function ThemedButton({ style, ...props}) {

  return (
    <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
        {...props}
      />
      
  )
}

        {/* <ThemedText style={{ color: Colors.white, textAlign: "center" }}>
          Login
        </ThemedText> */}


const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default ThemedButton