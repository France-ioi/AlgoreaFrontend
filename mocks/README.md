## Installation

1. Packages should be installed along with the frontend. If not, run `npm ci` or `npm i`
2. Generate the types/schema.ts file from the open api specification of the backend: `npm run generate-types-from-swagger`

If the backend changes its version, update the npm script "generate-types-from-swagger"

## Launch app

1. Update environment and set `apiUrl: 'http://localhost:3000/api'`
2. To start the app and the mock server, run: `npm start`


## How it works

The mock acts as proxy between the frontend and the backend.
For a given route, if the mock has a mock to provide, it will return it. Otherwise, it will proxy the request to the backend.
