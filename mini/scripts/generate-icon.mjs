import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

// Generate a 144x144 PNG icon for WeChat Mini Program
// Black rounded square background with white ring progress + "Rx" text
function createPNG(size) {
  const bgR = 0, bgG = 0, bgB = 0 // black background
  const radius = Math.round(size * 0.19) // corner radius

  // Create raw pixel data (RGBA)
  const pixels = new Uint8Array(size * size * 4)

  const cx = size / 2
  const cy = size / 2

  // Step 1: Draw rounded rectangle background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      let inside = true

      if (x < radius && y < radius) {
        const dx = radius - x, dy = radius - y
        if (dx * dx + dy * dy > radius * radius) inside = false
      }
      if (x >= size - radius && y < radius) {
        const dx = x - (size - radius - 1), dy = radius - y
        if (dx * dx + dy * dy > radius * radius) inside = false
      }
      if (x < radius && y >= size - radius) {
        const dx = radius - x, dy = y - (size - radius - 1)
        if (dx * dx + dy * dy > radius * radius) inside = false
      }
      if (x >= size - radius && y >= size - radius) {
        const dx = x - (size - radius - 1), dy = y - (size - radius - 1)
        if (dx * dx + dy * dy > radius * radius) inside = false
      }

      if (inside) {
        pixels[i] = bgR
        pixels[i + 1] = bgG
        pixels[i + 2] = bgB
        pixels[i + 3] = 255
      }
    }
  }

  // Step 2: Draw ring progress (70% filled, white on dark bg)
  const ringR = Math.round(size * 0.3)
  const ringStroke = Math.round(size * 0.045)
  const ringCy = cy - Math.round(size * 0.03)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      if (pixels[i + 3] !== 255) continue // skip transparent

      const dx = x - cx
      const dy = y - ringCy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Ring band
      if (dist >= ringR - ringStroke && dist <= ringR + ringStroke) {
        const angle = Math.atan2(dy, dx)
        // Normalize angle to start from top (-PI/2)
        let normAngle = angle + Math.PI / 2
        if (normAngle < 0) normAngle += Math.PI * 2

        const progress = 0.7 // 70%
        const progressAngle = Math.PI * 2 * progress

        if (normAngle <= progressAngle) {
          // Progress part - white
          pixels[i] = 255
          pixels[i + 1] = 255
          pixels[i + 2] = 255
          pixels[i + 3] = 255
        } else {
          // Background part - dim white
          pixels[i] = 40
          pixels[i + 1] = 40
          pixels[i + 2] = 40
          pixels[i + 3] = 255
        }
      }
    }
  }

  // Step 3: Draw "Rx" text in center using a simple bitmap font
  // R character (7x9 pixel grid, scaled)
  const charR = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
  ]
  // x character (5x7 pixel grid)
  const charX = [
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
  ]

  const scale = Math.max(2, Math.round(size / 40))
  const textStartX = Math.round(cx - (11 * scale) / 2)
  const textStartY = Math.round(ringCy - (7 * scale) / 2)

  // Draw R
  drawChar(pixels, size, charR, textStartX, textStartY, scale, 255, 255, 255)
  // Draw x (smaller, slightly lower)
  const xScale = Math.max(2, Math.round(scale * 0.85))
  const xStartX = textStartX + 6 * scale
  const xStartY = textStartY + (7 * scale - 5 * xScale) // align bottom
  drawChar(pixels, size, charX, xStartX, xStartY, xScale, 255, 255, 255)

  // Encode as PNG
  const rawData = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    rawData[y * (size * 4 + 1)] = 0
    const srcOffset = y * size * 4
    const dstOffset = y * (size * 4 + 1) + 1
    for (let i = 0; i < size * 4; i++) {
      rawData[dstOffset + i] = pixels[srcOffset + i]
    }
  }

  const compressed = deflateSync(rawData)
  const chunks = []

  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  chunks.push(makeChunk('IHDR', ihdr))
  chunks.push(makeChunk('IDAT', compressed))
  chunks.push(makeChunk('IEND', Buffer.alloc(0)))

  return Buffer.concat(chunks)
}

function drawChar(pixels, size, charMap, startX, startY, scale, r, g, b) {
  for (let row = 0; row < charMap.length; row++) {
    for (let col = 0; col < charMap[row].length; col++) {
      if (!charMap[row][col]) continue
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = startX + col * scale + sx
          const py = startY + row * scale + sy
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const i = (py * size + px) * 4
            if (pixels[i + 3] === 255) { // only on opaque bg
              pixels[i] = r
              pixels[i + 1] = g
              pixels[i + 2] = b
            }
          }
        }
      }
    }
  }
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

const png = createPNG(144)
writeFileSync('icon-mini.png', png)
console.log(`Generated icon-mini.png (${png.length} bytes, 144x144)`)
