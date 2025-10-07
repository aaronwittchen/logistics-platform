import { BackofficeBackendApp } from './BackofficeBackendApp';
import { log } from '@/utils/log';

const app = new BackofficeBackendApp();

app.start().catch((error) => {
  log.err(`Failed to start backoffice API: ${error}`);
  process.exit(1);
});