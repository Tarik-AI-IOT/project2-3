import { View } from "react-native";

const Spacer = ({ height = 40, width = "100%"}) => {
  return (<View style={{ height, width }} />);
};

export default Spacer;