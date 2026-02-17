-- Seed Practice Questions for Module 3: Internet Basics (Topics T9.1-T11.2)
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index) VALUES
-- T9.1: What is Internet
('T9.1', 'M3', 'What is the Internet?', '["A single computer", "A global network connecting millions of computers", "A software program", "A type of cable"]', 1, 'The Internet is a worldwide network connecting billions of devices, allowing them to communicate and share information.', 'easy', 1),
('T9.1', 'M3', 'Which of these requires internet connection?', '["Calculator app", "Watching YouTube videos", "Playing offline games", "Taking photos"]', 1, 'YouTube requires internet to stream videos. Calculator, offline games, and camera work without internet.', 'easy', 2),
('T9.1', 'M3', 'WWW stands for:', '["World Wide Web", "Western Web World", "Wireless Web World", "World Web Wireless"]', 0, 'WWW stands for World Wide Web - the system of websites and pages accessible through the internet.', 'easy', 3),

-- T9.2: Connecting to Internet
('T9.2', 'M3', 'WiFi connects to internet using:', '["Cables only", "Radio waves wirelessly", "Bluetooth", "USB cable"]', 1, 'WiFi uses radio waves to connect devices wirelessly to a router, which connects to the internet.', 'easy', 1),
('T9.2', 'M3', 'Mobile data uses:', '["WiFi signals", "Cellular network from your SIM provider", "Satellite only", "Bluetooth connection"]', 1, 'Mobile data uses cellular networks (2G/3G/4G/5G) from your mobile provider through the SIM card.', 'easy', 2),
('T9.2', 'M3', 'Which typically provides faster speed at lower cost?', '["Mobile data", "WiFi at home", "Both are same", "Public WiFi"]', 1, 'Home WiFi usually offers faster speeds and is cheaper than mobile data for heavy usage.', 'medium', 3),

-- T9.3: Web Browsers
('T9.3', 'M3', 'A web browser is used to:', '["Make phone calls", "View websites on the internet", "Edit photos", "Send SMS messages"]', 1, 'Web browsers like Chrome, Firefox, and Edge let you view and interact with websites on the internet.', 'easy', 1),
('T9.3', 'M3', 'Which of these is a web browser?', '["WhatsApp", "Google Chrome", "Microsoft Word", "VLC Player"]', 1, 'Google Chrome is a web browser. WhatsApp is messaging, Word is document editing, VLC is media player.', 'easy', 2),
('T9.3', 'M3', 'The address bar in a browser shows:', '["Your phone number", "Website URL/address", "Time and date", "Battery percentage"]', 1, 'The address bar shows and lets you type website URLs like www.google.com or www.facebook.com.', 'easy', 3),

-- T10.1: Searching the Web
('T10.1', 'M3', 'A search engine helps you:', '["Make video calls", "Find information on the internet", "Edit documents", "Send emails"]', 1, 'Search engines like Google, Bing help you find websites and information by typing keywords.', 'easy', 1),
('T10.1', 'M3', 'Which is a popular search engine?', '["Facebook", "Google", "WhatsApp", "YouTube"]', 1, 'Google is the most popular search engine. Facebook is social media, WhatsApp is messaging, YouTube is video platform.', 'easy', 2),
('T10.1', 'M3', 'To get better search results, you should:', '["Type very long sentences", "Use specific keywords", "Use only one word always", "Search in a different language"]', 1, 'Use specific keywords. Instead of searching how to make tea, try Assamese milk tea recipe for better results.', 'medium', 3),

-- T10.2: Search Tips
('T10.2', 'M3', 'Using quotes in a search like "Muga silk weaving" will:', '["Show random results", "Search for that exact phrase", "Translate the words", "Delete the search history"]', 1, 'Quotes make Google search for that exact phrase together, not individual words scattered across pages.', 'medium', 1),
('T10.2', 'M3', 'To search only on a specific website, you use:', '["website.com search term", "site:website.com search term", "www.website.com search", "@website search term"]', 1, 'Use site:website.com before your search. Example: site:amazon.in Muga silk saree searches only Amazon India.', 'medium', 2),
('T10.2', 'M3', 'Google Voice Search lets you:', '["Only make calls", "Search by speaking instead of typing", "Record voice messages", "Change voice settings"]', 1, 'Voice Search lets you speak your query instead of typing. Tap the microphone icon in Google search bar.', 'easy', 3),

-- T11.1: Safe Browsing
('T11.1', 'M3', 'A secure website URL starts with:', '["http://", "https://", "www.", "ftp://"]', 1, 'HTTPS (with S for Secure) means the connection is encrypted. Look for padlock icon. Always use HTTPS for banking.', 'easy', 1),
('T11.1', 'M3', 'You should avoid clicking on:', '["Links from trusted contacts", "Links in suspicious emails promising prizes", "Official website links", "Search results from Google"]', 1, 'Avoid suspicious links promising prizes, lottery wins, or urgent action. These are often phishing attempts.', 'easy', 2),
('T11.1', 'M3', 'Public WiFi is risky for:', '["Reading news", "Banking and password entry", "Checking weather", "Looking at maps"]', 1, 'Avoid banking or entering passwords on public WiFi. Hackers can intercept data on unsecured networks.', 'medium', 3),

-- T11.2: Downloads
('T11.2', 'M3', 'Downloaded files are usually saved in:', '["Camera folder", "Downloads folder", "Contacts", "Messages"]', 1, 'Downloaded files go to the Downloads folder by default. Check File Explorer or Files app to find them.', 'easy', 1),
('T11.2', 'M3', 'You should only download from:', '["Any website that offers free things", "Trusted official sources and stores", "Email attachments from strangers", "Pop-up advertisements"]', 1, 'Download only from official sources like Play Store, Microsoft Store, or trusted websites to avoid malware.', 'easy', 2),
('T11.2', 'M3', 'If a download seems suspicious, you should:', '["Open it immediately", "Delete it without opening", "Share it with friends", "Ignore your antivirus warning"]', 1, 'Delete suspicious files without opening. Never ignore antivirus warnings. When in doubt, do not open.', 'easy', 3);
;
