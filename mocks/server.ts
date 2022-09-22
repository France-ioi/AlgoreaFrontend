import * as express from 'express';
import { json as bodyParserJson } from 'body-parser';
import * as cors from 'cors';
import * as handlers from './handlers';
import { errorHandler } from './handlers/error';
import { auth, operation, proxy } from './middlewares';

const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:4200' }));
app.use(bodyParserJson());
app.use(auth());
app.use(operation());

Object.values(handlers).forEach(handler => app.use(handler));

app.use(proxy());
app.use(errorHandler());

const port = 3000;
// eslint-disable-next-line no-restricted-syntax,no-console
app.listen(port, () => console.info('Listening on port', port));
