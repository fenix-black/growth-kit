# Credit Reason Display Names

This document shows how internal credit reason codes are displayed to users in the dashboard.

## Credit Reason Mapping

The system uses internal codes in the database but displays user-friendly names in the UI. This is handled by `/src/lib/utils/credits.ts`.

### Welcome & Initial Credits
| Internal Code | Display Name | Description |
|--------------|--------------|-------------|
| `invitation_grant` | **Welcome Bonus** | Credits given to all new users on first visit |
| `starting_grant` | **Welcome Bonus** | Alternative name for welcome credits |

### Regular Operations  
| Internal Code | Display Name | Description |
|--------------|--------------|-------------|
| `daily_grant` | **Daily Credits** | Daily recurring credits |

### Referrals
| Internal Code | Display Name | Description |
|--------------|--------------|-------------|
| `referral` | **Referral Bonus** | Credits from user-to-user referrals |
| `master_referral` | **Master Invite** | Credits from app master referral code |

### User Actions
| Internal Code | Display Name | Description |
|--------------|--------------|-------------|
| `name_claim` | **Name Added** | Credits for providing name |
| `email_claim` | **Email Added** | Credits for providing email |
| `email_verification` | **Email Verified** | Credits for verifying email |
| `email_verify` | **Email Verified** | Alternative verification credit |

### Waitlist & Invitations
| Internal Code | Display Name | Description |
|--------------|--------------|-------------|
| `invitation_accepted` | **Invite Accepted** | Credits when invitation is accepted |

### Usage
| Internal Code | Display Name | Description |
|--------------|--------------|-------------|
| `consumed` | **Credit Used** | Credits consumed by actions |
| `action` | **Action Completed** | Credits for completed actions |

### Admin
| Internal Code | Display Name | Description |
|--------------|--------------|-------------|
| `manual` | **Manual Adjustment** | Admin manual credit changes |
| `admin_grant` | **Admin Grant** | Admin-initiated credit grants |
| `custom` | **Custom** | Custom credit reasons |

## Where It's Used

1. **Users & Leads Panel** - Credit history in user detail modal
2. **Dashboard Overview** - Credit distribution pie chart
3. **Analytics** - Any place where credit reasons are displayed

## Implementation

The formatting is handled by:
- `formatCreditReason(reason)` - Converts codes to friendly names
- `getCreditReasonColor(reason)` - Returns color for charts/badges
- `getCreditReasonEmoji(reason)` - Optional emoji for enhanced display

## Why KISS Approach?

- ✅ No database changes needed
- ✅ No migration required
- ✅ Easy to update display names
- ✅ Internal codes remain stable
- ✅ Clear separation between data and presentation

## Example

**Before:**
```
Credit History:
- invitation_grant: +5 credits
- daily_grant: +3 credits
```

**After:**
```
Credit History:
- Welcome Bonus: +5 credits
- Daily Credits: +3 credits
```

Much clearer! 🎉
