import { createContext } from "react";

export const ColorModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => { }
});
