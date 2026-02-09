import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import ThemedView from "../../components/ThemedView"
import { useTheme } from "../../context/ThemeContext";
import ThemedText from '../../components/ThemedText';


const Home = () => {
    const { theme } = useTheme()
return (
    <ThemedView style={styles.container} safe={true}>
      <ThemedText style={styles.title}>
        Home Page
      </ThemedText>

      <Link href="/" style={[styles.link, { color: theme.primary }]}>
        <ThemedText>Back Home</ThemedText>
      </Link>
    </ThemedView>
  )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    link: {
        marginVertical: 10,
        borderBottomWidth: 1,
    }
})