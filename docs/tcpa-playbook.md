# TCPA 2025 Compliance Playbook

## Overview

The Telephone Consumer Protection Act (TCPA) regulates business communications via phone, SMS, and fax. Violations can result in fines of $500-$1,500 per violation. This playbook ensures HBU Asset Recovery maintains full compliance.

## SMS Communications

### Before Sending ANY SMS

1. **Verify Consent**
   - Check database for explicit written consent
   - Consent must be for specific purpose (surplus recovery)
   - Cannot use pre-checked boxes or inferred consent
   - Must include disclosure of message frequency and data rates

2. **Check Quiet Hours**
   - No SMS between 9 PM and 8 AM recipient local time
   - System automatically blocks messages outside permitted hours
   - Reschedule messages that fall in quiet hours

3. **Verify Not on DNC**
   - Check internal opt-out list
   - Verify against wireless DNC list
   - Honor all STOP requests permanently

4. **Check Frequency Cap**
   - Maximum 3 SMS per week per lead
   - System enforces automatic throttling
   - Reset counter weekly

### Required SMS Elements

Every SMS must include:

```
[Message Content]

Reply STOP to opt-out. Msg&data rates may apply.
```

Example compliant SMS:
```
Hi [Name], we found unclaimed property in your name worth $[Amount] in [State]. We can help you recover it at no upfront cost. Reply STOP to opt-out. Msg&data rates may apply.
```

### Prohibited SMS Content

- ❌ "Urgent" or "Act Now" language
- ❌ "Limited Time" pressure tactics
- ❌ Guaranteed recovery promises
- ❌ Threatening language
- ❌ Requests for sensitive information (SSN, bank account)

### Handling Opt-Outs

When recipient replies STOP:
1. Immediately add to internal DNC list (within 1 hour)
2. Send confirmation: "You've been unsubscribed. No more messages will be sent."
3. Remove from all future campaigns
4. Log opt-out with timestamp
5. Honor permanently (no re-consent for same purpose)

## Email Communications

### Before Sending ANY Email

1. **Verify Consent**
   - Documented opt-in for marketing emails
   - Transactional emails (filing updates) don't require consent

2. **Include Required Elements**
   - Clear "From" name (HBU Asset Recovery)
   - Non-deceptive subject line
   - Physical mailing address in footer
   - One-click unsubscribe link
   - "This is a marketing email" if applicable

### Required Email Footer

```html
<footer>
  <p>HBU Asset Recovery LLC</p>
  <p>[Physical Address]</p>
  <p>[City, State ZIP]</p>
  <p><a href="[unsubscribe_link]">Unsubscribe</a></p>
</footer>
```

### Prohibited Email Practices

- ❌ Fake "Re:" or "Fwd:" in subject lines
- ❌ Hiding unsubscribe link
- ❌ Requiring login to unsubscribe
- ❌ Taking more than 10 business days to process unsubscribe
- ❌ Deceptive sender names
- ❌ No physical address

### Handling Unsubscribes

1. Process within 10 business days (we do it immediately)
2. No confirmation required before unsubscribing
3. No fees or information required to unsubscribe
4. One-click unsubscribe link must work
5. Remove from all marketing lists
6. Log unsubscribe with timestamp

## Phone Calls

### Before Making ANY Call

1. **Check National DNC Registry**
   - Required for marketing calls
   - Update registry data quarterly
   - Cost: $0.005 per number checked

2. **Check Internal DNC List**
   - Honor all previous requests not to call
   - Maintain separate from SMS/email opt-outs

3. **Verify Time Windows**
   - Only call between 8 AM - 9 PM recipient local time
   - No calls on Sundays (recommended best practice)

4. **Prepare Caller ID**
   - Must display real, callable number
   - No spoofing or generic numbers
   - Must answer return calls

### Required Call Script Elements

Opening (within 15 seconds):
```
"Hello, this is [Name] from HBU Asset Recovery. 
I'm calling about unclaimed property we found in your name. 
Is this a good time to talk?"
```

### If Requested to Stop Calling

1. Immediately comply
2. Add to internal DNC list within 24 hours
3. Confirm: "I've added you to our do-not-call list. You won't hear from us again."
4. Log request with timestamp
5. Never call that number again for marketing

## Consent Management

### Obtaining Consent

Valid consent must:
- Be in writing (email or SMS confirmation counts)
- Clearly disclose who is calling/texting
- State purpose of communications
- Include frequency disclosure
- Not use pre-checked boxes
- Allow easy opt-out

### Sample Consent Language

```
By providing your phone number and/or email address, you agree 
to receive calls, text messages, and emails from HBU Asset Recovery 
regarding your unclaimed property claim. You may receive up to 3 
messages per week. Message and data rates may apply. Reply STOP 
to opt-out of SMS or click unsubscribe in emails. 

Your consent is not a condition of service.
```

### Consent Records

Maintain for each lead:
- Date/time consent obtained
- Method of consent (web form, verbal, SMS, email)
- Specific language of consent
- IP address (for web forms)
- Opt-out status and date if applicable

Retention: 4 years minimum

## Automation & Technology

### System Safeguards

- ✅ Automatic quiet hours enforcement
- ✅ Frequency cap enforcement
- ✅ DNC list checking before send
- ✅ Consent verification before send
- ✅ Opt-out processing automation
- ✅ Audit logging of all communications

### Regular Maintenance

**Daily**:
- Process opt-out requests
- Verify system compliance checks running

**Weekly**:
- Review opt-out logs
- Check frequency cap exceptions

**Quarterly**:
- Update National DNC Registry data
- Scrub all active numbers against registry
- Review and update internal DNC lists

**Annually**:
- Full compliance audit
- Update procedures for new regulations
- Train staff on TCPA changes

## Violation Response

If Potential Violation Detected:

1. **Immediate Actions**
   - Stop the violating communication immediately
   - Document what happened
   - Identify how many recipients affected

2. **Investigation**
   - Review audit logs
   - Determine cause (system error, process gap, human error)
   - Assess severity and scope

3. **Remediation**
   - Fix the root cause
   - Implement additional safeguards if needed
   - Document corrective actions

4. **Notification** (if required)
   - Legal counsel review
   - Notify affected parties if appropriate
   - Cooperate with regulatory investigation if contacted

5. **Prevention**
   - Update procedures
   - Retrain staff
   - Enhance system controls

## State-Specific Addendums

### Florida
- Additional state DNC registry
- Stricter solicitation hours: 8 AM - 8 PM

### California
- CCPA privacy rights apply
- Do Not Call list separate from federal

### New York
- Requires separate state registration
- Additional telemarketing restrictions

## Resources

- FTC TCPA Guidance: https://www.ftc.gov/tcpa
- National DNC Registry: https://www.donotcall.gov
- CTIA Messaging Guidelines: https://www.ctia.org

## Questions?

Contact: compliance@hbuassetrecovery.com

Last Updated: 2025-01-08
