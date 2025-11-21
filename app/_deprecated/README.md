# Deprecated Features

This directory contains features that have been temporarily disabled.

## 📋 Currently Deprecated Features

### Avukat Akademi (Lawyer Academy)
- **Location**: `app/_deprecated/akademi/page.tsx`
- **Date Disabled**: 2024-11-21
- **Reason**: Feature temporarily disabled per user request
- **Status**: Complete and functional, just disabled

## 🔄 How to Re-enable a Feature

To re-enable a deprecated feature (e.g., Avukat Akademi):

1. **Move the file back**:
   ```bash
   # Move from deprecated to active
   mv app/_deprecated/akademi app/akademi
   ```

2. **Update middleware.ts**:
   ```typescript
   const protectedRoutes = [
     // ... existing routes
     '/akademi',  // Add this line
   ]
   ```

3. **Update sidebar navigation** (`app/dashboard/sidebar.tsx`):
   ```typescript
   const navigation = [
     // ... existing items
     {
       name: 'Avukat Akademi',
       href: '/akademi',
       icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
         </svg>
       ),
     },
   ]
   ```

4. **Test the feature**:
   ```bash
   npm run dev
   # Navigate to /akademi and verify it works
   ```

5. **Deploy**:
   ```bash
   git add .
   git commit -m "feat: Re-enable Avukat Akademi feature"
   git push origin main
   ```

## 📝 Notes

- All deprecated features are fully functional
- They are only hidden from the UI and routes
- No database changes are required to re-enable them
- The code is preserved exactly as it was when disabled

