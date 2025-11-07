# Email Templates - ATAL AI 1.0

Professional SMTP email templates for Supabase authentication flows.

## 📧 Available Templates

| Template | File | Purpose | Expiry |
|----------|------|---------|--------|
| **Confirm Sign Up** | `confirm-signup.html` | Email verification after user registration | 24 hours |
| **Invite User** | `invite-user.html` | Invitation to join the platform | 7 days |
| **Magic Link** | `magic-link.html` | Passwordless login link | 1 hour |
| **Change Email** | `change-email.html` | Confirm new email address | 24 hours |
| **Reset Password** | `reset-password.html` | Password reset request | 1 hour |
| **Reauthentication** | `reauthentication.html` | Identity verification for sensitive actions | 15 minutes |

## 🎨 Design Features

All templates include:
- ✅ Professional gradient header with ATAL AI branding
- ✅ Responsive design (mobile & desktop)
- ✅ Clear call-to-action buttons
- ✅ Security notices and warnings
- ✅ Fallback URL for manual copying
- ✅ Consistent color scheme (`#1d4ed8` primary blue)
- ✅ Footer with copyright information

## 🔧 Setup Instructions

### 1. Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project: **ATAL AI 1.0**
3. Navigate to **Authentication** → **Email Templates**

### 2. Configure Each Template

For each template type, follow these steps:

#### **Confirm Sign Up**
1. Click on **Confirm signup** tab
2. Replace the default HTML with content from `confirm-signup.html`
3. **Subject Line:** `Welcome to ATAL AI - Confirm Your Email`
4. Click **Save**

#### **Invite User**
1. Click on **Invite user** tab
2. Replace the default HTML with content from `invite-user.html`
3. **Subject Line:** `You've been invited to join ATAL AI`
4. Click **Save**

#### **Magic Link**
1. Click on **Magic Link** tab
2. Replace the default HTML with content from `magic-link.html`
3. **Subject Line:** `Your ATAL AI Login Link`
4. Click **Save**

#### **Change Email Address**
1. Click on **Change Email Address** tab
2. Replace the default HTML with content from `change-email.html`
3. **Subject Line:** `Confirm Your Email Change - ATAL AI`
4. Click **Save**

#### **Reset Password**
1. Click on **Reset Password** tab
2. Replace the default HTML with content from `reset-password.html`
3. **Subject Line:** `Reset Your ATAL AI Password`
4. Click **Save**

#### **Reauthentication**
1. Click on **Reauthentication** tab
2. Replace the default HTML with content from `reauthentication.html`
3. **Subject Line:** `Verify Your Identity - ATAL AI`
4. Click **Save**

## 🔑 Template Variables

Supabase automatically injects these variables:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Unique confirmation/action URL |
| `{{ .Token }}` | Authentication token (if needed) |
| `{{ .TokenHash }}` | Hashed token (if needed) |
| `{{ .SiteURL }}` | Your application's URL |

## 📝 SMTP Configuration

### Required Environment Variables

Add these to your Supabase project settings:

```env
# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
SMTP_ADMIN_EMAIL=admin@atalai.com
SMTP_SENDER_NAME=ATAL AI Team
```

### Popular SMTP Providers

#### **Gmail**
- Host: `smtp.gmail.com`
- Port: `587` (TLS) or `465` (SSL)
- Note: Use [App Password](https://support.google.com/accounts/answer/185833) instead of regular password

#### **SendGrid**
- Host: `smtp.sendgrid.net`
- Port: `587`
- User: `apikey`
- Password: Your SendGrid API key

#### **Amazon SES**
- Host: `email-smtp.[region].amazonaws.com`
- Port: `587`
- User: Your SMTP username
- Password: Your SMTP password

#### **Mailgun**
- Host: `smtp.mailgun.org`
- Port: `587`
- User: Your Mailgun SMTP username
- Password: Your Mailgun SMTP password

## 🧪 Testing Templates

### Send Test Email

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Select a template
3. Click **Send test email**
4. Enter your email address
5. Check your inbox

### Test All Flows

```typescript
import { supabase } from '@/lib/supabaseClient'

// 1. Test Sign Up
await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'securepassword123'
})

// 2. Test Magic Link
await supabase.auth.signInWithOtp({
  email: 'test@example.com'
})

// 3. Test Password Reset
await supabase.auth.resetPasswordForEmail('test@example.com')

// 4. Test Email Change
await supabase.auth.updateUser({
  email: 'newemail@example.com'
})
```

## 🎯 Customization

### Change Brand Colors

Replace these color codes in all templates:

| Element | Current Color | CSS Property |
|---------|--------------|--------------|
| Primary Blue | `#1d4ed8` | `background`, `color` |
| Light Blue | `#3b82f6` | `background` gradient |
| Background | `#f4f4f4` | `background-color` |

### Update Logo

Replace the text header with an image:

```html
<!-- Replace this: -->
<h1 style="color: #ffffff;">ATAL AI</h1>

<!-- With this: -->
<img src="https://your-cdn.com/logo.png" alt="ATAL AI" style="height: 50px;">
```

## 📊 Best Practices

1. **Subject Lines:**
   - Keep under 50 characters
   - Be clear and specific
   - Include brand name

2. **Email Content:**
   - Single clear call-to-action
   - Short paragraphs (2-3 lines)
   - Mobile-friendly design
   - Security warnings for sensitive actions

3. **Testing:**
   - Test on multiple email clients (Gmail, Outlook, Apple Mail)
   - Check mobile responsiveness
   - Verify all links work
   - Test spam score

## 🔒 Security Considerations

- ✅ All templates include security warnings
- ✅ Links expire after specified timeframes
- ✅ Clear instructions for reporting suspicious emails
- ✅ No sensitive information in email body
- ✅ Unique tokens for each action

## 📞 Support

If users report issues with emails:
1. Check Supabase logs: **Authentication** → **Logs**
2. Verify SMTP settings
3. Check spam folders
4. Verify email delivery status

## 🚀 Deployment Checklist

- [ ] All templates uploaded to Supabase
- [ ] Subject lines configured
- [ ] SMTP settings verified
- [ ] Test emails sent and received
- [ ] Links working correctly
- [ ] Mobile view tested
- [ ] Spam score checked
- [ ] Production domain whitelisted

---

**Created:** 2025-11-07
**Last Updated:** 2025-11-07
**Version:** 1.0.0
