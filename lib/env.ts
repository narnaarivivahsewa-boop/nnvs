function getEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  DATABASE_URL: getEnv("DATABASE_URL"),

  NEXTAUTH_SECRET: getEnv("NEXTAUTH_SECRET"),

  NEXTAUTH_URL: getEnv("NEXTAUTH_URL"),

  NODE_ENV: process.env.NODE_ENV ?? "development",
};