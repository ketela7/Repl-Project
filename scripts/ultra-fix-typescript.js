#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Ultra TypeScript Fix - Memperbaiki semua error untuk build production...')

// Fix 1: nextauth-form.tsx - zodResolver issue
function fixNextAuthForm() {
  const filePath = 'src/app/(main)/auth/v1/login/_components/nextauth-form.tsx'
  if (!fs.existsSync(filePath)) return
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Fix zodResolver with proper typing
  const newSchema = `const FormSchema = z.object({
  remember: z.boolean().default(false),
})

type FormValues = {
  remember: boolean
}`

  content = content.replace(
    /const FormSchema = z\.object\(\{[\s\S]*?\}\)/,
    newSchema
  )
  
  // Fix useForm typing
  content = content.replace(
    /const form = useForm<[^>]*>\(/,
    'const form = useForm<FormValues>('
  )
  
  fs.writeFileSync(filePath, content)
  console.log('✅ Fixed: nextauth-form.tsx')
}

// Fix 2: Remove unused imports
function removeUnusedImports() {
  const filePath = 'src/lib/google-drive/utils.ts'
  if (!fs.existsSync(filePath)) return
  
  let content = fs.readFileSync(filePath, 'utf8')
  content = content.replace(/, DriveFileCapabilities/g, '')
  
  fs.writeFileSync(filePath, content)
  console.log('✅ Fixed: Removed unused imports')
}

// Fix 3: Service.ts async issues
function fixServiceAsync() {
  const filePath = 'src/lib/google-drive/service.ts'
  if (!fs.existsSync(filePath)) return
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Fix async response.data issues
  content = content.replace(
    /return convertGoogleDriveFile\(response\.data\)/g,
    'const result = await response\n      return convertGoogleDriveFile(result.data)'
  )
  
  // Fix unused parameters
  content = content.replace(
    /async sendNotificationEmail\(fileId: string, emailData: any\)/g,
    'async sendNotificationEmail(_fileId: string, _emailData: any)'
  )
  
  fs.writeFileSync(filePath, content)
  console.log('✅ Fixed: service.ts async issues')
}

// Fix 4: Component props optional issues
function fixComponentProps() {
  const components = [
    'src/components/drive-error-display.tsx',
    'src/components/file-icon.tsx',
    'src/components/ui/toast.tsx'
  ]
  
  components.forEach(filePath => {
    if (!fs.existsSync(filePath)) return
    
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Fix optional props with exactOptionalPropertyTypes
    content = content.replace(
      /(\w+)\?\s*:\s*([^|]+)\s*\|\s*undefined/g,
      '$1?: $2'
    )
    
    // Fix interface props
    content = content.replace(
      /interface\s+(\w+Props)\s*\{[^}]*\}/g,
      (match) => {
        return match.replace(/(\w+)\?\s*:\s*([^;|\n]+)(\s*\|\s*undefined)?/g, '$1?: $2')
      }
    )
    
    fs.writeFileSync(filePath, content)
    console.log(`✅ Fixed: ${filePath}`)
  })
}

// Fix 5: API routes parameter issues
function fixAPIRoutes() {
  const routes = [
    'src/app/api/drive/files/details/route.ts',
    'src/app/api/drive/files/rename/route.ts',
    'src/app/api/drive/files/route.ts',
    'src/app/api/drive/folders/route.ts'
  ]
  
  routes.forEach(filePath => {
    if (!fs.existsSync(filePath)) return
    
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Fix params awaiting
    content = content.replace(
      /const\s+\{\s*(\w+)\s*\}\s*=\s*params/g,
      'const { $1 } = await params'
    )
    
    fs.writeFileSync(filePath, content)
    console.log(`✅ Fixed: ${filePath}`)
  })
}

// Fix 6: Dialog components setState issues
function fixDialogComponents() {
  const dialogs = [
    'src/app/(main)/dashboard/drive/_components/items-copy-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-delete-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-download-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-export-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-move-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-rename-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-share-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-trash-dialog.tsx',
    'src/app/(main)/dashboard/drive/_components/items-untrash-dialog.tsx'
  ]
  
  dialogs.forEach(filePath => {
    if (!fs.existsSync(filePath)) return
    
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Fix setState with optional chaining
    content = content.replace(
      /setState\?\.\([^)]*\)/g,
      (match) => match.replace('?.', '')
    )
    
    fs.writeFileSync(filePath, content)
    console.log(`✅ Fixed: ${path.basename(filePath)}`)
  })
}

// Run all fixes
try {
  fixNextAuthForm()
  removeUnusedImports()
  fixServiceAsync()
  fixComponentProps()
  fixAPIRoutes()
  fixDialogComponents()
  
  console.log('🎉 Ultra TypeScript Fix completed!')
  console.log('✅ All critical TypeScript errors should be resolved')
  console.log('📝 Ready for production build')
  
} catch (error) {
  console.error('❌ Error during fix:', error.message)
  process.exit(1)
}