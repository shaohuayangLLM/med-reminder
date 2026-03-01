import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

// Generate a minimal PNG with a solid green (#059669) rounded rectangle
function createPNG(size) {
  const r = 5, g = 150, b = 105 // #059669
  const radius = Math.round(size * 0.19)

  // Create raw pixel data (RGBA)
  const pixels = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4

      // Check if point is inside rounded rectangle
      let inside = true
      // Top-left corner
      if (x < radius && y < radius) {
        const dx = radius - x, dy = radius - y
        if (dx * dx + dy * dy > radius * radius) inside = false
      }
      // Top-right corner
      if (x >= size - radius && y < radius) {
        const dx = x - (size - radius - 1), dy = radius - y
        if (dx * dx + dy * dy > radius * radius) inside = false
      }
      // Bottom-left corner
      if (x < radius && y >= size - radius) {
        const dx = radius - x, dy = y - (size - radius - 1)
        if (dx * dx + dy * dy > radius * radius) inside = false
      }
      // Bottom-right corner
      if (x >= size - radius && y >= size - radius) {
        const dx = x - (size - radius - 1), dy = y - (size - radius - 1)
        if (dx * dx + dy * dy > radius * radius) inside = false
      }

      if (inside) {
        pixels[i] = r
        pixels[i + 1] = g
        pixels[i + 2] = b
        pixels[i + 3] = 255
      } else {
        pixels[i] = 0
        pixels[i + 1] = 0
        pixels[i + 2] = 0
        pixels[i + 3] = 0
      }
    }
  }

  // Draw a simple pill/capsule shape in white at center
  const cx = size / 2
  const cy = size / 2
  const pillW = Math.round(size * 0.22)
  const pillH = Math.round(size * 0.52)
  const pillRadius = pillW

  // Draw a rotated capsule (tilted ~30 degrees)
  const angle = -Math.PI / 6 // -30 degrees
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Transform to pill-local coords (rotated)
      const dx = x - cx
      const dy = y - cy
      const lx = dx * cosA + dy * sinA
      const ly = -dx * sinA + dy * cosA

      // Check if inside capsule shape
      let inPill = false

      // Main body rectangle
      if (Math.abs(lx) <= pillW && Math.abs(ly) <= pillH - pillRadius) {
        inPill = true
      }
      // Top semicircle
      if (Math.abs(ly + (pillH - pillRadius)) < 0.01 || ly < -(pillH - pillRadius)) {
        const cdx = lx
        const cdy = ly + (pillH - pillRadius)
        if (cdx * cdx + cdy * cdy <= pillRadius * pillRadius) {
          inPill = true
        }
      }
      // Bottom semicircle
      if (Math.abs(ly - (pillH - pillRadius)) < 0.01 || ly > (pillH - pillRadius)) {
        const cdx = lx
        const cdy = ly - (pillH - pillRadius)
        if (cdx * cdx + cdy * cdy <= pillRadius * pillRadius) {
          inPill = true
        }
      }

      if (inPill) {
        const i = (y * size + x) * 4
        // Only draw on green area
        if (pixels[i + 3] === 255) {
          // Top half lighter, bottom half slightly darker to show two-tone pill
          if (ly < 0) {
            pixels[i] = 255
            pixels[i + 1] = 255
            pixels[i + 2] = 255
            pixels[i + 3] = 255
          } else {
            pixels[i] = 220
            pixels[i + 1] = 235
            pixels[i + 2] = 225
            pixels[i + 3] = 255
          }
        }
      }
    }
  }

  // Draw dividing line across the middle of the pill
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const lx = dx * cosA + dy * sinA
      const ly = -dx * sinA + dy * cosA

      // Thin line at ly=0, within pill width
      if (Math.abs(ly) <= 1.5 && Math.abs(lx) <= pillW) {
        const i = (y * size + x) * 4
        if (pixels[i + 3] === 255 && (pixels[i] > 200)) {
          pixels[i] = 180
          pixels[i + 1] = 190
          pixels[i + 2] = 185
          pixels[i + 3] = 255
        }
      }
    }
  }

  // Encode as PNG
  // Filter: None (0) for each row
  const rawData = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    rawData[y * (size * 4 + 1)] = 0 // filter byte
    const srcOffset = y * size * 4
    const dstOffset = y * (size * 4 + 1) + 1
    for (let i = 0; i < size * 4; i++) {
      rawData[dstOffset + i] = pixels[srcOffset + i]
    }
  }

  const compressed = deflateSync(rawData)

  // Build PNG file
  const chunks = []

  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  chunks.push(makeChunk('IHDR', ihdr))

  // IDAT
  chunks.push(makeChunk('IDAT', compressed))

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0)))

  return Buffer.concat(chunks)
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)

  const typeBytes = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBytes, data])

  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcData), 0)

  return Buffer.concat([len, typeBytes, data, crc])
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320
      } else {
        crc = crc >>> 1
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

console.log('Generating 512x512 icon...')
const png512 = createPNG(512)
writeFileSync('public/icon-512.png', png512)
console.log(`  Written public/icon-512.png (${png512.length} bytes)`)

console.log('Generating 192x192 icon...')
const png192 = createPNG(192)
writeFileSync('public/icon-192.png', png192)
console.log(`  Written public/icon-192.png (${png192.length} bytes)`)

console.log('Done!')
