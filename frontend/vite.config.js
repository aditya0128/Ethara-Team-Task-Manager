import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), ["VITE_", "REACT_APP_"]);
    return {
        plugins: [react()],
        envPrefix: ["VITE_", "REACT_APP_"],
        resolve: {
            alias: { "@": path.resolve(__dirname, "./src") },
        },
        server: {
            host: "0.0.0.0",
            port: 3000,
            strictPort: true,
            hmr: {
                clientPort: env.WDS_SOCKET_PORT ? Number(env.WDS_SOCKET_PORT) : undefined,
            },
            allowedHosts: true,
        },
        build: { outDir: "dist", sourcemap: false },
    };
});
