# Vercel Build Error Fixes

## Error: 'timeout' does not exist in type 'RequestInit'

### Problem:
The fetch API in Next.js/TypeScript doesn't support the `timeout` property directly in RequestInit.

### Solution:
Replaced `timeout` property with `AbortController` for proper timeout handling:

### Before (Causing Error):
```typescript
const imageResponse = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; E-LEAKxDOWN/1.0)',
  },
  timeout: 10000  // ❌ Not supported
})
```

### After (Fixed):
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000)

const imageResponse = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; E-LEAKxDOWN/1.0)',
  },
  signal: controller.signal  // ✅ Proper timeout handling
})

clearTimeout(timeoutId)
```

### Error Handling Updated:
```typescript
if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
  return NextResponse.json({ 
    error: 'Thumbnail download timeout. Please try again.' 
  }, { status: 408 })
}
```

## Next Steps:
1. Update your repository with the fixed thumbnail download route
2. Commit and push changes
3. Redeploy on Vercel
4. Build should now succeed without TypeScript errors

Your E-LEAKxDOWN app with unlimited downloads is now ready for successful Vercel deployment.