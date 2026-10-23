import { app } from "./app.js";
import { disconnectDatabase } from "./db.js";
import {
  closeSocketServer,
  setupWebSocketServer,
} from "./realtime/socket-server.js";

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`CampusFlow API: http://127.0.0.1:${port}`);
  setupWebSocketServer(server);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10_000).unref();
    closeSocketServer();
    server.close(async () => {
      await disconnectDatabase();
      clearTimeout(timeout);
      process.exit(0);
    });
  });
}
