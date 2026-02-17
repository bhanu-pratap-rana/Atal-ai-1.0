-- Seed Practice Questions for Module 1: Computer Basics (Topics T1.1-T3.5)
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index) VALUES
-- T1.1: What is a Computer?
('T1.1', 'M1', 'What is the main function of a computer?', '["To make phone calls only", "To process information and perform tasks", "To play music only", "To take photographs only"]', 1, 'A computer is a machine that processes information and performs various tasks like calculations, storing data, and running programs.', 'easy', 1),
('T1.1', 'M1', 'Which of these is an example of computer hardware?', '["Microsoft Word", "Keyboard", "Google Chrome", "WhatsApp"]', 1, 'Hardware refers to physical parts you can touch. Keyboard is hardware, while Word, Chrome, and WhatsApp are software.', 'easy', 2),
('T1.1', 'M1', 'A smartphone is a type of computer. True or False?', '["True", "False"]', 0, 'True! A smartphone is a small portable computer that can make calls, browse internet, and run applications.', 'easy', 3),

-- T1.2: Parts of a Computer
('T1.2', 'M1', 'Which part of the computer is called the brain?', '["Monitor", "Keyboard", "CPU (Processor)", "Mouse"]', 2, 'The CPU (Central Processing Unit) is called the brain of the computer because it processes all instructions and calculations.', 'easy', 1),
('T1.2', 'M1', 'What is the function of RAM in a computer?', '["Permanent storage", "Temporary working memory", "Display output", "Input device"]', 1, 'RAM (Random Access Memory) is temporary working memory that holds data the computer is currently using. It clears when turned off.', 'medium', 2),
('T1.2', 'M1', 'Which device is used to display output from the computer?', '["Keyboard", "Mouse", "Monitor", "Speaker"]', 2, 'The monitor is the primary display device that shows visual output from the computer.', 'easy', 3),

-- T2.1: Input Devices
('T2.1', 'M1', 'Which of these is an input device?', '["Monitor", "Printer", "Keyboard", "Speaker"]', 2, 'Input devices send data TO the computer. Keyboard sends your typing to the computer. Monitor, printer, and speakers are output devices.', 'easy', 1),
('T2.1', 'M1', 'What does a mouse help you do?', '["Print documents", "Point and click on screen items", "Store files", "Connect to internet"]', 1, 'A mouse is a pointing device that lets you move a cursor on screen and click to select items or perform actions.', 'easy', 2),
('T2.1', 'M1', 'A scanner is used to:', '["Print photos", "Convert physical documents to digital", "Play music", "Connect to WiFi"]', 1, 'A scanner converts physical documents and images into digital format that can be stored and edited on computer.', 'medium', 3),

-- T2.2: Output Devices
('T2.2', 'M1', 'Which device produces printed copies of documents?', '["Scanner", "Keyboard", "Printer", "Webcam"]', 2, 'A printer is an output device that produces physical copies of digital documents on paper.', 'easy', 1),
('T2.2', 'M1', 'Speakers are used to:', '["Input voice", "Output sound", "Store music", "Connect keyboard"]', 1, 'Speakers are output devices that produce sound from the computer, like music, videos, and notifications.', 'easy', 2),
('T2.2', 'M1', 'Which is NOT an output device?', '["Monitor", "Printer", "Microphone", "Headphones"]', 2, 'Microphone is an input device (sends sound TO computer). Monitor, printer, and headphones send information FROM computer to you.', 'medium', 3),

-- T2.3: Storage Devices
('T2.3', 'M1', 'Where does a computer store files permanently?', '["RAM", "Hard Drive/SSD", "Monitor", "Keyboard"]', 1, 'Hard drives and SSDs store files permanently. Unlike RAM, data stays saved even when computer is turned off.', 'easy', 1),
('T2.3', 'M1', 'What is a Pen Drive used for?', '["Typing documents", "Portable file storage", "Displaying images", "Playing games"]', 1, 'A Pen Drive (USB Flash Drive) is a small portable storage device for carrying and transferring files between computers.', 'easy', 2),
('T2.3', 'M1', 'Which storage has the largest capacity typically?', '["Pen Drive (32GB)", "Hard Drive (1TB)", "CD (700MB)", "Memory Card (64GB)"]', 1, 'Hard drives typically have the largest storage. 1TB = 1000GB, much more than pen drives, CDs, or memory cards.', 'medium', 3),

-- T3.1: Turning On/Off
('T3.1', 'M1', 'What is the correct way to turn off a computer?', '["Press power button directly", "Unplug the power cord", "Use Shut Down option from Start menu", "Close the monitor lid"]', 2, 'Always use Shut Down from Start menu. This safely closes programs and saves data before turning off.', 'easy', 1),
('T3.1', 'M1', 'What happens if you force shut down by holding power button?', '["Computer shuts down safely", "Unsaved work may be lost", "Computer restarts automatically", "Nothing happens"]', 1, 'Force shutdown can cause unsaved work to be lost and may damage files. Only use in emergencies when computer freezes.', 'medium', 2),

-- T3.2: Using Mouse
('T3.2', 'M1', 'What does double-clicking do?', '["Deletes a file", "Opens a file or program", "Copies a file", "Moves a file"]', 1, 'Double-clicking (two quick clicks) typically opens files, folders, or programs.', 'easy', 1),
('T3.2', 'M1', 'Right-clicking on an item shows:', '["Nothing", "A menu with options", "The item gets deleted", "The item gets copied"]', 1, 'Right-clicking opens a context menu with options like Copy, Paste, Delete, Rename, and Properties.', 'easy', 2),
('T3.2', 'M1', 'What is drag and drop?', '["Clicking once on file", "Holding click and moving item to new location", "Double clicking on folder", "Right clicking on desktop"]', 1, 'Drag and drop means holding the mouse button while moving an item to a new location, then releasing.', 'medium', 3),

-- T3.3: Using Keyboard
('T3.3', 'M1', 'Which key is used to type capital letters?', '["Ctrl", "Alt", "Shift", "Tab"]', 2, 'Hold Shift while pressing a letter to type it in capital. Caps Lock keeps all letters capital until pressed again.', 'easy', 1),
('T3.3', 'M1', 'What does the Enter key do?', '["Deletes text", "Starts a new line or confirms action", "Copies text", "Closes program"]', 1, 'Enter starts a new line when typing or confirms/submits an action in forms and dialogs.', 'easy', 2),
('T3.3', 'M1', 'The Backspace key:', '["Deletes character to the right", "Deletes character to the left", "Moves cursor down", "Saves the document"]', 1, 'Backspace deletes the character to the LEFT of the cursor. Delete key removes character to the RIGHT.', 'easy', 3),

-- T3.4: Desktop and Icons
('T3.4', 'M1', 'What is the Desktop?', '["A physical table", "The main screen after Windows starts", "A type of folder", "An application"]', 1, 'The Desktop is the main screen you see after Windows starts, where you can place shortcuts and files.', 'easy', 1),
('T3.4', 'M1', 'What does an icon represent?', '["Decoration only", "A shortcut to file, folder, or program", "Virus warning", "Internet connection"]', 1, 'Icons are small pictures representing files, folders, or programs. Double-click to open them.', 'easy', 2),
('T3.4', 'M1', 'Where is the Start button typically located?', '["Top right corner", "Bottom left corner", "Center of screen", "Top left corner"]', 1, 'In Windows, the Start button is at the bottom left corner. Click it to access programs and settings.', 'easy', 3),

-- T3.5: Files and Folders
('T3.5', 'M1', 'What is a folder used for?', '["Playing music", "Organizing and storing files", "Connecting to internet", "Typing documents"]', 1, 'Folders help organize files, like folders in a filing cabinet. You can create folders inside folders for better organization.', 'easy', 1),
('T3.5', 'M1', 'How do you create a new folder?', '["Double-click on desktop", "Right-click, select New, then Folder", "Press Delete key", "Click Start button"]', 1, 'Right-click on empty space, select New from menu, then click Folder. Type a name and press Enter.', 'easy', 2),
('T3.5', 'M1', 'What does copying a file do?', '["Deletes the original file", "Creates a duplicate while keeping original", "Renames the file", "Opens the file"]', 1, 'Copying creates a duplicate. The original stays in place, and you can paste the copy elsewhere.', 'medium', 3);
;
