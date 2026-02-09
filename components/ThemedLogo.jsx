import {Image} from "react-native";
import { Colors } from "../contants/Colors";
import { useTheme } from "../context/ThemeContext";

import DarkLogo from "../assets/flowerDark.jpg";
import LightLogo from "../assets/flowerLight.jpg";


const ThemedLogo = ({ style, ...props }) => {
  const { theme } = useTheme();
  const logoSource = theme === Colors.dark ? DarkLogo : LightLogo;      
  console.log("Theme mode:", theme.mode, " - Using logo:", logoSource);
  
  return <Image source={logoSource} style={style} {...props} />;
};  

export default ThemedLogo;