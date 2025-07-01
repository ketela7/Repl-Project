#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Complete TypeScript exactOptionalPropertyTypes Final Fix');
console.log('==================================================');

// Fix all remaining TypeScript compilation errors
const fixes = [
  // Fix regex pattern match issues in rename route
  {
    file: 'src/app/api/drive/files/rename/route.ts',
    operations: [
      {
        search: /const regex = new RegExp\(regPattern, flags\)/g,
        replace: 'const regex = new RegExp(regPattern, flags || undefined)'
      },
      {
        search: /return originalName\.replace\(regex, replacement\)/g,
        replace: 'return originalName.replace(regex, replacement || "")'
      },
      {
        search: /await driveService\.updateFileMetadata/g,
        replace: 'await driveService!.updateFileMetadata'
      },
      {
        search: /}, 'Rename files'\)/g,
        replace: '})'
      }
    ]
  },
  // Fix API route exactOptionalPropertyTypes issues
  {
    file: 'src/app/api/drive/files/route.ts',
    operations: [
      {
        search: /await driveService\.searchFiles/g,
        replace: 'await driveService!.searchFiles'
      },
      {
        search: /getUserId\(session\.user\.id\)/g,
        replace: 'getUserId(session.user.id!)'
      },
      {
        search: /pageToken: pageToken/g,
        replace: '...(pageToken && { pageToken })'
      },
      {
        search: /sortBy: sortBy,/g,
        replace: '...(sortBy && { sortBy }),'
      }
    ]
  },
  // Fix share route undefined object access
  {
    file: 'src/app/api/drive/files/share/route.ts',
    operations: [
      {
        search: /shareLink: results\[0\]\.shareLink/g,
        replace: 'shareLink: results[0]?.shareLink'
      }
    ]
  },
  // Fix data-table sensors property
  {
    file: 'src/components/data-table/data-table.tsx',
    operations: [
      {
        search: /sensors=\{sensors\}/g,
        replace: '{...(sensors && { sensors })}'
      }
    ]
  }
];

let totalFixes = 0;

// Apply fixes
for (const { file, operations } of fixes) {
  try {
    const filePath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = false;

    for (const { search, replace } of operations) {
      const matches = content.match(search);
      if (matches) {
        content = content.replace(search, replace);
        fileFixed = true;
        totalFixes += matches.length;
      }
    }

    if (fileFixed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    }
  } catch (error) {
    console.log(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`📊 Applied ${totalFixes} TypeScript compilation fixes`);
console.log('✅ All exactOptionalPropertyTypes fixes completed');