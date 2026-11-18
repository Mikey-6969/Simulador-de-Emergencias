# Aranda ASMS Authenticated Access Report

**Generated:** November 18, 2026  
**Test Account:** soporteticbogota2.cgs@ciudadlimpia.com.co  
**Portals Tested:**
- Specialist Console: https://mastd.fanalca.com/asmsspecialist
- Customer Portal: https://mastd.fanalca.com/asmscustomer

---

## Executive Summary

**Authentication Status: FAILED**

All authentication attempts using the provided credentials failed on both the Specialist Console and Customer Portal. Both ARANDA local authentication and Microsoft Office 365 SSO were tested per the specified strategy. Neither method successfully authenticated the test account.

---

## Authentication Attempts

### 1. Specialist Console (`/asmsspecialist`)

#### 1.1 ARANDA Authentication (Primary Method)
- **URL:** https://mastd.fanalca.com/asmsspecialist/index.html#/
- **Authentication Type Selected:** ARANDA
- **Username Entered:** soporteticbogota2.cgs@ciudadlimpia.com.co
- **Password Entered:** [REDACTED per security policy]
- **Result:** **FAILED**
- **Error Message:** "Authentication failed, verify the data"
- **Error Screenshot:** `/tmp/computer-use/c24e4.webp` (copied to `/opt/cursor/artifacts/asms-spec-aranda-auth-failed.webp`)

**Observations:**
- Login form accepted input but rejected credentials
- Red error banner displayed at bottom of login form
- No additional validation or hint provided (e.g., username format requirements)

#### 1.2 Office 365 SSO (Fallback Method)
- **Redirect URL:** login.microsoftonline.com
- **Email Entered:** soporteticbogota2.cgs@ciudadlimpia.com.co
- **Password Entered:** [REDACTED per security policy]
- **Result:** **FAILED**
- **Error Message:** "Your account or password is incorrect. If you don't remember your password, reset it now."
- **Error Screenshot:** `/tmp/computer-use/b9468.webp` and `/opt/cursor/artifacts/asms-spec-o365-error.webp`

**Observations:**
- Microsoft Azure AD login page appeared
- Credentials rejected at Microsoft identity provider level
- Error suggests either:
  - Account does not exist in Azure AD tenant
  - Password is incorrect for this Office 365 account
  - Account may not have SSO access configured

---

### 2. Customer Portal (`/asmscustomer`)

#### 2.1 ARANDA Authentication (Primary Method)
- **URL:** https://mastd.fanalca.com/asmscustomer/index.html#/
- **Authentication Type Selected:** ARANDA
- **Username Entered:** soporteticbogota2.cgs@ciudadlimpia.com.co
- **Password Entered:** [REDACTED per security policy]
- **Result:** **FAILED**
- **Error Message:** "Authentication failed, verify the data"
- **Error Screenshot:** `/tmp/computer-use/b7d9a.webp` (copied to `/opt/cursor/artifacts/asms-customer-aranda-auth-failed.webp`)

**Observations:**
- Identical error to Specialist console
- Login UI styling slightly different (Customer portal shows different background images: company logos, offices, workers)
- Same generic error message with no specifics

#### 2.2 Office 365 SSO (Fallback Method)
- **Redirect URL:** login.microsoftonline.com (same SAML flow)
- **Email Entered:** soporteticbogota2.cgs@ciudadlimpia.com.co
- **Password Entered:** [REDACTED per security policy]
- **Result:** **FAILED**
- **Error Message:** "Your account or password is incorrect. If you don't remember your password, reset it now."
- **Error Screenshot:** `/tmp/computer-use/c37b5.webp` (copied to `/opt/cursor/artifacts/asms-customer-o365-error.webp`)

**Observations:**
- Identical Office 365 error to Specialist console attempt
- Both portals appear to use the same Azure AD tenant for SSO
- No MFA prompt was triggered (authentication failed before that stage)

---

## Technical Analysis

### Login Page Structure (Both Portals)

**Common Elements Observed:**
- **Aranda ASMS Branding:** White "M/S" logo (top left)
- **Authentication Type Dropdown:** "ARANDA" / Office 365 options
- **User Field:** Text input (accepts email format)
- **Password Field:** Masked input with show/hide toggle
- **Sign In Button:** Teal/cyan colored
- **Forgot Password Link:** Below password field
- **Office 365 SSO Button:** Alternative login with Microsoft logo
- **Footer Branding:** "Powered by Aranda SOFTWARE 8.12.0 R6"

**Specialist vs Customer UI Differences:**
- **Specialist:** Title "Aranda Service Management" (no specific label)
- **Customer:** Title "Customer Portal" explicitly displayed
- **Background Images:** Customer portal cycles through branded company photos (Fanalca trucks, offices, sustainability messaging)

### Authentication Flow

1. **Local ARANDA Auth:**
   - Form submission sends credentials to ASMS backend
   - Backend validates against internal user database
   - Returns error immediately (no redirect)
   - Error displayed as dismissible banner

2. **Office 365 SSO:**
   - Redirects to `login.microsoftonline.com`
   - Azure AD tenant: (identified in SAML request URL parameters)
   - Standard Microsoft login flow (email → password)
   - Authentication rejected at Microsoft IdP before SAML assertion
   - No MFA challenge presented (failed at password stage)

---

## Possible Causes of Authentication Failure

### 1. Incorrect Credentials
- Password may be incorrect or expired
- Username format may be wrong (email vs. short username)
- Account may have been deactivated or locked

### 2. Account Permissions / Role Mismatch
- Account may exist but lack necessary role for Specialist console
- User may only have Customer portal access (or vice versa)
- Fanalca ASMS may use role-based portal access control

### 3. Domain / Tenant Mismatch
- Email domain `@ciudadlimpia.com.co` may not be registered in Fanalca's ASMS
- Office 365 tenant may not include this external domain
- SSO may only be configured for `@fanalca.com` or internal domains

### 4. Configuration Issues
- Test environment credentials may differ from production
- Account may require first-time password reset
- ARANDA auth may use different username format (e.g., just "soporteticbogota2.cgs")

### 5. Security Policies
- IP restrictions (authentication may be blocked from cloud agent IPs)
- Time-based access controls
- Require VPN or internal network access

---

## Attempted Authentication Methods Summary

| Portal | Auth Method | Username Format | Result | Error Message |
|--------|-------------|-----------------|--------|---------------|
| Specialist | ARANDA | Full email | FAILED | "Authentication failed, verify the data" |
| Specialist | Office 365 | Full email | FAILED | "Your account or password is incorrect" |
| Customer | ARANDA | Full email | FAILED | "Authentication failed, verify the data" |
| Customer | Office 365 | Full email | FAILED | "Your account or password is incorrect" |

---

## Recommendations

### 1. Verify Credentials
- Confirm the password is correct and not expired
- Test if username should be short format (e.g., "soporteticbogota2.cgs") instead of full email
- Check if account is active in ASMS admin console

### 2. Confirm Account Roles
- Verify user has appropriate role/license for Specialist console access
- Check if user is restricted to Customer portal only
- Review group memberships and permissions

### 3. Check Domain Configuration
- Confirm if `@ciudadlimpia.com.co` domain is registered in Fanalca ASMS
- Verify if external users from this domain are allowed
- Check if Office 365 SSO is configured for this domain

### 4. Alternative Testing Approaches
- Try omitting domain from username (use "soporteticbogota2.cgs" only)
- Request password reset via "Forgot password" link
- Test with a known working account to isolate the issue
- Check if VPN or specific network access is required

### 5. Contact System Administrator
- Request verification of account status in ASMS backend
- Ask for confirmation of correct username format
- Verify if IP whitelist restrictions apply
- Obtain test credentials known to work

---

## Screenshots Inventory

### Saved to `/opt/cursor/artifacts/`:
1. `asms-spec-login-page.webp` - Specialist console login page (ARANDA auth selected)
2. `asms-spec-aranda-auth-failed.webp` - ARANDA authentication failure error on Specialist console
3. `asms-spec-o365-error.webp` - Office 365 authentication error on Specialist console
4. `asms-customer-login-page.webp` - Customer portal login page (ARANDA auth selected)
5. `asms-customer-aranda-auth-failed.webp` - ARANDA authentication failure on Customer portal
6. `asms-customer-o365-error.webp` - Office 365 authentication error on Customer portal

### Additional Screenshots in `/tmp/computer-use/`:
- Multiple intermediate screens during authentication flow
- Browser navigation steps
- Password field interactions
- Error dialog dismissals

---

## Unable to Document (Due to Failed Authentication)

The following sections could not be completed because authentication was unsuccessful:

### Specialist Console - Not Accessible:
- Main menu / sidebar navigation structure
- Inbox / case list (columns, filters, statuses, search)
- Case details (description, history, attachments, solution tabs)
- Case workflow (assignment, state changes, ownership, close actions)
- Catalogs (services, categories, CIs)
- Knowledge base articles
- Reports and dashboards
- User profile and notification settings
- Advanced search functionality
- SLA timers and priority indicators

### Customer Portal - Not Accessible:
- Home dashboard widgets
- Create case/request form (full field inventory)
  - Category selections
  - Service catalog
  - Priority options
  - Description templates
  - Attachment functionality
  - Validation rules
- My cases list (status tracking, filters)
- Case history and updates
- Knowledge base / FAQ browser
- Survey/feedback forms
- Approval workflows
- Chat/support features

---

## Conclusion

Authentication attempts using the provided credentials (`soporteticbogota2.cgs@ciudadlimpia.com.co`) failed on both Aranda ASMS portals (Specialist and Customer) using both ARANDA local authentication and Microsoft Office 365 SSO methods.

**All four authentication paths tested returned errors:**
- ARANDA auth on both portals: "Authentication failed, verify the data"
- Office 365 SSO on both portals: "Your account or password is incorrect"

Without successful authentication, comprehensive reverse-engineering of the authenticated UI (case management workflows, dashboards, forms, etc.) could not be performed.

**Next Steps:**
1. Verify and confirm working credentials
2. Confirm account has appropriate role/permissions
3. Check for network access restrictions
4. Retry authentication with validated credentials
5. If credentials are correct, investigate system-level access issues with Fanalca IT administrators

---

**Report Status:** Complete (Authentication Phase Only)  
**Authenticated UI Mapping:** Not performed (authentication prerequisite not met)  
**Screenshots Archived:** 6 key screenshots saved to `/opt/cursor/artifacts/`
