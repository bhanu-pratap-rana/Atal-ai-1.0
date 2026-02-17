-- =====================================================
-- Seed: Module 2 - Operating Systems (Topics 4.1 - 8.2)
-- =====================================================

-- Topic 4.1: Desktop Interface
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T4.1', 'en', 'curriculum', 'Understanding the Desktop Interface',
'**Desktop Elements**
- **Desktop**: Main screen you see after login
- **Icons**: Small pictures that open programs/files
- **Taskbar**: Bar at bottom showing open apps
- **Start Menu**: Access all programs and settings
- **System Tray**: Clock, battery, Wi-Fi, notifications

**Navigation Basics**
- Double-click to open
- Right-click for options menu
- Drag icons to move them
- Pin frequently used apps to taskbar

**Cultural Analogy - Your Work Desk**
Desktop is like your physical desk - keep it organized, only essentials visible.

**Common Mistakes & Tips**
- Do not have too many icons on desktop, keep it clean, use folders
- Learn to use Start Menu, it has everything',
'{"title_en": "Understanding the Desktop Interface", "title_as": "ডেস্কটপ ইণ্টাৰফেচ বুজা", "duration_minutes": 20}');

-- Topic 4.2: Window Management
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T4.2', 'en', 'curriculum', 'Window Management for Multitasking',
'**Window Controls**
- **Minimize**: Hide window, still running
- **Maximize**: Make window full screen
- **Close**: Exit the program
- **Resize**: Drag edges/corners

**Multitasking**
- Alt + Tab: Switch between open windows
- Snap windows: Drag to left/right edge for split view
- Multiple desktops: Keep work and personal separate

**Step-by-Step Example**
1. Open two apps
2. Drag one to left edge (snaps to half screen)
3. Click second app for right side
4. Now you can see both!

**Common Mistakes & Tips**
- Closing when you mean minimize - Minimize keeps it running
- Too many windows open - Close what you do not need',
'{"title_en": "Window Management for Multitasking", "title_as": "মাল্টিটাস্কিং", "duration_minutes": 20}');

-- Topic 5.1: File Operations
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T5.1', 'en', 'curriculum', 'Create, Copy, Move, Rename, Delete',
'**Basic File Operations**
- **Create**: Right-click then New then Choose type
- **Copy**: Ctrl+C (original stays)
- **Cut**: Ctrl+X (original moves)
- **Paste**: Ctrl+V
- **Rename**: F2 or right-click then Rename
- **Delete**: Delete key or right-click then Delete

**Step-by-Step: Copy a File**
1. Select file
2. Press Ctrl+C
3. Go to destination folder
4. Press Ctrl+V

**The Recycle Bin**
- Deleted files go here first
- You can restore if needed
- Empty regularly to free space

**Common Mistakes & Tips**
- Cut and forget to paste - File might be lost!
- Deleting important files - Check Recycle Bin to recover',
'{"title_en": "Create, Copy, Move, Rename, Delete", "title_as": "ফাইল অপাৰেচন", "duration_minutes": 25}');

-- Topic 6.1: Safe App Installation
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T6.1', 'en', 'curriculum', 'Safe Installation from Trusted Sources',
'**Trusted Sources**
- Official app stores (Microsoft Store, Play Store)
- Official websites (e.g., mozilla.org for Firefox)
- Government sites for official apps

**Red Flags - Avoid These**
- Random download links in emails
- Pop-ups saying Your computer is infected
- Sites offering free paid software (often malware)
- Files from unknown USB drives

**Step-by-Step: Safe Install**
1. Go to official website or app store
2. Search for the app
3. Check reviews and download count
4. Install and allow only necessary permissions

**Common Mistakes & Tips**
- Clicking first download link - Always verify the source
- Giving all permissions - Only allow what app needs',
'{"title_en": "Safe Installation from Trusted Sources", "title_as": "সুৰক্ষিত ইনষ্টলেচন", "duration_minutes": 20}');

-- Topic 6.2: Updates and App Hygiene
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T6.2', 'en', 'curriculum', 'Updates, Uninstall, and App Hygiene',
'**Why Updates Matter**
- Fix security holes
- Add new features
- Improve performance
- Better compatibility

**How to Update**
- Windows: Settings then Windows Update
- Apps: Store then Check for updates
- Enable automatic updates when possible

**Uninstalling Apps**
1. Settings then Apps then Installed apps
2. Find the app
3. Click Uninstall
4. Follow prompts

**App Hygiene**
- Remove apps you do not use
- Check app permissions regularly
- Do not keep multiple apps for same task

**Common Mistakes & Tips**
- Ignoring updates - Updates fix security issues
- Keeping unused apps - Uninstall to save space and improve security',
'{"title_en": "Updates, Uninstall, and App Hygiene", "title_as": "আপডেট আৰু এপ হাইজিন", "duration_minutes": 20}');

-- Topic 7.1: Core Protection
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T7.1', 'en', 'curriculum', 'Core Protection (AV, Updates, Passwords)',
'**Three Pillars of Computer Security**

**1. Antivirus**
- Windows Defender is built-in and free
- Keep it enabled and updated
- Run scans weekly

**2. System Updates**
- Enable automatic updates
- Restart when prompted
- Do not delay important security updates

**3. Strong Passwords**
- At least 8 characters
- Mix letters, numbers, symbols
- Different password for important accounts
- Never share passwords

**Cultural Analogy - Locking Your Home**
Just as you lock doors, antivirus guards entry points, updates fix broken locks, passwords are your keys.

**Common Mistakes & Tips**
- Disabling antivirus - Keep it always on
- Same password everywhere - Use different passwords',
'{"title_en": "Core Protection (AV, Updates, Passwords)", "title_as": "মূল সুৰক্ষা", "duration_minutes": 25}');

-- Topic 7.2: Spotting Scams
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T7.2', 'en', 'curriculum', 'Spotting Scams (Phishing, Pop-ups, Fake Offers)',
'**Common Scam Types**

**Phishing**
- Fake emails/messages pretending to be banks, government
- Ask for passwords, OTP, bank details
- Have urgent/threatening language

**Fake Pop-ups**
- Your computer has virus!
- You won a prize!
- Call this number immediately

**Too Good to Be True**
- Free iPhones, large cash prizes
- Work from home earning lakhs
- Lottery you never entered

**How to Stay Safe**
1. Never click suspicious links
2. Verify sender before sharing info
3. Banks NEVER ask for OTP via call/message
4. Close suspicious pop-ups (do not click anything on them)

**Common Mistakes & Tips**
- Clicking You won links - If you did not enter, you did not win
- Sharing OTP with callers - OTP is only for YOUR use',
'{"title_en": "Spotting Scams", "title_as": "প্ৰতাৰণা চিনাক্ত", "duration_minutes": 20}');

-- Topic 8.1: Weekly Computer Care
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T8.1', 'en', 'curriculum', 'Weekly Care for a Smooth Computer',
'**Weekly Maintenance Checklist**

**Digital Cleaning**
- Empty Recycle Bin
- Clear browser cache
- Delete temporary files (use Disk Cleanup)
- Close unused programs

**Physical Cleaning**
- Wipe screen with soft dry cloth
- Clean keyboard (turn upside down, shake gently)
- Keep vents clear for airflow
- Do not eat/drink near computer

**Check These Weekly**
- Windows Update status
- Antivirus scan results
- Storage space available
- Backup status

**Cultural Analogy - Weekly Home Cleaning**
Just like cleaning your home weekly keeps it healthy, computer care prevents problems.

**Common Mistakes & Tips**
- Never cleaning - Weekly cleanup prevents slowdown
- Blocking vents - Heat damages computers',
'{"title_en": "Weekly Care for a Smooth Computer", "title_as": "সাপ্তাহিক যত্ন", "duration_minutes": 15}');

-- Topic 8.2: Basic Troubleshooting
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M2', 'T8.2', 'en', 'curriculum', 'Step-by-Step Troubleshooting',
'**The Universal Fix: Restart**
80 percent of problems are solved by restarting. Always try this first!

**Common Problems and Solutions**

**Computer is Slow**
1. Close unused apps
2. Restart computer
3. Check for updates
4. Free up storage space

**App Not Responding**
1. Wait 30 seconds
2. Press Ctrl+Alt+Delete then Task Manager
3. Select the frozen app
4. Click End Task

**No Internet**
1. Check Wi-Fi is on
2. Check router lights
3. Restart router
4. Restart computer
5. Try another device (to check if problem is computer or network)

**File Will Not Open**
1. Check if you have the right app installed
2. Right-click then Open with then Choose correct app
3. File might be corrupted - try backup copy

**When to Ask for Help**
- Error messages you do not understand
- Hardware problems (screen broken, keys not working)
- After restart does not fix it

**Common Mistakes and Tips**
- Panicking and clicking randomly - Restart first, then investigate
- Not noting error messages - Write down or screenshot errors',
'{"title_en": "Step-by-Step Troubleshooting", "title_as": "সমস্যা সমাধান", "duration_minutes": 20}');;
