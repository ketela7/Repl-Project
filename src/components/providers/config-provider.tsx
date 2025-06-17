"use client";

import { createContext, useContext, ReactNode } from "react";

interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  turnstileSiteKey: string;
  appEnv: string;
  baseUrl: string;
  isDevelopment: boolean;
  version: string;
}

const ConfigContext = createContext<Config | null>(null);

export function ConfigProvider({ 
  children, 
  config 
}: { 
  children: ReactNode; 
  config: Config;
}) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return config;
}