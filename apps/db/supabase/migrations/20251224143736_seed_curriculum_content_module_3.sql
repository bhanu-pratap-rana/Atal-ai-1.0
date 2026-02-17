-- =====================================================
-- Seed: Module 3 - Internet Basics (Topics 9.1 - 11.2)
-- =====================================================

-- Topic 9.1: What is the Internet?
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T9.1', 'en', 'curriculum', 'What is the Internet? (Networks and Packets)',
'**Simple Explanation**
The Internet is a global network connecting billions of computers. Information travels in small pieces called packets.

**How It Works**
1. You request a webpage
2. Request travels through networks
3. Website sends data back in packets
4. Your browser assembles packets into the page

**Cultural Analogy - Postal System**
Like letters traveling through post offices, internet data travels through servers and routers.

**Key Terms**
- **Network**: Connected computers sharing information
- **Router**: Device that directs traffic
- **Server**: Computer that stores websites/data
- **ISP**: Company providing internet connection

**Common Mistakes and Tips**
- Thinking internet and Wi-Fi are same - Wi-Fi is just one way to connect
- Internet needs electricity at multiple points - your device, router, servers',
'{"title_en": "What is the Internet?", "title_as": "ইণ্টাৰনেট কি?", "duration_minutes": 15}');

-- Topic 9.2: Ways to Connect
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T9.2', 'en', 'curriculum', 'Ways to Connect (Wi-Fi, Mobile Data, Hotspot)',
'**Connection Types**

**Wi-Fi**
- Wireless connection to router
- Usually faster and cheaper
- Limited range (within building)
- Need password to connect

**Mobile Data (3G/4G/5G)**
- Uses phone network
- Works anywhere with signal
- Uses your data plan
- Good for travel

**Hotspot**
- Share phone internet with laptop
- Uses mobile data
- Drains phone battery
- Good for emergencies

**Choosing the Right Option**
- At home/school: Use Wi-Fi (saves mobile data)
- Traveling: Use mobile data
- No Wi-Fi available: Use hotspot temporarily

**Common Mistakes and Tips**
- Leaving mobile data on when Wi-Fi available - Wastes data plan
- Connecting to unknown Wi-Fi - Could be unsafe',
'{"title_en": "Ways to Connect", "title_as": "সংযোগৰ উপায়", "duration_minutes": 15}');

-- Topic 9.3: Web Addresses and Browsers
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T9.3', 'en', 'curriculum', 'Web Addresses (URLs), Tabs and Browsers',
'**Understanding URLs**
- URL = web address (e.g., www.google.com)
- https:// = secure connection
- .gov.in = Indian government site
- .edu = educational site

**Browser Basics**
Popular browsers: Chrome, Firefox, Edge, Safari
- **Address bar**: Type URLs here
- **Tabs**: Open multiple pages
- **Bookmarks**: Save favorite sites
- **History**: See visited sites

**Using Tabs**
- Ctrl+T: New tab
- Ctrl+W: Close tab
- Ctrl+Tab: Switch tabs
- Middle-click link: Open in new tab

**Common Mistakes and Tips**
- Typing in search bar instead of URL bar - Know the difference
- Too many tabs slow computer - Close unused tabs',
'{"title_en": "Web Addresses, Tabs and Browsers", "title_as": "ৱেব ঠিকনা আৰু ব্ৰাউজাৰ", "duration_minutes": 20}');

-- Topic 9.4: Accounts and Verification
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T9.4', 'en', 'curriculum', 'Accounts, OTPs and 2-Step Verification',
'**Creating Accounts**
1. Choose a unique username/email
2. Create a strong password
3. Verify via email/phone
4. Enable 2-step verification

**OTP (One Time Password)**
- Sent to your phone/email
- Valid for few minutes only
- NEVER share with anyone
- Banks/services use this for security

**2-Step Verification**
Extra security layer:
1. Enter password
2. Enter code from phone/app

**Why This Matters**
Even if someone gets your password, they cannot login without your phone.

**Common Mistakes and Tips**
- Sharing OTP with callers - No legitimate service asks for OTP
- Skipping 2-step verification - Always enable it for important accounts',
'{"title_en": "Accounts, OTPs and 2-Step Verification", "title_as": "একাউণ্ট আৰু OTP", "duration_minutes": 20}');

-- Topic 10.1: HTTPS and Security
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T10.1', 'en', 'curriculum', 'HTTPS and the Padlock (What it Means)',
'**The Padlock Symbol**
Look for the padlock icon in address bar:
- Padlock = connection is encrypted
- No padlock = data can be intercepted

**HTTPS vs HTTP**
- HTTPS: Secure (encrypted)
- HTTP: Not secure (avoid for sensitive sites)

**What Padlock DOES Mean**
- Your connection to site is encrypted
- Data cannot be easily intercepted

**What Padlock DOES NOT Mean**
- Does NOT mean the website is trustworthy
- Scam sites can also have padlock
- Always verify the actual website address

**When Padlock is Essential**
- Banking sites
- Shopping/payment
- Email login
- Government services

**Common Mistakes and Tips**
- Trusting any site with padlock - Check URL carefully too
- Entering passwords on HTTP sites - Never do this',
'{"title_en": "HTTPS and the Padlock", "title_as": "HTTPS আৰু সুৰক্ষা", "duration_minutes": 15}');

-- Topic 10.2: Online Scams
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T10.2', 'en', 'curriculum', 'Spotting Online Scams and Fake Pages',
'**Signs of Fake Websites**
- Misspelled URLs (gooogle.com, amazonn.in)
- Poor design, many spelling errors
- Asking for unusual information
- Unbelievable offers

**Common Online Scams**
1. **Lottery scams**: You won money you never entered for
2. **Job scams**: Pay us first for guaranteed job
3. **Romance scams**: Online friend asks for money
4. **Tech support scams**: Your computer has virus, call us

**How to Verify**
- Check URL carefully
- Search company name + scam
- Official sites usually .gov.in, verified accounts
- Call official numbers (not from the suspicious message)

**Cultural Analogy**
Like verifying a stranger asking for money in person, verify online requests too.

**Common Mistakes and Tips**
- Clicking links in messages - Type URL directly instead
- Believing urgent threats - Real services give time',
'{"title_en": "Spotting Online Scams", "title_as": "অনলাইন প্ৰতাৰণা চিনাক্ত", "duration_minutes": 20}');

-- Topic 10.3: Browser Privacy
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T10.3', 'en', 'curriculum', 'Browser Privacy Basics (History, Cookies, Permissions)',
'**Browser History**
- Records all sites you visit
- Clear regularly on shared computers
- Use Private/Incognito mode when needed

**Cookies**
- Small files websites store on your computer
- Remember login, preferences
- Can also track you across sites
- Clear periodically

**Site Permissions**
Sites may ask for:
- Location
- Camera/Microphone
- Notifications
- Downloads

Only allow what is necessary!

**Private/Incognito Mode**
- Does not save history
- Does not save cookies
- Good for shared computers
- Note: Your ISP can still see activity

**Common Mistakes and Tips**
- Allowing all permissions - Only allow what is needed
- Never clearing history on shared PC - Always clear when done',
'{"title_en": "Browser Privacy Basics", "title_as": "ব্ৰাউজাৰ গোপনীয়তা", "duration_minutes": 15}');

-- Topic 10.4: Safe Downloads
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T10.4', 'en', 'curriculum', 'Safe Downloads and Files from the Web',
'**Safe Download Rules**
1. Download only from official sites
2. Check file extension before opening
3. Scan with antivirus
4. Be extra careful with .exe files

**Dangerous File Types**
- .exe (programs - can contain virus)
- .bat, .cmd (scripts)
- .zip from unknown sources

**Safer File Types**
- .pdf (documents)
- .jpg, .png (images)
- .mp3, .mp4 (media)
But even these can be faked!

**Before Opening Downloads**
1. Did you expect this file?
2. Is it from trusted source?
3. Does the size seem right?
4. Has antivirus scanned it?

**Common Mistakes and Tips**
- Opening email attachments from strangers - Could be malware
- Downloading cracked software - Often contains virus',
'{"title_en": "Safe Downloads", "title_as": "সুৰক্ষিত ডাউনলোড", "duration_minutes": 15}');

-- Topic 11.1: Search Skills
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T11.1', 'en', 'curriculum', 'Smart Keywords and Operators',
'**Better Search Tips**

**Use Specific Keywords**
Bad: computer problem
Good: laptop not turning on after update

**Useful Search Tricks**
- Quotes for exact phrase: "digital literacy"
- Minus to exclude: apple -fruit
- Site specific: site:gov.in aadhaar
- File type: filetype:pdf study material

**Search Operators**
- OR: cats OR dogs
- AND: cats AND dogs (default)
- *: fill in blank - largest * in India

**Local Search Tips**
- Add location: schools near Guwahati
- Use local language terms when needed
- Try both English and regional terms

**Common Mistakes and Tips**
- Very long queries - Keep it simple and specific
- Only checking first result - Check multiple sources',
'{"title_en": "Smart Keywords and Operators", "title_as": "স্মাৰ্ট সন্ধান", "duration_minutes": 20}');

-- Topic 11.2: Verifying Information
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, metadata) VALUES
('M3', 'T11.2', 'en', 'curriculum', 'Check If Information Is Trustworthy',
'**How to Verify Information**

**The SIFT Method**
- **S**top: Do not share immediately
- **I**nvestigate: Who is the source?
- **F**ind better coverage: What do other sites say?
- **T**race: Find original source

**Signs of Reliable Sources**
- Author name and credentials listed
- Published date shown
- Sources/references provided
- Contact information available
- No excessive ads or clickbait

**Signs of Unreliable Sources**
- No author/date
- Sensational headlines
- Many spelling errors
- Only this site reports it
- Asking you to share urgently

**Fact-Checking Resources**
- factcheck.org
- altnews.in
- boomlive.in

**Cultural Wisdom**
Just as elders say verify before believing rumors, verify online information too.

**Common Mistakes and Tips**
- Believing because many shared - Viral is not verified
- Sharing before checking - Check first, share later',
'{"title_en": "Check If Information Is Trustworthy", "title_as": "তথ্য পৰীক্ষা কৰা", "duration_minutes": 20}');;
