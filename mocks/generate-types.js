#!/usr/bin/env node
/* eslint-disable */
const cp = require('child_process');

require('yargs')
  .scriptName("generate-types")
  .usage('$0 [args]')
  .command('from-swagger', 'Generates type from swagger', (yargs) => {
    yargs.positional('apiVersion', {
      type: 'string',
      describe: 'ie: v1.2.0',
    })
  }, function (argv) {
    if (!argv.apiVersion) throw new Error('apiVersion is required')
    const exe = (cmd) => cp.execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
    console.info('Generate typings from remote swagger file...')
    exe(`npx openapi-typescript https://franceioi-algorea.s3.eu-west-3.amazonaws.com/spec/swagger-${argv.apiVersion}.yaml --output mocks/types/schema.ts`)
    console.info('Disable ESLint on generated file...')
    exe('{ echo \"/* eslint-disable */\"; cat mocks/types/schema.ts; } > mocks/types/schema.tmp.ts && mv mocks/types/schema.tmp.ts mocks/types/schema.ts')
    console.info('ESLint disabled ✅')
  })
  .help()
  .argv;
