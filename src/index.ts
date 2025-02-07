import { server } from './server.js';
import { logger } from './util.js';

const port = 8_080;
server.listen(port, () => logger.info({ port }, 'server started'));
