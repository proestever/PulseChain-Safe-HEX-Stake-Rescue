import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { useColorMode } from "./ThemeContext";
import App from "./App";

export default function AppWithRainbow() {
  const { mode } = useColorMode();

  const rkTheme = mode === 'dark'
    ? darkTheme({ accentColor: '#ffffff', accentColorForeground: '#0a0a0f', borderRadius: 'medium' })
    : lightTheme({ accentColor: '#1a1a2e', accentColorForeground: '#ffffff', borderRadius: 'medium' });

  return (
    <RainbowKitProvider theme={rkTheme}>
      <App />
    </RainbowKitProvider>
  );
}
