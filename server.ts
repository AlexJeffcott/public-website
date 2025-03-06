import { bundleWithWasm, configs } from 'jsr:@fairfox/deno-esbuild@0.0.21'
import { type Context, Hono } from 'jsr:@hono/hono'
import { serveStatic } from 'jsr:@hono/hono/deno'
import * as esbuild from 'https://deno.land/x/esbuild@v0.25.0/wasm.js'
import { contentType } from 'jsr:@std/media-types'
import { basename } from 'jsr:@std/path/unstable-basename'
import { extname } from 'jsr:@std/path/unstable-extname'

const app = new Hono()

// TODO: should I cache the esbuild wasm so I can reuse it between server runs?

async function makeBundle(): Promise<
  [() => Promise<void>, () => Promise<void>, () => Promise<esbuild.BuildResult>]
> {
  const cfg = await configs.forPreact(
    {
      entryPoints: ['./src/main.tsx', './src/workers/fs-worker.ts'],
      write: false,
    },
    'deno.json',
    'dev',
    'browser',
    '.env',
  )

  const [starter, stopper, bundler] = bundleWithWasm(
    cfg,
    esbuild.build,
    esbuild.stop,
    esbuild.initialize,
  )
  return [
    () => starter({ wasmURL: undefined, worker: false }),
    stopper,
    bundler,
  ]
}

const [starter, stopper, bundler] = await makeBundle()
await starter()
const result = await bundler()
await stopper()

result.errors.forEach(console.error)
result.warnings.forEach(console.warn)
if (result?.outputFiles === undefined) {
  throw new Error('result.outputFiles should be defined')
}

let scripts = ''
let styles = ''

const fileTypes = ['jpg', 'jpeg', 'png', 'woff2']

for (const out of result.outputFiles) {
  const fileName = basename(out.path) || 'undefined.js'
  const ext = extname(fileName)
  const path = `/${fileName}`

  app.get(path, () =>
    new Response(
      new File(
        !fileTypes.includes(ext || 'txt') ? [out.text] : [out.contents.buffer],
        fileName,
        { type: contentType(ext || 'txt') },
      ),
    ))

  if (ext === '.css') {
    styles = `${styles}\n<link rel="stylesheet" type="text/css" href="${path}">`
  } else if (ext === '.js' || ext === '.mjs') {
    if (!fileName.includes('worker.js')) {
      scripts = `${scripts}\n<script type="module" src="${path}"></script>`
    }
  }
}

app.use(
  '/static/*',
  serveStatic({
    root: './',
    onNotFound: (path, c) => {
      console.log(
        `${path} was not found when you tried to access ${c.req.path}`,
      )
    },
  }),
)

app.get('*', (c: Context) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate')

  return c.html(
    `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Alex Jeffcott</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png">
    ${styles}
    <link rel="manifest" href="/static/site.webmanifest">
  </head>
  <body>
    ${scripts}
  </body>
</html>`,
  )
})

Deno.serve({ port: 8000 }, app.fetch)
