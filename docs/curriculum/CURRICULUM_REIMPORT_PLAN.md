# Curriculum Database Re-Import Plan

## Objective
Delete all 750 rows from `curriculum_content` table and re-insert with correct content-type mappings from the markdown source files.

---

## Phase 0: Pre-Flight Checks

### 0.1 Backup Current Data (Optional)
- Export current data for rollback if needed

### 0.2 Verify Source Files
- [ ] `/docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Level_1_Complete.md` (English)
- [ ] `/docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Complete.md` (Hindi)
- [ ] `/docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Assamese_Complete.md` (Assamese)

### 0.3 Confirm Topic Structure
- 5 Modules (M1-M5)
- 50 Topics (T1.1 - T19.3)
- 5 Content Types per topic

---

## Phase 1: Delete All Existing Content

```sql
DELETE FROM curriculum_content;
```

Expected: 750 rows deleted

---

## Phase 2: Content Type Mapping Rules

For each topic, extract content from markdown sections:

| Content Type | Source Sections from Markdown |
|--------------|-------------------------------|
| `definition` | **Learning Outcome** + **Simple Explanation** |
| `curriculum` | **Visual Guide** + **Common Mistakes & Tips** + **Privacy & Safety Context** |
| `cultural_context` | **Cultural Analogy** section |
| `example` | **Step-by-Step Example** + **Quick Practice** + **Low-Tech Option** |
| `exercise` | **Assessment (MCQ)** + **Formative check** + **Answer Key** + **Badge Progress** |

---

## Phase 3: Module and Topic Structure

### Module 1: Computer Basics (M1)
- Unit 1: What is a Computer?
  - T1.1: The Four Jobs of a Computer (I→P→O→S)
  - T1.2: Main Parts You See and Use
- Unit 2: Memory and Storage
  - T2.1: RAM vs Storage
  - T2.2: Power Cuts and Save Habits
  - T2.3: Backup Basics (3-2-1 Rule)
- Unit 3: Files and Folders
  - T3.1: What is a File?
  - T3.2: Good File Names
  - T3.3: Meaningful Folders
  - T3.4: Safe Saving and Simple Backup
  - T3.5: Personal Info and Safe Sharing

### Module 2: Operating Systems (M2)
- Unit 4: Desktop Navigation
  - T4.1: Understanding the Desktop Interface
  - T4.2: Window Management for Multitasking
- Unit 5: File Operations
  - T5.1: Create, Copy, Move, Rename, Delete
  - T5.2: File Recovery and Versioning
- Unit 6: Installing and Managing Apps
  - T6.1: Safe Installation from Trusted Sources
  - T6.2: Updates, Uninstall, and App Hygiene
- Unit 7: Computer Security
  - T7.1: Core Protection (AV, Updates, Passwords)
  - T7.2: Recognizing Scams (Phishing, Pop-ups, Fake Offers)
- Unit 8: Maintenance and Troubleshooting
  - T8.1: Weekly Care for a Smooth Computer
  - T8.2: Step-by-Step Troubleshooting

### Module 3: Internet Basics (M3)
- Unit 9: Internet Concepts
  - T9.1: What is the Internet? (Networks and Packets)
  - T9.2: Ways to Connect (Wi-Fi, Mobile Data, Hotspot)
  - T9.3: Web Addresses (URL), Tabs, and Browsers
  - T9.4: Accounts, OTP, and 2-Step Verification
- Unit 10: Safe Browsing
  - T10.1: HTTPS and the Padlock
  - T10.2: Recognizing Online Scams and Fake Pages
  - T10.3: Browser Privacy Basics (History, Cookies, Permissions)
  - T10.4: Safe Downloads and Files from the Web
- Unit 11: Search Skills
  - T11.1: Smart Keywords and Operators
  - T11.2: Evaluating Search Results for Reliability
  - T11.3: Finding Local and Government Information

### Module 4: Digital Communication (M4)
- Unit 12: Email Basics
  - T12.1: Email Anatomy and Etiquette
  - T12.2: Attachments and Safe Email Habits
- Unit 13: Messaging Apps
  - T13.1: WhatsApp/Telegram Basics
  - T13.2: Group Chats, Privacy Settings, and Safety
- Unit 14: Video Calls
  - T14.1: Setting Up and Joining Video Calls
  - T14.2: Etiquette and Troubleshooting
- Unit 15: Social Media Awareness
  - T15.1: Understanding Social Media Platforms
  - T15.2: Privacy, Safety, and Digital Footprint

### Module 5: Local Technology & Services (M5)
- Unit 16: Government Digital Services
  - T16.1: Common Service Centers (CSC) and e-Services
  - T16.2: Applying for Certificates and Schemes Online
  - T16.3: Tracking Applications and Getting Help
- Unit 17: Digital Payments
  - T17.1: UPI Basics (PhonePe, GPay, Paytm)
  - T17.2: Safe Payment Habits
  - T17.3: Handling Payment Issues
- Unit 18: Local Apps and Resources
  - T18.1: Transport and Maps (Google Maps, ASTC)
  - T18.2: Agriculture and Weather Apps
- Unit 19: Community Digital Skills
  - T19.1: Helping Family Members with Technology
  - T19.2: Staying Safe from Common Scams
  - T19.3: Continuous Learning Resources

---

## Phase 4: Insertion Sequence

### Step 4.1: Insert Assamese Content (250 rows)
Process topics T1.1 through T19.3, extracting 5 content types each from the Assamese markdown.

### Step 4.2: Insert English Content (250 rows)
Process topics T1.1 through T19.3, extracting 5 content types each from the English markdown.

### Step 4.3: Insert Hindi Content (250 rows)
Process topics T1.1 through T19.3, extracting 5 content types each from the Hindi markdown.

---

## Phase 5: Verification

### 5.1 Count Verification
```sql
SELECT language, COUNT(*) as total_rows, COUNT(DISTINCT topic_id) as topics
FROM curriculum_content
GROUP BY language;
```
Expected: 250 rows, 50 topics per language

### 5.2 Content Type Verification
```sql
SELECT language,
  SUM(CASE WHEN type_count = 5 THEN 1 ELSE 0 END) as complete_topics
FROM (
  SELECT language, topic_id, COUNT(DISTINCT content_type) as type_count
  FROM curriculum_content
  GROUP BY language, topic_id
) subq
GROUP BY language;
```
Expected: 50 complete topics per language

### 5.3 Sample Content Verification
- Verify T1.1, T5.1, T9.1, T12.1, T16.1 (one from each module) for each language
- Check that `definition` contains actual learning outcomes
- Check that `curriculum` contains educational content
- Check that content matches markdown source

---

## Phase 6: Completion Checklist

- [ ] Phase 1: All 750 rows deleted
- [ ] Phase 4.1: 250 Assamese rows inserted
- [ ] Phase 4.2: 250 English rows inserted
- [ ] Phase 4.3: 250 Hindi rows inserted
- [ ] Phase 5.1: Count verification passed
- [ ] Phase 5.2: Content type verification passed
- [ ] Phase 5.3: Sample verification passed

---

## Execution Notes

- Insert in batches of 10-15 topics per SQL statement to avoid timeouts
- Module ID mapping:
  - M1: T1.x, T2.x, T3.x
  - M2: T4.x, T5.x, T6.x, T7.x, T8.x
  - M3: T9.x, T10.x, T11.x
  - M4: T12.x, T13.x, T14.x, T15.x
  - M5: T16.x, T17.x, T18.x, T19.x

---

## Rollback Plan

If issues occur:
1. Delete all inserted content
2. Restore from backup (if created)
3. Or re-run previous import process

---

*Plan Created: 2026-02-05*
*Status: Ready for Execution*
