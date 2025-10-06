import { InventoryBackendApp } from "./InventoryBackendApp";

const app = new InventoryBackendApp();

app
  .start()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Inventory backend started");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start inventory backend", err);
    process.exit(1);
  });


