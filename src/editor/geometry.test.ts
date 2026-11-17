import assert from 'node:assert/strict'
import { test } from 'node:test'
import { alignSelection, alignToCanvas, autoLayoutGrid, snapPosition, snapThresholdForScale } from './geometry.ts'

test('snap pulls a nearby edge and ignores a distant one', () => {
  const near = snapPosition(
    { id: 'a', x: 100, y: 40, width: 200, height: 100 },
    [
      { id: 'a', x: 100, y: 40, width: 200, height: 100 },
      { id: 'b', x: 104, y: 200, width: 80, height: 80 },
    ],
    1200,
    1600,
  )
  assert.equal(near.snapX, 104)
  assert.equal(near.guides.some((guide) => guide.type === 'v' && guide.x === 104), true)

  const far = snapPosition(
    { id: 'a', x: 300, y: 300, width: 100, height: 100 },
    [{ id: 'b', x: 10, y: 10, width: 40, height: 40 }],
    1200,
    1600,
  )
  assert.equal(far.snapX, null)
  assert.equal(far.snapY, null)
})

test('grid keeps text above images and equal image columns', () => {
  const layout = autoLayoutGrid(
    [
      { id: 't', type: 'text', x: 80, y: 40, width: 400, height: 50 },
      { id: 'wide', type: 'image', x: 10, y: 10, width: 400, height: 200 },
      { id: 'tall', type: 'image', x: 500, y: 10, width: 100, height: 300 },
    ],
    1200,
    2,
  )
  const text = layout.find((item) => item.id === 't')
  const wide = layout.find((item) => item.id === 'wide')
  const tall = layout.find((item) => item.id === 'tall')
  assert.ok(text && wide && tall)
  assert.equal(text.y < wide.y, true)
  assert.equal(wide.width, tall.width)
  assert.equal(wide.y, tall.y)
  assert.equal(wide.height, Math.round(wide.width * 0.5))
  assert.equal(tall.height, Math.round(tall.width * 3))
})

test('snap includes the threshold boundary and ignores one pixel beyond it', () => {
  const edge = snapPosition({ id: 'a', x: 6, y: 40, width: 100, height: 40 }, [], 1200, 1600, 6)
  assert.equal(edge.snapX, 0)
  const beyond = snapPosition({ id: 'a', x: 7, y: 40, width: 100, height: 40 }, [], 1200, 1600, 6)
  assert.equal(beyond.snapX, null)
  assert.equal(snapThresholdForScale(0.5) >= 18, true)
})

test('one element aligns to the canvas, several align to each other', () => {
  const alone = alignToCanvas({ id: 'a', x: 40, y: 20, width: 100, height: 50 }, 1200, 1600, 'left')
  assert.deepEqual(alone, { id: 'a', x: 0, y: 20 })
  const aligned = alignSelection(
    [
      { id: 'a', x: 10, y: 10, width: 40, height: 20 },
      { id: 'b', x: 80, y: 50, width: 30, height: 20 },
    ],
    'left',
  )
  assert.deepEqual(aligned.map((item) => item.x), [10, 10])
})
