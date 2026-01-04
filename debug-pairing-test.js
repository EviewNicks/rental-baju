// Debug test untuk pairing integration
const { parseKondisiAwalEnhanced } = require('./features/kasir/lib/utils/kondisiAwalParser.ts')

// Test data dari API response
const kondisiAwal1 = '{"productSizeId":"d5a4e0a1-2ca8-4a0d-a23b-3b27784d8a62","size":"XXL","ageCategory":"ADULT","condition":"baik","linkedSarung":{"productId":"de9a6c09-4952-4346-a4ae-a996715ab77f","productSizeId":"308fa829-76cf-4687-8678-98cbed9ff8b1","quantity":1,"selectedSize":{"id":"308fa829-76cf-4687-8678-98cbed9ff8b1","productId":"de9a6c09-4952-4346-a4ae-a996715ab77f","size":"UNIVERSAL","ageCategory":"ADULT","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-01-04T19:18:27.592Z","updatedAt":"2026-01-04T19:18:27.592Z"}}}'

const kondisiAwal2 = '{"productSizeId":"d5a4e0a1-2ca8-4a0d-a23b-3b27784d8a62","size":"XXL","ageCategory":"ADULT","condition":"baik","linkedSarung":{"productId":"c861ab71-27a8-4968-9472-64a3395ed78a","productSizeId":"b49b8e48-5578-40f5-a7bf-58b4047b3cc0","quantity":1,"selectedSize":{"id":"b49b8e48-5578-40f5-a7bf-58b4047b3cc0","productId":"c861ab71-27a8-4968-9472-64a3395ed78a","size":"UNIVERSAL","ageCategory":"ADULT","quantity":1,"availableQuantity":0,"rentedStock":0,"createdAt":"2026-01-04T19:18:27.025Z","updatedAt":"2026-01-04T19:18:27.025Z"}}}'

const kondisiAwal3 = '{"productSizeId":"e7ff3651-f9c5-435d-be0c-c51550e1f435","size":"UNIVERSAL","ageCategory":"UNIVERSAL","condition":"baik","linkedSarung":null}'

console.log('=== TESTING KONDISI AWAL PARSING ===')

console.log('\n1. Jas dengan Sarung SA06:')
const parsed1 = parseKondisiAwalEnhanced(kondisiAwal1)
console.log('- productSizeId:', parsed1.productSizeId)
console.log('- linkedSarung.productSizeId:', parsed1.linkedSarung?.productSizeId)
console.log('- hasPairing:', !!parsed1.linkedSarung?.productSizeId)

console.log('\n2. Jas dengan Sarung SA28:')
const parsed2 = parseKondisiAwalEnhanced(kondisiAwal2)
console.log('- productSizeId:', parsed2.productSizeId)
console.log('- linkedSarung.productSizeId:', parsed2.linkedSarung?.productSizeId)
console.log('- hasPairing:', !!parsed2.linkedSarung?.productSizeId)

console.log('\n3. Anting (no pairing):')
const parsed3 = parseKondisiAwalEnhanced(kondisiAwal3)
console.log('- productSizeId:', parsed3.productSizeId)
console.log('- linkedSarung.productSizeId:', parsed3.linkedSarung?.productSizeId)
console.log('- hasPairing:', !!parsed3.linkedSarung?.productSizeId)

console.log('\n=== EXPECTED DUAL RESTORATION ===')
console.log('Item 1 should restore:')
console.log('- Jas: d5a4e0a1-2ca8-4a0d-a23b-3b27784d8a62')
console.log('- Sarung: 308fa829-76cf-4687-8678-98cbed9ff8b1')

console.log('\nItem 2 should restore:')
console.log('- Jas: d5a4e0a1-2ca8-4a0d-a23b-3b27784d8a62')
console.log('- Sarung: b49b8e48-5578-40f5-a7bf-58b4047b3cc0')

console.log('\nItem 3 should restore:')
console.log('- Anting only: e7ff3651-f9c5-435d-be0c-c51550e1f435')