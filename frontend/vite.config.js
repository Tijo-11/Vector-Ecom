import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});

///////////##-------------------------------------------------
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     host: true, // Bind to 0.0.0.0 so ngrok can tunnel to it
//     allowedHosts: [".ngrok-free.app"], // Allows any *.ngrok-free.app subdomain (recommended for free ngrok, as subdomains change each time)

//     // Alternative options (uncomment one if you prefer):
//     // allowedHosts: ["894f9abfdc75.ngrok-free.app"], // Only this exact subdomain (good for one session)
//     // allowedHosts: "all", // Disable the host check entirely (convenient but less secure – fine for local dev only)
//   },
// });
