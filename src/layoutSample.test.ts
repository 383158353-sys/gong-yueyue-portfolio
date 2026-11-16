import assert from 'node:assert/strict'
import { test } from 'node:test'
import { layoutSample } from './layoutSample.ts'

test('layout sample is a normal YouTube embed and does not claim playback', () => {
  const embed = new URL(layoutSample.embedUrl)
  assert.equal(embed.origin, 'https://www.youtube.com')
  assert.equal(embed.pathname, '/embed/M7lc1UVf-VE')
  assert.equal(embed.searchParams.get('autoplay'), '0')
  assert.equal(layoutSample.watchUrl, 'https://www.youtube.com/watch?v=M7lc1UVf-VE')
  assert.equal(layoutSample.label.includes('非本人作品'), true)
  assert.equal(layoutSample.note.includes('不判断'), true)
  assert.equal(layoutSample.note.includes('LFS'), false)
  assert.equal(layoutSample.note.includes('videoId'), false)
})
