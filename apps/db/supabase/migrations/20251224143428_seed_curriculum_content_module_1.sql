-- =====================================================
-- Seed: Module 1 - Computer Basics (Topics 1.1 - 3.5)
-- =====================================================

-- Topic 1.1: The Four Jobs of a Computer
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T1.1', 'en', 'curriculum', 'The Four Jobs of a Computer', 
'Every computer does 4 things: Input → Processing → Output → Storage.

**Input**: You give information (keyboard/mouse/touch).
**Processing**: Computer brain (CPU) works on it.
**Output**: You see results on screen/speakers/print.
**Storage**: Files saved for later (safe even when power is off).

**Cultural Analogy - Village Community Hall**
- Input = people submit requests at the desk
- Processing = hall manager plans and assigns work
- Output = announcements/results shown on the board
- Storage = records kept safely in the office cupboard (bhandar / ভাণ্ডাৰ)

**Step-by-Step Example**
1. Type a line in a note app → Input
2. CPU arranges letters → Processing
3. Text appears → Output
4. Press Ctrl + S to save → Storage

**Common Mistakes & Tips**
- ❌ Thinking "processing" is only for maths → ✅ It includes any computer work
- ❌ Forgetting to save → ✅ Press Ctrl + S every 10 minutes',
'{"title_en": "The Four Jobs of a Computer (I → P → O → S)", "title_as": "কম্পিউটাৰৰ চাৰিটা কাম", "duration_minutes": 15}');

-- Topic 1.2: Main Parts You See and Use
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T1.2', 'en', 'curriculum', 'Main Parts You See and Use',
'**Monitor (screen)**: shows text & pictures (output)
**Keyboard/Mouse/Touch**: you give commands (input)
**CPU/System Unit**: computer brain (processing)
**Storage (HDD/SSD/USB)**: keeps files safe (storage)

**Cultural Analogy - Weekly Haat (Market)**
- Stalls = monitor displays items
- Customers giving orders = input
- Market manager = CPU organizes work
- Store rooms = storage for goods

**Step-by-Step Example**
Point to each part and state its job in your own words.

**Common Mistakes & Tips**
- ❌ Calling the monitor "CPU" → ✅ CPU is inside the system unit/laptop/phone
- ❌ Thinking USB is the same as RAM → ✅ USB is storage (permanent), RAM is temporary',
'{"title_en": "Main Parts You See and Use", "title_as": "আপুনি দেখা আৰু ব্যৱহাৰ কৰা মূল অংশসমূহ", "duration_minutes": 20}');

-- Topic 2.1: RAM vs Storage
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T2.1', 'en', 'curriculum', 'RAM vs Storage - Work Table vs Cupboard',
'**RAM (work table)**: holds what you''re using right now; clears when power is off.
**Storage (cupboard)**: holds files for months/years; safe after power off.

**Visual Guide**
RAM (Work Table) vs STORAGE (Cupboard)
- Temporary (clears) vs Permanent (stays)
- Very fast vs Larger capacity
- For open apps now vs For saved files

**Cultural Analogy - Rice Threshing vs Granary**
- RAM = Daily threshing area (quick, cleared often)
- Storage = Community granary (organized, long-term safe)

**Step-by-Step Example**
Type text → in RAM. Save → goes to storage. Turn off → RAM clears; storage keeps file.

**Common Mistakes & Tips**
- ❌ "RAM and storage are same" → ✅ RAM is temporary, storage is permanent
- ❌ Not saving regularly → ✅ Press Ctrl + S every 10 minutes',
'{"title_en": "RAM vs Storage - Work Table vs Cupboard", "title_as": "RAM বনাম সংৰক্ষণ", "duration_minutes": 15}');

-- Topic 2.2: Save Habits
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T2.2', 'en', 'curriculum', 'Save Habits that Survive Power Cuts',
'**Simple Rules**
- Save early and often (Ctrl + S)
- Use Save As with clear names and correct folders
- Turn on AutoSave/Auto-Recover where available

**Visual Guide**
EVERY 10 MINUTES: Ctrl + S
END OF DAY: Save As → Backup_YYYY_MM on USB/phone
WEEKLY: Test-open your backup files

**Cultural Analogy - Evening Shop Closure**
Before closing, shopkeepers count cash, lock cupboards, and keep a copy of records—same with files.

**Step-by-Step Example**
1. Save with a good name
2. End of day, copy to USB
3. Open the copy to confirm

**Common Mistakes & Tips**
- ❌ Only one copy on desktop → ✅ Keep a second copy on USB/phone
- ❌ "I will save later" → ✅ Save as you go',
'{"title_en": "Save Habits that Survive Power Cuts", "title_as": "বিদ্যুৎ কাটিলেও সুৰক্ষিত থকাৰ অভ্যাস", "duration_minutes": 15}');

-- Topic 2.3: Backup Basics
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T2.3', 'en', 'curriculum', 'Backup Basics - The Simple 3-2-1 Rule',
'**3-2-1 Rule**: 3 copies total, 2 different places (e.g., device + USB), 1 offsite (e.g., a second USB at home/school).

**Visual Guide**
3 copies = Original + USB + (Second USB / Cloud if available)
2 media = Device + USB
1 offsite = Keep one copy at another safe place

**Cultural Analogy - Seed Preservation**
Farmers keep seeds in multiple containers and locations to avoid total loss.

**Step-by-Step Example**
Make a Backups/YYYY_MM folder → copy key files weekly → test open.

**Common Mistakes & Tips**
- ❌ Only one copy → ✅ Always maintain at least two
- ❌ Never test backups → ✅ Open backups monthly to confirm',
'{"title_en": "Backup Basics - The Simple 3-2-1 Rule", "title_as": "বেকআপৰ মূল কথা", "duration_minutes": 15}');

-- Topic 3.1: What is a File?
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T3.1', 'en', 'curriculum', 'What is a File? (Types & Extensions)',
'A file is a digital container holding information. The extension tells the computer what type it is.

**Common Extensions**
- .txt = plain text
- .docx = Word document
- .pdf = fixed layout document
- .jpg/.png = images
- .mp3 = audio
- .mp4 = video
- .xlsx = spreadsheet

**Cultural Analogy - Market Products**
Different items (rice, vegetables, cloth) have different containers and labels.

**Common Mistakes & Tips**
- ❌ Renaming extension breaks file → ✅ Change names, not extensions
- ❌ Opening unknown .exe files → ✅ Be careful with executable files',
'{"title_en": "What is a File? (Types & Extensions)", "title_as": "ফাইল কি?", "duration_minutes": 15}');

-- Topic 3.2: Good File Names
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T3.2', 'en', 'curriculum', 'Good File Names People Understand',
'**Good naming rules**
- Use clear, descriptive names
- Include date if version matters: Report_2025_01.docx
- Avoid special characters: / \\ ? * " < > |
- Use underscores or hyphens instead of spaces

**Examples**
✅ Good: Homework_Math_Jan2025.docx
❌ Bad: doc1.docx, new file (2).docx

**Cultural Analogy - Labeling Jars**
Just as we label pickle jars clearly, name files so anyone can find them.

**Common Mistakes & Tips**
- ❌ Names like "untitled" or "final_final_v2" → ✅ Use clear dates/descriptions
- ❌ Too long names → ✅ Keep it short but meaningful',
'{"title_en": "Good File Names People Understand", "title_as": "ভাল ফাইলৰ নাম", "duration_minutes": 15}');

-- Topic 3.3: Folders that Make Sense
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T3.3', 'en', 'curriculum', 'Folders that Make Sense',
'**Organizing with Folders**
Create a logical structure:
Documents/
├── School/
│   ├── Math/
│   ├── Science/
│   └── English/
├── Personal/
└── Backups/

**Cultural Analogy - Organizing a Home**
Different rooms for different purposes, different almirahs for different items.

**Step-by-Step Example**
1. Right-click → New Folder
2. Give it a clear name
3. Move related files into it

**Common Mistakes & Tips**
- ❌ Everything on Desktop → ✅ Use proper folder structure
- ❌ Too many nested folders → ✅ Keep it simple (2-3 levels max)',
'{"title_en": "Folders that Make Sense", "title_as": "বুজিব পৰা ফোল্ডাৰ", "duration_minutes": 20}');

-- Topic 3.4: Safe Saving & Simple Backup
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T3.4', 'en', 'curriculum', 'Safe Saving & Simple Backup',
'**Key Habits**
1. Save to YOUR folder, not Desktop/Downloads on shared computers
2. Use descriptive names with dates
3. Make regular backups to USB
4. Test your backups by opening them

**On Shared Computers**
- Create a folder with your name
- Always save there
- Copy to USB before leaving
- Delete your files when done (if required)

**Common Mistakes & Tips**
- ❌ Leaving personal files on public computers → ✅ Always use your folder/USB
- ❌ Trusting only one copy → ✅ Always have a backup',
'{"title_en": "Safe Saving & Simple Backup", "title_as": "সুৰক্ষিত সংৰক্ষণ", "duration_minutes": 15}');

-- Topic 3.5: Private Info & Safe Sharing
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M1', 'T3.5', 'en', 'curriculum', 'Private Info & Safe Sharing',
'**What is Private Information?**
- Aadhaar number, bank details, passwords
- Personal photos, ID documents
- Address, phone number

**Safe Sharing Rules**
1. Share only what is necessary
2. Use secure methods (not public WhatsApp groups)
3. Name sensitive files neutrally (e.g., "doc_2025" not "aadhaar_scan")
4. Delete shared files after use

**Cultural Analogy - Not Everything for Everyone**
Just as we don''t share all family matters with everyone, some digital info should stay private.

**Common Mistakes & Tips**
- ❌ Sharing Aadhaar/bank on public groups → ✅ Share only via secure channels
- ❌ Keeping sensitive files with obvious names → ✅ Use neutral names',
'{"title_en": "Private Info & Safe Sharing", "title_as": "ব্যক্তিগত তথ্য আৰু সুৰক্ষিত শ্বেয়াৰিং", "duration_minutes": 20}');;
