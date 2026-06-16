# Social Account Management Implementation

## Overview
Complete implementation of Social Account Management APIs for creators to add, view, update, and delete their social media accounts (Instagram, YouTube, TikTok, Twitter, Other).

## Implementation Details

### 1. Type Definitions (`types/socialAccount.ts`)
Updated and extended the social account types to match the API specification:

- **SocialPlatform**: `"TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "TWITTER" | "OTHER"`
- **SocialAccount**: Complete interface matching API response
  - `id`, `creator_id`, `platform`, `platform_user_id`, `username`, `is_verified`, `created_at`
- **SocialAccountCreateRequest**: For adding new accounts
- **SocialAccountUpdateRequest**: For updating existing accounts

### 2. Query Hooks (`queries/socialAccounts.ts`)
Created React Query hooks for all CRUD operations:

- **`useMySocialAccounts(accessToken, options?)`**: Fetch all social accounts with optional platform filter
- **`useSocialAccount(accessToken, accountId)`**: Fetch a specific account by ID
- **`useAddSocialAccount(accessToken)`**: Mutation to add a new social account
- **`useUpdateSocialAccount(accessToken, accountId)`**: Mutation to update an existing account
- **`useDeleteSocialAccount(accessToken)`**: Mutation to delete an account

All mutations automatically invalidate the social accounts query cache for real-time UI updates.

### 3. Account Management Page (`app/(dashboard)/dashboard/account/page.tsx`)
Complete UI for managing social accounts:

**Features:**
- **List View**: Grid layout displaying all connected social accounts
  - Platform icons (Instagram, YouTube)
  - Username and platform display
  - Verified badge for OAuth-verified accounts
  - Edit and Delete actions per account
- **Add Account Dialog**: Form to add new social accounts
  - Platform selection (Instagram, YouTube, TikTok, Twitter, Other)
  - Username input (without @ symbol)
  - Optional platform user ID field
  - Form validation using Zod schema
- **Edit Account Dialog**: Update existing account details
  - Pre-filled form with current values
  - Platform cannot be changed after creation
  - Update username and platform user ID
- **Delete Confirmation**: Confirmation dialog before deletion
- **Loading States**: Circular progress indicator while fetching
- **Empty State**: Helpful message and CTA when no accounts exist
- **Error Handling**: Alert messages for API errors

**Design:**
- Consistent with dashboard design system
- Card-based layout with hover effects
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)
- Professional typography and spacing
- Dark theme compatible

### 4. Submission Form Integration (`components/SubmissionForm.tsx`)
Updated to use real social accounts:

**Changes:**
- Removed `socialAccounts` prop dependency
- Now fetches social accounts using `useMySocialAccounts` hook
- Improved empty state with direct link to account management page
- Better UX: Users can add accounts directly from the submission form

**Features:**
- Dropdown populated with user's social accounts
- Displays username and platform for each account
- Shows helpful message if no accounts exist with link to add accounts

### 5. Navigation Integration
The account management page is already accessible via:
- Top navigation: "Account" link in creator dashboard
- Direct link from submission form when no accounts exist

## API Integration

### Endpoints Used:
1. `POST /creator/social/accounts` - Add social account
2. `GET /creator/social/accounts` - Get all accounts (with optional `?platform=` filter)
3. `GET /creator/social/accounts/{account_id}` - Get specific account
4. `PUT /creator/social/accounts/{account_id}` - Update account
5. `DELETE /creator/social/accounts/{account_id}` - Delete account

### Request/Response Format:
All requests use Bearer token authentication via API client interceptors.

**Add Account Request:**
```json
{
  "platform": "INSTAGRAM",
  "username": "creator_username",
  "platform_user_id": "optional_user_id"
}
```

**Response:**
```json
{
  "id": "uuid",
  "creator_id": "uuid",
  "platform": "INSTAGRAM",
  "platform_user_id": "creator_username",
  "username": "creator_username",
  "is_verified": false,
  "created_at": "2026-02-18T10:30:00Z"
}
```

## User Flow

### Adding a Social Account:
1. Navigate to `/dashboard/account` or click "Add Account" from submission form
2. Click "Add Account" button
3. Select platform (Instagram, YouTube, etc.)
4. Enter username (without @ symbol)
5. Optionally enter platform user ID
6. Click "Add" to save
7. Account appears in the list immediately

### Editing an Account:
1. Click edit icon on any account card
2. Update username or platform user ID
3. Click "Update" to save changes

### Deleting an Account:
1. Click delete icon on any account card
2. Confirm deletion in dialog
3. Account is removed from list

### Using Accounts in Submissions:
1. When submitting content, select from dropdown of connected accounts
2. If no accounts exist, see helpful message with link to add accounts
3. Accounts are automatically fetched and cached

## Error Handling

- **400 Bad Request**: Invalid username format or duplicate account
- **403 Forbidden**: User is not a creator
- **404 Not Found**: Account not found (for update/delete)
- All errors displayed as user-friendly alert messages

## Design Consistency

- Matches existing dashboard design system
- Uses MUI components with custom theme
- Consistent spacing, typography, and colors
- Responsive across all screen sizes
- Dark theme compatible
- Smooth transitions and hover effects

## Testing Checklist

- [x] Add social account (Instagram)
- [x] Add social account (YouTube)
- [x] View list of accounts
- [x] Edit account username
- [x] Delete account
- [x] Filter accounts by platform (if needed)
- [x] Use accounts in submission form
- [x] Handle empty state
- [x] Handle API errors
- [x] Verify navigation links work
- [x] Build passes without errors

## Future Enhancements

1. **OAuth Integration**: Implement OAuth 2.0 for automatic verification
   - See `SOCIAL_ACCOUNT_CONNECTION.md` for implementation guide
   - Will automatically set `is_verified: true`
   - Can fetch view counts and engagement metrics

2. **Platform-Specific Validation**: 
   - Instagram username format validation
   - YouTube channel ID validation
   - TikTok handle validation

3. **Account Verification Status**:
   - Visual indicator for verified vs manual accounts
   - Warning when using unverified accounts for submissions

4. **Bulk Operations**:
   - Add multiple accounts at once
   - Import from CSV

5. **Account Analytics**:
   - Display follower counts
   - Show engagement metrics
   - Link to platform profiles

## Files Modified/Created

### Created:
- `queries/socialAccounts.ts` - Query hooks for social accounts
- `app/(dashboard)/dashboard/account/page.tsx` - Account management page
- `SOCIAL_ACCOUNT_IMPLEMENTATION.md` - This documentation

### Modified:
- `types/socialAccount.ts` - Updated types to match API
- `components/SubmissionForm.tsx` - Integrated real social accounts
- `app/(dashboard)/dashboard/explore/[id]/page.tsx` - Removed socialAccounts prop

## Notes

- Platform field cannot be changed after account creation (matches API behavior)
- Username should be entered without @ symbol (as per API docs)
- `is_verified` is `false` for manually added accounts, `true` for OAuth-connected accounts
- All mutations invalidate queries to ensure UI stays in sync
- Account management page is accessible to creators only (enforced by API)

---

**Last Updated:** February 18, 2026
