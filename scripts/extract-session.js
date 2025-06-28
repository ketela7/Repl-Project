#!/usr/bin/env node
/**
 * Session Cookie Extractor for Real-time API Testing
 * Helps developers extract session cookies from browser for testing
 */

console.log('\n🍪 SESSION COOKIE EXTRACTOR')
console.log('='.repeat(50))
console.log('Untuk testing API real-time dengan user autentik:')
console.log('\n📋 LANGKAH-LANGKAH:')
console.log('1. Buka aplikasi di browser dan login dengan Google')
console.log('2. Buka Developer Tools (F12)')
console.log('3. Pergi ke tab Application/Storage > Cookies')
console.log('4. Cari cookie dengan nama "authjs.session-token"')
console.log('5. Copy nilai cookie tersebut')
console.log('6. Set sebagai environment variable:')
console.log('   export SESSION_COOKIE="authjs.session-token=YOUR_COOKIE_VALUE"')
console.log('\n⚡ TESTING COMMANDS:')
console.log('• Manual: node scripts/test-realtime-api.js "authjs.session-token=YOUR_COOKIE"')
console.log('• Auto: SESSION_COOKIE="authjs.session-token=YOUR_COOKIE" npm run test:realtime')
console.log('\n🔐 SECURITY:')
console.log('• Cookie berisi JWT token yang sensitive')
console.log('• Jangan commit cookie values ke repository')
console.log('• Cookie akan expire setelah beberapa jam')
console.log('\n📊 BENEFITS:')
console.log('• Test dengan data Drive user sesungguhnya')
console.log('• Validasi authentication flow end-to-end')
console.log('• Monitor API performance dengan load real')
console.log('• Debug issues dengan context user aktual')
console.log('='.repeat(50))

// Check if SESSION_COOKIE is already available
if (process.env.SESSION_COOKIE) {
  console.log('\n✅ SESSION_COOKIE sudah tersedia!')
  console.log('Jalankan: npm run test:realtime')
} else {
  console.log('\n⚠️ SESSION_COOKIE belum diset')
  console.log('Ikuti langkah di atas untuk extract cookie dari browser')
}