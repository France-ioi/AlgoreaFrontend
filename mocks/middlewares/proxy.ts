import * as https from 'https';
import { RequestHandler } from 'express';

export const proxy = (): RequestHandler => (req, res, next): void => {
  if (res.headersSent) return next();

  const url = new URL(req.url, 'https://dev.algorea.org/');
  const hasBody = Object.values(req.body).length > 0;
  const body = hasBody ? JSON.stringify(req.body) : null;
  const forwardResponse = (
    data: any,
    headers: Record<string, string | string[] | number | undefined>,
    status?: number,
  ): void => {
    Object.entries(headers).forEach(([ name, value ]) => {
      if (value !== undefined) res.setHeader(name, value);
    });
    if (status) res.status(status);
    res.send(data);
    next();
  };

  // Do not forward headers "host" and "accept-encoding", otherwise it triggers a request error.
  // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
  const { host: _host, 'accept-encoding': _acceptEncoding, ...headers } = req.headers;
  const options: https.RequestOptions = {
    method: req.method,
    headers: {
      ...headers,
      /* eslint-disable @typescript-eslint/naming-convention */
      ...(body && {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      }),
      /* eslint-enable @typescript-eslint/naming-convention */
    }
  };

  const proxyRequest = https.request(url.href, options, proxyResponse => {
    let proxyResponseData = '';

    proxyResponse.on('data', chunk => (proxyResponseData += chunk));
    proxyResponse.on('end', () => forwardResponse(proxyResponseData, proxyResponse.headers, proxyResponse.statusCode));
    proxyResponse.on('error', error => {
      // eslint-disable-next-line no-console
      console.error(error);
      forwardResponse(proxyResponseData, proxyResponse.headers, proxyResponse.statusCode);
    });
  });

  if (body) proxyRequest.write(body);
  proxyRequest.end();
};
