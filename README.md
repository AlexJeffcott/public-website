# Alex Jeffcott - The SPA!

## Many things to do!

### Browser Client

- [ ] make code editor buttons look nicer
- [ ] ditch Monaco - maybe replace with Shiki?
- [x] add image gen ai page with dall-e-3
- [ ] add image editing ai page with dall-e-2
- [ ] add perplexity assistant page
- [ ] add text assistant page with claude or gpt
- [ ] add coding suggestions via claude or gpt to code page
- [ ] add audio transcription page
- [ ] add text-to-speech gen page
- [ ] add a journal page (model after bullet journal)
- [ ] add error handling to gen img form

```typescript
// see https://shiki.style/guide/bundles#fine-grained-bundle
// to make improvements
// be sure to specify the exact version
import { codeToHtml } from 'https://esm.sh/shiki@2.0'

const foo = document.getElementById('foo')
foo.innerHTML = await codeToHtml('console.log("Hi! Shiki on CDN :)")', {
  lang: 'js',
  theme: 'vitesse-light',
})
```

https://shiki.style/packages/twoslash#recipes

### Server

- [ ] nail down CSP
- [ ] only invalidate cache when content hash changes
- [ ] use my own esm cdn for my vendored dependencies

```typescript
// cached
c.header('Cache-Control', 'public, max-age=3600')

// not cached
c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
```

```typescript
c.header(
  'Content-Security-Policy',
  "default-src 'self'; " +
    "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com; " +
    "style-src 'self' https://cdn.jsdelivr.net;" +
    "font-src 'self' https://cdn.jsdelivr.net; " +
    "img-src 'self'; " +
    "connect-src 'self' https://unpkg.com; " +
    "manifest-src 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "worker-src 'self';",
)
```
