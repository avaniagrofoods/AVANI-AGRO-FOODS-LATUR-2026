# Zoho CRM Webform Integration Plan

## Objective
Finalize the "Global Export Inquiry" webform and integrate it into the `avani-app` React frontend.

## Integration Details
- **Zoho Action URL**: `https://crm.zoho.in/crm/WebToLeadForm`
- **Mandatory Hidden Fields**:
  - `xnQsjsdp`: `46991c343489db0dd745630dc4b25c0de2a740b25c176ce25428ec1484f68d3b`
  - `xmIwtLD`: `ef4a075e8943cddc435926e337c11d9c9c7bafa7b8e59931c2c83a4d62b862d2748151b5f4da993485c7719c69469e35`
  - `actionType`: `TGVhZHM=`
  - `returnURL`: `https://avaniagrofoods.com/contact?success=true`

## Field Mapping
| UI Field | Zoho CRM Field Name | Mandatory |
|----------|---------------------|-----------|
| Company | `Company` | Yes |
| Last Name | `Last Name` | Yes |
| First Name | `First Name` | No |
| Email | `Email` | No |
| Phone | `Phone` | No |
| Buyer Type | `LEADCF4` | Yes |
| Lead Status | `LEADCF2` | Yes |
| Description | `Description` | No |

## Steps
1. **Update `Contact.jsx`**:
   - Add `Company` and `Phone` fields.
   - Update `inquiryType` to `Buyer Type` mapping.
   - Use a hidden form or update the existing form to post directly to Zoho.
2. **Success Message**:
   - Handle the `success=true` query parameter to show a professional "Thank You" message.
3. **Analytics**:
   - Include the Zoho Analytics script in the `index.html` or dynamically load it.

## Success Criteria
- Submitting the form creates a Lead in Zoho CRM with correct field mappings.
- The user is redirected back to the contact page with a success message.
- Lead Source is correctly identified.
