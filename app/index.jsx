import { Redirect } from "expo-router";
import { useUser } from "../hooks/useUser";

const Index = () => {
  const { user, role, loading } = useUser();

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;
  if (role === "trainer" || role === "admin") return <Redirect href="/(admin)/clients" />;
  return <Redirect href="/(dashboard)/home" />;
};

export default Index;

