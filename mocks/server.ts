import express, { RequestHandler } from 'express';
import path from 'path';
import { json as bodyParserJson } from 'body-parser';
import cors from 'cors';
import { errorHandler } from './handlers/error';
import { auth } from './middlewares/auth';
import { proxy } from './middlewares/proxy';

const app = express();
const projectRoot = path.join(__dirname, '..');
const testTaskDir = path.join(__dirname, 'test-task');

app.get('/test-task/jschannel.js', (_req, res) => {
  res.sendFile(path.join(projectRoot, 'node_modules/jschannel/src/jschannel.js'));
});
app.use('/test-task', express.static(testTaskDir));

app.use(cors({ credentials: true, origin: 'http://localhost:4200' }));
app.use(bodyParserJson());
app.use(auth());

// The API mock handlers (and the `operation` middleware they rely on) depend on mocks/types/schema.ts,
// which is generated from the backend swagger spec (`npm run generate-types-from-swagger`) and not
// committed. Static features like the test task do not need it, so when the file is missing we only
// disable the API mocks (requests fall through to the proxy) instead of crashing the whole server.
try {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const { operation } = require('./middlewares/operation') as typeof import('./middlewares/operation');
  const handlers = require('./handlers') as Record<string, RequestHandler>;
  /* eslint-enable @typescript-eslint/no-var-requires */
  app.use(operation());
  Object.values(handlers).forEach(handler => app.use(handler));
} catch {
  // eslint-disable-next-line no-console
  console.warn(
    'API mocks disabled: mocks/types/schema.ts is missing. ' +
    'Run `npm run generate-types-from-swagger` if you need them. All /api requests are proxied to the dev backend.'
  );
}

app.use(proxy());
app.use(errorHandler());

const port = 3000;
// eslint-disable-next-line no-restricted-syntax,no-console
app.listen(port, () => console.info('Listening on port', port));
