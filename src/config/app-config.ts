import packageJson from "../../package.json";

/**
 * Application configuration constants
 * Centralized configuration for the Google Drive Management Application
 */
export const APP_CONFIG = {
  name: "Professional Google Drive Management",
  version: packageJson.version,
  meta: {
    title: "Professional Google Drive Management - Enterprise File Management Solution",
    description:
      "A professional Google Drive management solution built with Next.js, providing enterprise-grade file operations and intuitive user interactions for efficient document management. Features include bulk operations, file preview, advanced search, and secure authentication.",
  },
};
