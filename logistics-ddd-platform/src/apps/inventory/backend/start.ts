import { InventoryBackendApp } from "./InventoryBackendApp";
import { log } from "@/utils/log";

const app = new InventoryBackendApp();

app
  .start()
  .then(() => {
    log.ok("Inventory backend started");
  })
  .catch((err) => {
    log.err(`Failed to start inventory backend: ${err}`);
    process.exit(1);
  });