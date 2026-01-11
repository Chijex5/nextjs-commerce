# Authentication Systems - Complete Separation

## Overview

This application now has **TWO COMPLETELY SEPARATE** authentication systems:

1. **Admin Authentication** - For dashboard access
2. **User Authentication** - For customer accounts

## Admin Authentication (Using NextAuth.js)

### Endpoints
- `/api/auth/[...nextauth]` - NextAuth.js endpoints
- `/admin/login` - Admin login page

### Database
- Table: `AdminUser`
- Fields: id, email, passwordHash, role, isActive, etc.

### Technology
- NextAuth.js with credentials provider
- JWT sessions
- Role-based access control

### Usage
```typescript
// In admin pages
import { useSession } from "next-auth/react";
const { data: session } = useSession();
// session.user.role === "admin"
```

### Sign In Page
- `/admin/login` - Uses NextAuth signIn()
- Redirects to `/admin/dashboard` after login

## User Authentication (Custom JWT System)

### Endpoints
- `/api/user-auth/login` - Login endpoint
- `/api/user-auth/logout` - Logout endpoint
- `/api/user-auth/session` - Check session status
- `/api/user-auth/register` - Registration endpoint

### Database
- Table: `User`
- Fields: id, email, passwordHash, name, phone, isActive, etc.

### Technology
- Custom JWT tokens using Node.js crypto
- HTTP-only cookies (`user-session`)
- No NextAuth.js dependency

### Usage
```typescript
// In user-facing pages
import { useUserSession } from "hooks/useUserSession";
const { data: session, status, signOut } = useUserSession();
// session: { id, email, name }
```

### Sign In Page
- `/auth/login` - Uses custom fetch() to `/api/user-auth/login`
- Redirects to `/account` after login

## Key Differences

| Feature | Admin Auth | User Auth |
|---------|-----------|-----------|
| Library | NextAuth.js | Custom |
| Endpoint | `/api/auth/*` | `/api/user-auth/*` |
| Database Table | `AdminUser` | `User` |
| Cookie Name | `next-auth.session-token` | `user-session` |
| Hook | `useSession()` | `useUserSession()` |
| Login Page | `/admin/login` | `/auth/login` |
| Purpose | Dashboard access | Shopping accounts |

## Why Separate?

1. **No Conflicts**: NextAuth.js can only have one default endpoint per app
2. **Different Requirements**: Admin needs roles, users don't
3. **Simpler User Auth**: Users don't need full NextAuth features
4. **Better Security**: Complete isolation between admin and customer data

## File Structure

```
app/
├── admin/
│   └── login/              # Admin login (uses NextAuth)
└── auth/
    ├── login/              # User login (custom)
    └── register/           # User registration (custom)

app/api/
├── auth/
│   └── [...nextauth]/      # Admin NextAuth endpoints
└── user-auth/
    ├── login/              # User login endpoint
    ├── logout/             # User logout endpoint
    ├── session/            # User session check
    └── register/           # User registration endpoint

lib/
├── auth.ts                 # Admin NextAuth config
└── user-session.ts         # User session management

hooks/
└── useUserSession.ts       # React hook for user sessions
```

## Session Management

### Admin Sessions
- Managed by NextAuth.js
- Stored in `next-auth.session-token` cookie
- Checked with `getServerSession(authOptions)`

### User Sessions
- Managed by custom JWT system
- Stored in `user-session` cookie
- Checked with `getUserSession()`

## Protected Routes

### Admin Routes
```typescript
// Uses NextAuth
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

const session = await getServerSession(authOptions);
if (!session || session.user.role !== "admin") {
  redirect("/admin/login");
}
```

### User Routes
```typescript
// Uses custom session
import { getUserSession } from "lib/user-session";

const session = await getUserSession();
if (!session) {
  redirect("/auth/login");
}
```

## No Mixing!

❌ **NEVER do this:**
```typescript
// WRONG: Using NextAuth for user login
import { signIn } from "next-auth/react";
// This will check AdminUser table!
```

✅ **Always do this:**
```typescript
// CORRECT: Using custom auth for user login
const response = await fetch("/api/user-auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password })
});
```

## Testing

### Test Admin Auth
1. Go to `/admin/login`
2. Sign in with admin credentials
3. Should redirect to `/admin/dashboard`
4. Session stored in `next-auth.session-token`

### Test User Auth
1. Go to `/auth/login`
2. Sign in with user credentials
3. Should redirect to `/account`
4. Session stored in `user-session`

## Summary

- ✅ Admin auth uses NextAuth.js (unchanged)
- ✅ User auth uses custom JWT system (new)
- ✅ No mixing between the two systems
- ✅ Each has its own database table
- ✅ Each has its own endpoints
- ✅ Each has its own session management
- ✅ Complete separation and isolation
