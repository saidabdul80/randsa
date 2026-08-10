import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

import { build } from 'esbuild'

const projectRoot = new URL('../', import.meta.url)

async function loadTypeScriptModule(relativePath) {
  const result = await build({
    bundle: true,
    entryPoints: [resolve(relativePath)],
    format: 'esm',
    logLevel: 'silent',
    platform: 'node',
    target: 'node22',
    write: false,
  })
  const source = result.outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const [{ sanitizeInternalRedirect }, routerSource] = await Promise.all([
  loadTypeScriptModule('src/utils/navigation.ts'),
  readFile(new URL('src/router/index.ts', projectRoot), 'utf8'),
])

test('accepts only same-app authentication return paths', () => {
  assert.equal(
    sanitizeInternalRedirect('/my-bookings?status=pending#latest'),
    '/my-bookings?status=pending#latest'
  )
  assert.equal(sanitizeInternalRedirect('//example.com/steal'), '/home')
  assert.equal(sanitizeInternalRedirect('https://example.com/steal'), '/home')
  assert.equal(sanitizeInternalRedirect('/\\example.com/steal'), '/home')
  assert.equal(sanitizeInternalRedirect('/home\n/next'), '/home')
  assert.equal(sanitizeInternalRedirect(undefined, '/login'), '/login')
})

test('guards write-sensitive and admin routes with active-account checks', () => {
  assert.match(routerSource, /path: '\/login'[\s\S]*?meta: \{ guestOnly: true \}/)
  assert.match(
    routerSource,
    /path: '\/post-listing'[\s\S]*?requiresAuth: true, requiresActiveAccount: true/
  )
  assert.match(
    routerSource,
    /path: '\/admin'[\s\S]*?requiresActiveAccount: true, requiresAdmin: true/
  )
  assert.match(routerSource, /notice: 'account-inactive'/)
  assert.doesNotMatch(routerSource, /requiresAgent/)
})
