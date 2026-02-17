-- Seed Practice Questions for Module 2: Operating Systems (Topics T4.1-T8.2)
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index) VALUES
-- T4.1: What is an Operating System
('T4.1', 'M2', 'What is an Operating System?', '["A game application", "Software that manages computer hardware and software", "A type of keyboard", "An internet browser"]', 1, 'An Operating System (OS) is software that manages hardware and provides services for programs. Examples: Windows, Android.', 'easy', 1),
('T4.1', 'M2', 'Which of these is an operating system?', '["Microsoft Word", "Google Chrome", "Windows 11", "WhatsApp"]', 2, 'Windows 11 is an OS. Word is word processor, Chrome is browser, WhatsApp is messaging app - all run ON an operating system.', 'easy', 2),
('T4.1', 'M2', 'Android is the operating system used in most:', '["Desktop computers", "Laptops", "Smartphones and tablets", "ATM machines"]', 2, 'Android is Google mobile operating system used in most smartphones and tablets worldwide.', 'easy', 3),

-- T4.2: Windows Basics
('T4.2', 'M2', 'The Taskbar in Windows is located:', '["At the top of screen", "At the bottom of screen", "On the left side", "It does not exist"]', 1, 'The Taskbar is at the bottom of the screen showing Start button, open programs, time, and system icons.', 'easy', 1),
('T4.2', 'M2', 'What does the Start Menu provide access to?', '["Only games", "Programs, settings, and power options", "Only internet", "Only files"]', 1, 'Start Menu is the gateway to all programs, settings, documents, and power options like Shut Down and Restart.', 'easy', 2),
('T4.2', 'M2', 'To minimize a window means to:', '["Close it permanently", "Hide it to taskbar without closing", "Make it full screen", "Delete its contents"]', 1, 'Minimizing hides the window to taskbar. The program keeps running and can be restored by clicking its taskbar icon.', 'easy', 3),

-- T5.1: File Explorer
('T5.1', 'M2', 'File Explorer is used to:', '["Browse the internet", "Navigate and manage files and folders", "Send emails", "Make video calls"]', 1, 'File Explorer (or Windows Explorer) lets you browse, organize, copy, move, and delete files and folders.', 'easy', 1),
('T5.1', 'M2', 'What does the address bar in File Explorer show?', '["Internet address", "Current folder location path", "Time and date", "Battery status"]', 1, 'The address bar shows the current folder path, like C:/Users/YourName/Documents. You can type paths directly.', 'medium', 2),
('T5.1', 'M2', 'Quick Access in File Explorer shows:', '["Only pictures", "Frequently used and pinned folders", "Only downloads", "System settings"]', 1, 'Quick Access shows your frequently used folders and items you have pinned for easy access.', 'easy', 3),

-- T5.2: Managing Files
('T5.2', 'M2', 'To rename a file, you can:', '["Double-click on it", "Right-click and select Rename", "Press Delete key", "Close File Explorer"]', 1, 'Right-click the file, select Rename, type new name, press Enter. You can also select file and press F2.', 'easy', 1),
('T5.2', 'M2', 'What happens when you delete a file?', '["It is permanently gone", "It goes to Recycle Bin first", "It gets copied", "It gets renamed"]', 1, 'Deleted files go to Recycle Bin first. You can restore them from there. Empty Recycle Bin to permanently delete.', 'easy', 2),
('T5.2', 'M2', 'Ctrl+C is the shortcut for:', '["Cut", "Copy", "Paste", "Delete"]', 1, 'Ctrl+C copies selected item. Ctrl+X cuts (move), Ctrl+V pastes, Delete key deletes.', 'easy', 3),

-- T6.1: Installing Apps
('T6.1', 'M2', 'Where should you download apps from safely?', '["Any website", "Official app stores (Play Store, Microsoft Store)", "Unknown email attachments", "Random pop-up ads"]', 1, 'Always use official stores like Play Store or Microsoft Store. They verify apps for safety.', 'easy', 1),
('T6.1', 'M2', 'When installing an app, you should check:', '["App permissions it requests", "How colorful the icon is", "The file size only", "Nothing, just install quickly"]', 0, 'Check permissions carefully. A calculator app should not need camera or contacts access - that is suspicious.', 'medium', 2),
('T6.1', 'M2', 'An APK file is:', '["A document file", "An Android app installation file", "A picture file", "A music file"]', 1, 'APK (Android Package) is the installation file format for Android apps. Be careful with APKs from outside Play Store.', 'medium', 3),

-- T6.2: Uninstalling Apps
('T6.2', 'M2', 'Why should you uninstall apps you do not use?', '["No reason", "To free up storage space and improve performance", "Apps expire after some time", "To avoid app updates"]', 1, 'Unused apps take up storage, may run in background using battery, and could pose security risks if not updated.', 'easy', 1),
('T6.2', 'M2', 'To uninstall an app on Android:', '["Delete its icon from home screen", "Go to Settings, Apps, select app, tap Uninstall", "Turn off the phone", "Clear its data only"]', 1, 'Go to Settings then Apps, find the app, tap Uninstall. Removing home screen icon does not uninstall the app.', 'easy', 2),

-- T7.1: Settings Overview
('T7.1', 'M2', 'Where can you change your phone display brightness?', '["Phone app", "Settings - Display", "Camera app", "Calculator"]', 1, 'Display brightness is in Settings under Display. You can also usually access quick settings by swiping down.', 'easy', 1),
('T7.1', 'M2', 'To connect to WiFi, you go to:', '["Settings - WiFi/Network", "Settings - Sound", "Gallery app", "File Manager"]', 0, 'WiFi settings are under Settings then WiFi or Network settings. Turn on WiFi and select your network.', 'easy', 2),
('T7.1', 'M2', 'Airplane mode:', '["Makes phone fly", "Turns off all wireless connections", "Only affects phone calls", "Increases internet speed"]', 1, 'Airplane mode disables WiFi, mobile data, and Bluetooth. Use during flights or to save battery.', 'easy', 3),

-- T7.2: Customization
('T7.2', 'M2', 'You can change your phone wallpaper in:', '["Phone app", "Settings - Wallpaper/Display", "Calculator", "Clock app"]', 1, 'Wallpaper settings are in Settings under Wallpaper or Display. You can also long-press home screen for options.', 'easy', 1),
('T7.2', 'M2', 'What is a widget?', '["A type of virus", "An app shortcut with live information on home screen", "A phone setting", "A type of file"]', 1, 'Widgets show live info on home screen without opening the app - like weather, calendar events, or clock.', 'easy', 2),
('T7.2', 'M2', 'To increase font size for better reading:', '["Buy a bigger phone", "Go to Settings - Display - Font Size", "Use magnifying glass", "Zoom in on each app"]', 1, 'Settings then Display then Font Size lets you increase text size across all apps for easier reading.', 'easy', 3),

-- T8.1: Software Updates
('T8.1', 'M2', 'Why are software updates important?', '["They change app colors", "They fix bugs and security issues", "They delete your data", "They slow down the phone"]', 1, 'Updates fix security vulnerabilities, bugs, and often add new features. Keep your devices updated.', 'easy', 1),
('T8.1', 'M2', 'Before updating your phone, you should:', '["Delete all apps", "Backup important data", "Remove SIM card", "Turn off the phone"]', 1, 'Always backup data before major updates. Use WiFi for downloads and ensure battery is at least 50%.', 'medium', 2),
('T8.1', 'M2', 'Auto-update for apps is useful because:', '["It costs money", "Apps stay current without manual checking", "It uses no data", "It deletes old apps"]', 1, 'Auto-update keeps apps current automatically. Enable on WiFi only to save mobile data.', 'easy', 3),

-- T8.2: Troubleshooting Basics
('T8.2', 'M2', 'If an app freezes, you should first try:', '["Buy a new phone", "Force close the app and reopen", "Delete all your photos", "Call customer care"]', 1, 'Force close from recent apps or Settings-Apps, then reopen. This solves most temporary app issues.', 'easy', 1),
('T8.2', 'M2', 'If your phone is running slowly, you can:', '["Close unused apps and clear cache", "Keep adding more apps", "Never turn it off", "Ignore the problem"]', 0, 'Close background apps, clear cache, delete unused apps, and restart phone periodically to maintain performance.', 'easy', 2),
('T8.2', 'M2', 'Restarting your device:', '["Deletes all your data", "Often fixes temporary glitches", "Is never necessary", "Damages the battery"]', 1, 'Restarting clears temporary memory and often fixes minor issues. It is safe and recommended regularly.', 'easy', 3);
;
