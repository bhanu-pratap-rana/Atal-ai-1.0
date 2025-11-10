// Pre-Assessment Question Pool
// 30 questions total: 6 from each of 5 modules
// Available in English, Hindi, and Assamese

export interface AssessmentQuestion {
  id: string
  module: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  question: {
    en: string
    hi: string
    as: string
  }
  options: {
    en: string[]
    hi: string[]
    as: string[]
  }
  correctAnswer: number // Index of correct answer (0-3)
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Module 1: Basic Computer Operations (6 questions)
  {
    id: 'basic-01',
    module: 'basic-computer',
    difficulty: 'beginner',
    question: {
      en: 'What is the main function of a computer mouse?',
      hi: 'कंप्यूटर माउस का मुख्य कार्य क्या है?',
      as: 'কম্পিউটাৰ মাউছৰ মুখ্য কাম কি?',
    },
    options: {
      en: [
        'To point and click on items on the screen',
        'To type text',
        'To print documents',
        'To connect to the internet',
      ],
      hi: [
        'स्क्रीन पर वस्तुओं को इंगित और क्लिक करना',
        'टेक्स्ट टाइप करना',
        'दस्तावेज़ प्रिंट करना',
        'इंटरनेट से कनेक्ट करना',
      ],
      as: [
        'স্ক্ৰীনত থকা বস্তুবোৰ নিৰ্দেশ আৰু ক্লিক কৰা',
        'টেক্সট টাইপ কৰা',
        'নথিপত্ৰ প্ৰিন্ট কৰা',
        'ইণ্টাৰনেটৰ সৈতে সংযোগ কৰা',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'basic-02',
    module: 'basic-computer',
    difficulty: 'beginner',
    question: {
      en: 'Which key is used to delete text to the left of the cursor?',
      hi: 'कर्सर के बाईं ओर के टेक्स्ट को हटाने के लिए किस कुंजी का उपयोग किया जाता है?',
      as: 'কাৰ্চাৰৰ বাওঁফালৰ টেক্সট মচিবলৈ কোনটো কী ব্যৱহাৰ কৰা হয়?',
    },
    options: {
      en: ['Delete', 'Backspace', 'Enter', 'Shift'],
      hi: ['Delete', 'Backspace', 'Enter', 'Shift'],
      as: ['Delete', 'Backspace', 'Enter', 'Shift'],
    },
    correctAnswer: 1,
  },
  {
    id: 'basic-03',
    module: 'basic-computer',
    difficulty: 'beginner',
    question: {
      en: 'What does "Ctrl + C" do?',
      hi: '"Ctrl + C" क्या करता है?',
      as: '"Ctrl + C" কি কৰে?',
    },
    options: {
      en: ['Copy selected text', 'Cut selected text', 'Paste text', 'Save file'],
      hi: [
        'चयनित टेक्स्ट की प्रतिलिपि बनाएं',
        'चयनित टेक्स्ट काटें',
        'टेक्स्ट पेस्ट करें',
        'फ़ाइल सहेजें',
      ],
      as: [
        'নিৰ্বাচিত টেক্সট কপি কৰক',
        'নিৰ্বাচিত টেক্সট কাট কৰক',
        'টেক্সট পেষ্ট কৰক',
        'ফাইল সংৰক্ষণ কৰক',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'basic-04',
    module: 'basic-computer',
    difficulty: 'beginner',
    question: {
      en: 'Which device is used to input sound into a computer?',
      hi: 'कंप्यूटर में ध्वनि इनपुट करने के लिए किस उपकरण का उपयोग किया जाता है?',
      as: 'কম্পিউটাৰত শব্দ ইনপুট কৰিবলৈ কোনটো ডিভাইচ ব্যৱহাৰ কৰা হয়?',
    },
    options: {
      en: ['Microphone', 'Speaker', 'Keyboard', 'Monitor'],
      hi: ['माइक्रोफोन', 'स्पीकर', 'कीबोर्ड', 'मॉनिटर'],
      as: ['মাইক্ৰফোন', 'স্পীকাৰ', 'কীবৰ্ড', 'মনিটৰ'],
    },
    correctAnswer: 0,
  },
  {
    id: 'basic-05',
    module: 'basic-computer',
    difficulty: 'beginner',
    question: {
      en: 'What is the desktop in a computer?',
      hi: 'कंप्यूटर में डेस्कटॉप क्या है?',
      as: 'কম্পিউটাৰত ডেস্কটপ কি?',
    },
    options: {
      en: [
        'The main screen showing icons and files',
        'A type of computer',
        'A software program',
        'A hardware component',
      ],
      hi: [
        'आइकन और फ़ाइलें दिखाने वाली मुख्य स्क्रीन',
        'एक प्रकार का कंप्यूटर',
        'एक सॉफ़्टवेयर प्रोग्राम',
        'एक हार्डवेयर घटक',
      ],
      as: [
        'আইকন আৰু ফাইল দেখুওৱা মুখ্য স্ক্ৰীন',
        'এক প্ৰকাৰৰ কম্পিউটাৰ',
        'এটা চফ্টৱেৰ প্ৰগ্ৰাম',
        'এটা হাৰ্ডৱেৰ উপাদান',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'basic-06',
    module: 'basic-computer',
    difficulty: 'beginner',
    question: {
      en: 'What does RAM stand for?',
      hi: 'RAM का पूर्ण रूप क्या है?',
      as: 'RAM ৰ সম্পূৰ্ণ ৰূপ কি?',
    },
    options: {
      en: [
        'Random Access Memory',
        'Read Access Memory',
        'Run Application Mode',
        'Rapid Action Module',
      ],
      hi: [
        'Random Access Memory',
        'Read Access Memory',
        'Run Application Mode',
        'Rapid Action Module',
      ],
      as: [
        'Random Access Memory',
        'Read Access Memory',
        'Run Application Mode',
        'Rapid Action Module',
      ],
    },
    correctAnswer: 0,
  },

  // Module 2: Internet Basics (6 questions)
  {
    id: 'internet-01',
    module: 'internet-basics',
    difficulty: 'beginner',
    question: {
      en: 'What does WWW stand for?',
      hi: 'WWW का पूर्ण रूप क्या है?',
      as: 'WWW ৰ সম্পূৰ্ণ ৰূপ কি?',
    },
    options: {
      en: [
        'World Wide Web',
        'World Wide Window',
        'Web Wide World',
        'Wide World Web',
      ],
      hi: [
        'World Wide Web',
        'World Wide Window',
        'Web Wide World',
        'Wide World Web',
      ],
      as: [
        'World Wide Web',
        'World Wide Window',
        'Web Wide World',
        'Wide World Web',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'internet-02',
    module: 'internet-basics',
    difficulty: 'beginner',
    question: {
      en: 'Which of these is a web browser?',
      hi: 'इनमें से कौन एक वेब ब्राउज़र है?',
      as: 'এইবোৰৰ ভিতৰত কোনটো ৱেব ব্ৰাউজাৰ?',
    },
    options: {
      en: ['Google Chrome', 'Microsoft Word', 'Adobe Photoshop', 'WhatsApp'],
      hi: ['Google Chrome', 'Microsoft Word', 'Adobe Photoshop', 'WhatsApp'],
      as: ['Google Chrome', 'Microsoft Word', 'Adobe Photoshop', 'WhatsApp'],
    },
    correctAnswer: 0,
  },
  {
    id: 'internet-03',
    module: 'internet-basics',
    difficulty: 'beginner',
    question: {
      en: 'What is a search engine used for?',
      hi: 'सर्च इंजन का उपयोग किसलिए किया जाता है?',
      as: 'চাৰ্চ ইঞ্জিন কিহৰ বাবে ব্যৱহাৰ কৰা হয়?',
    },
    options: {
      en: [
        'To find information on the internet',
        'To create websites',
        'To send emails',
        'To download files',
      ],
      hi: [
        'इंटरनेट पर जानकारी खोजने के लिए',
        'वेबसाइट बनाने के लिए',
        'ईमेल भेजने के लिए',
        'फ़ाइलें डाउनलोड करने के लिए',
      ],
      as: [
        'ইণ্টাৰনেটত তথ্য বিচাৰিবলৈ',
        'ৱেবছাইট সৃষ্টি কৰিবলৈ',
        'ইমেইল প্ৰেৰণ কৰিবলৈ',
        'ফাইল ডাউনলোড কৰিবলৈ',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'internet-04',
    module: 'internet-basics',
    difficulty: 'beginner',
    question: {
      en: 'What does URL stand for?',
      hi: 'URL का पूर्ण रूप क्या है?',
      as: 'URL ৰ সম্পূৰ্ণ ৰূপ কি?',
    },
    options: {
      en: [
        'Uniform Resource Locator',
        'Universal Resource Link',
        'Uniform Routing Language',
        'Universal Reading Link',
      ],
      hi: [
        'Uniform Resource Locator',
        'Universal Resource Link',
        'Uniform Routing Language',
        'Universal Reading Link',
      ],
      as: [
        'Uniform Resource Locator',
        'Universal Resource Link',
        'Uniform Routing Language',
        'Universal Reading Link',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'internet-05',
    module: 'internet-basics',
    difficulty: 'beginner',
    question: {
      en: 'Which symbol is commonly used in email addresses?',
      hi: 'ईमेल पते में आमतौर पर किस प्रतीक का उपयोग किया जाता है?',
      as: 'ইমেইল ঠিকনাত সাধাৰণতে কোনটো চিহ্ন ব্যৱহাৰ কৰা হয়?',
    },
    options: {
      en: ['@ (at symbol)', '# (hash)', '& (ampersand)', '* (asterisk)'],
      hi: ['@ (at symbol)', '# (hash)', '& (ampersand)', '* (asterisk)'],
      as: ['@ (at symbol)', '# (hash)', '& (ampersand)', '* (asterisk)'],
    },
    correctAnswer: 0,
  },
  {
    id: 'internet-06',
    module: 'internet-basics',
    difficulty: 'beginner',
    question: {
      en: 'What does "download" mean?',
      hi: '"डाउनलोड" का क्या अर्थ है?',
      as: '"ডাউনলোড" ৰ অৰ্থ কি?',
    },
    options: {
      en: [
        'Copying files from the internet to your computer',
        'Sending files to the internet',
        'Deleting files from your computer',
        'Opening a file',
      ],
      hi: [
        'इंटरनेट से अपने कंप्यूटर पर फ़ाइलें कॉपी करना',
        'इंटरनेट पर फ़ाइलें भेजना',
        'अपने कंप्यूटर से फ़ाइलें हटाना',
        'फ़ाइल खोलना',
      ],
      as: [
        'ইণ্টাৰনেটৰ পৰা আপোনাৰ কম্পিউটাৰলৈ ফাইল কপি কৰা',
        'ইণ্টাৰনেটলৈ ফাইল প্ৰেৰণ কৰা',
        'আপোনাৰ কম্পিউটাৰৰ পৰা ফাইল মচি পেলোৱা',
        'ফাইল খোলা',
      ],
    },
    correctAnswer: 0,
  },

  // Module 3: Digital Safety (6 questions)
  {
    id: 'safety-01',
    module: 'digital-safety',
    difficulty: 'beginner',
    question: {
      en: 'What is a strong password?',
      hi: 'एक मजबूत पासवर्ड क्या है?',
      as: 'এটা শক্তিশালী পাছৱৰ্ড কি?',
    },
    options: {
      en: [
        'A mix of letters, numbers, and symbols',
        'Your name',
        'Your birthday',
        'The word "password"',
      ],
      hi: [
        'अक्षरों, संख्याओं और प्रतीकों का मिश्रण',
        'आपका नाम',
        'आपकी जन्मतिथि',
        '"password" शब्द',
      ],
      as: [
        'আখৰ, সংখ্যা আৰু চিহ্নৰ মিশ্ৰণ',
        'আপোনাৰ নাম',
        'আপোনাৰ জন্মদিন',
        '"password" শব্দ',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'safety-02',
    module: 'digital-safety',
    difficulty: 'beginner',
    question: {
      en: 'What should you do if you receive a suspicious email?',
      hi: 'यदि आपको कोई संदिग्ध ईमेल प्राप्त हो तो आपको क्या करना चाहिए?',
      as: 'যদি আপুনি সন্দেহজনক ইমেইল পায়, তেন্তে আপুনি কি কৰিব লাগে?',
    },
    options: {
      en: [
        'Do not click any links and delete it',
        'Click all links to see what happens',
        'Reply with your personal information',
        'Forward it to all your contacts',
      ],
      hi: [
        'कोई लिंक न क्लिक करें और इसे डिलीट कर दें',
        'क्या होता है यह देखने के लिए सभी लिंक क्लिक करें',
        'अपनी व्यक्तिगत जानकारी के साथ जवाब दें',
        'इसे अपने सभी संपर्कों को भेजें',
      ],
      as: [
        'কোনো লিংকত ক্লিক নকৰিব আৰু ইয়াক মচি পেলাওক',
        'কি হয় চাবলৈ সকলো লিংকত ক্লিক কৰক',
        'আপোনাৰ ব্যক্তিগত তথ্যৰে উত্তৰ দিয়ক',
        'ইয়াক আপোনাৰ সকলো যোগাযোগলৈ ফৰৱাৰ্ড কৰক',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'safety-03',
    module: 'digital-safety',
    difficulty: 'beginner',
    question: {
      en: 'What is phishing?',
      hi: 'फ़िशिंग क्या है?',
      as: 'ফিশিং কি?',
    },
    options: {
      en: [
        'Fake emails trying to steal personal information',
        'A type of computer game',
        'A way to catch fish online',
        'A method to speed up internet',
      ],
      hi: [
        'व्यक्तिगत जानकारी चुराने की कोशिश करने वाले नकली ईमेल',
        'एक प्रकार का कंप्यूटर गेम',
        'ऑनलाइन मछली पकड़ने का एक तरीका',
        'इंटरनेट को तेज करने का एक तरीका',
      ],
      as: [
        'ব্যক্তিগত তথ্য চুৰি কৰিবলৈ চেষ্টা কৰা নকল ইমেইল',
        'এক প্ৰকাৰৰ কম্পিউটাৰ গেম',
        'অনলাইনত মাছ ধৰাৰ উপায়',
        'ইণ্টাৰনেট দ্ৰুত কৰাৰ পদ্ধতি',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'safety-04',
    module: 'digital-safety',
    difficulty: 'beginner',
    question: {
      en: 'What should you do before sharing information online?',
      hi: 'ऑनलाइन जानकारी साझा करने से पहले आपको क्या करना चाहिए?',
      as: 'অনলাইনত তথ্য শ্বেয়াৰ কৰাৰ আগতে আপুনি কি কৰিব লাগে?',
    },
    options: {
      en: [
        'Think about who might see it',
        'Share everything without thinking',
        'Never use the internet',
        'Tell everyone your password',
      ],
      hi: [
        'सोचें कि इसे कौन देख सकता है',
        'बिना सोचे सब कुछ साझा करें',
        'कभी भी इंटरनेट का उपयोग न करें',
        'सभी को अपना पासवर्ड बताएं',
      ],
      as: [
        'চিন্তা কৰক কোনে ইয়াক চাব পাৰে',
        'নাভাবি সকলো শ্বেয়াৰ কৰক',
        'কেতিয়াও ইণ্টাৰনেট ব্যৱহাৰ নকৰিব',
        'সকলোকে আপোনাৰ পাছৱৰ্ড কওক',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'safety-05',
    module: 'digital-safety',
    difficulty: 'beginner',
    question: {
      en: 'What is antivirus software used for?',
      hi: 'एंटीवायरस सॉफ़्टवेयर का उपयोग किस लिए किया जाता है?',
      as: 'এণ্টিভাইৰাছ চফ্টৱেৰ কিহৰ বাবে ব্যৱহাৰ কৰা হয়?',
    },
    options: {
      en: [
        'To protect computer from viruses and malware',
        'To create documents',
        'To browse the internet',
        'To send emails',
      ],
      hi: [
        'वायरस और मैलवेयर से कंप्यूटर की रक्षा करने के लिए',
        'दस्तावेज़ बनाने के लिए',
        'इंटरनेट ब्राउज़ करने के लिए',
        'ईमेल भेजने के लिए',
      ],
      as: [
        'ভাইৰাছ আৰু মেলৱেৰৰ পৰা কম্পিউটাৰ সুৰক্ষিত কৰিবলৈ',
        'নথিপত্ৰ সৃষ্টি কৰিবলৈ',
        'ইণ্টাৰনেট ব্ৰাউজ কৰিবলৈ',
        'ইমেইল প্ৰেৰণ কৰিবলৈ',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'safety-06',
    module: 'digital-safety',
    difficulty: 'beginner',
    question: {
      en: 'Why should you not share your password with others?',
      hi: 'आपको अपना पासवर्ड दूसरों के साथ क्यों साझा नहीं करना चाहिए?',
      as: 'আপুনি আপোনাৰ পাছৱৰ্ড আনৰ সৈতে কিয় শ্বেয়াৰ কৰিব নালাগে?',
    },
    options: {
      en: [
        'They might misuse your account',
        'It makes the password stronger',
        'Everyone should know passwords',
        'It helps remember the password',
      ],
      hi: [
        'वे आपके खाते का दुरुपयोग कর सकते हैं',
        'यह पासवर्ड को मजबूत बनाता है',
        'सभी को पासवर्ड पता होना चाहिए',
        'यह पासवर्ड याद रखने में मदद करता है',
      ],
      as: [
        'তেওঁলোকে আপোনাৰ একাউণ্ট অপব্যৱহাৰ কৰিব পাৰে',
        'ই পাছৱৰ্ড শক্তিশালী কৰে',
        'সকলোৱে পাছৱৰ্ড জানিব লাগে',
        'ই পাছৱৰ্ড মনত ৰখাত সহায় কৰে',
      ],
    },
    correctAnswer: 0,
  },

  // Module 4: Digital Communication (6 questions)
  {
    id: 'comm-01',
    module: 'digital-communication',
    difficulty: 'beginner',
    question: {
      en: 'What is email?',
      hi: 'ईमेल क्या है?',
      as: 'ইমেইল কি?',
    },
    options: {
      en: [
        'Electronic mail sent over the internet',
        'A type of mobile phone',
        'A computer game',
        'A printer',
      ],
      hi: [
        'इंटरनेट पर भेजा गया इलेक्ट्रॉनिक मेल',
        'एक प्रकार का मोबाइल फोन',
        'एक कंप्यूटर गेम',
        'एक प्रिंटर',
      ],
      as: [
        'ইণ্টাৰনেটৰ জৰিয়তে প্ৰেৰণ কৰা ইলেক্ট্ৰনিক মেইল',
        'এক প্ৰকাৰৰ মবাইল ফোন',
        'এটা কম্পিউটাৰ গেম',
        'এটা প্ৰিণ্টাৰ',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'comm-02',
    module: 'digital-communication',
    difficulty: 'beginner',
    question: {
      en: 'What does CC mean in email?',
      hi: 'ईमेल में CC का क्या अर्थ है?',
      as: 'ইমেইলত CC ৰ অৰ্থ কি?',
    },
    options: {
      en: ['Carbon Copy', 'Computer Code', 'Copy Content', 'Create Copy'],
      hi: ['Carbon Copy', 'Computer Code', 'Copy Content', 'Create Copy'],
      as: ['Carbon Copy', 'Computer Code', 'Copy Content', 'Create Copy'],
    },
    correctAnswer: 0,
  },
  {
    id: 'comm-03',
    module: 'digital-communication',
    difficulty: 'beginner',
    question: {
      en: 'Which is an example of a video calling app?',
      hi: 'वीडियो कॉलिंग ऐप का उदाहरण कौन सा है?',
      as: 'ভিডিঅ কলিং এপৰ উদাহৰণ কোনটো?',
    },
    options: {
      en: ['Zoom', 'Notepad', 'Paint', 'Calculator'],
      hi: ['Zoom', 'Notepad', 'Paint', 'Calculator'],
      as: ['Zoom', 'Notepad', 'Paint', 'Calculator'],
    },
    correctAnswer: 0,
  },
  {
    id: 'comm-04',
    module: 'digital-communication',
    difficulty: 'beginner',
    question: {
      en: 'What is instant messaging?',
      hi: 'तत्काल संदेश क्या है?',
      as: 'তাৎক্ষণিক বাৰ্তা কি?',
    },
    options: {
      en: [
        'Real-time text communication',
        'Delayed email delivery',
        'Voice calling',
        'File storage',
      ],
      hi: [
        'वास्तविक समय पाठ संचार',
        'विलंबित ईमेल वितरण',
        'वॉयस कॉलिंग',
        'फ़ाइल भंडारण',
      ],
      as: [
        'বাস্তৱ সময়ৰ পাঠ যোগাযোগ',
        'বিলম্বিত ইমেইল প্ৰেৰণ',
        'ভইচ কলিং',
        'ফাইল সংৰক্ষণ',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'comm-05',
    module: 'digital-communication',
    difficulty: 'beginner',
    question: {
      en: 'What does it mean to "attach" a file to an email?',
      hi: 'ईमेल में फ़ाइल "संलग्न" करने का क्या अर्थ है?',
      as: 'ইমেইলত ফাইল "সংলগ্ন" কৰাৰ অৰ্থ কি?',
    },
    options: {
      en: [
        'To send a file along with the email',
        'To delete the email',
        'To print the email',
        'To save the email',
      ],
      hi: [
        'ईमेल के साथ एक फ़ाइल भेजना',
        'ईमेल को हटाना',
        'ईमेल प्रिंट करना',
        'ईमेल सहेजना',
      ],
      as: [
        'ইমেইলৰ সৈতে ফাইল প্ৰেৰণ কৰা',
        'ইমেইল মচি পেলোৱা',
        'ইমেইল প্ৰিন্ট কৰা',
        'ইমেইল সংৰক্ষণ কৰা',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'comm-06',
    module: 'digital-communication',
    difficulty: 'beginner',
    question: {
      en: 'What is proper email etiquette?',
      hi: 'उचित ईमेल शिष्टाचार क्या है?',
      as: 'যথাযথ ইমেইল শিষ্টাচাৰ কি?',
    },
    options: {
      en: [
        'Using polite language and clear subject lines',
        'Writing in ALL CAPS',
        'Not checking spelling',
        'Sending emails late at night',
      ],
      hi: [
        'विनम्र भाषा और स्पष्ट विषय पंक्तियों का उपयोग',
        'ALL CAPS में लिखना',
        'वर्तनी की जाँच नहीं करना',
        'देर रात ईमेल भेजना',
      ],
      as: [
        'শিষ্ট ভাষা আৰু স্পষ্ট বিষয় শাৰী ব্যৱহাৰ',
        'ALL CAPS ত লিখা',
        'বানান পৰীক্ষা নকৰা',
        'নিশা পলমকৈ ইমেইল প্ৰেৰণ',
      ],
    },
    correctAnswer: 0,
  },

  // Module 5: Digital Literacy Skills (6 questions)
  {
    id: 'literacy-01',
    module: 'digital-literacy',
    difficulty: 'beginner',
    question: {
      en: 'What is a PDF file?',
      hi: 'PDF फ़ाइल क्या है?',
      as: 'PDF ফাইল কি?',
    },
    options: {
      en: [
        'A document format that preserves formatting',
        'A type of image',
        'A video file',
        'An audio file',
      ],
      hi: [
        'एक दस्तावेज़ प्रारूप जो स्वरूपण को संरक्षित रखता है',
        'एक प्रकार की छवि',
        'एक वीडियो फ़ाइल',
        'एक ऑडियो फ़ाइल',
      ],
      as: [
        'এটা নথিপত্ৰ বিন্যাস যি ফৰমেটিং সংৰক্ষণ কৰে',
        'এক প্ৰকাৰৰ ছবি',
        'এটা ভিডিঅ ফাইল',
        'এটা অডিঅ ফাইল',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'literacy-02',
    module: 'digital-literacy',
    difficulty: 'beginner',
    question: {
      en: 'What is cloud storage?',
      hi: 'क्लाउड स्टोरेज क्या है?',
      as: 'ক্লাউড ষ্টৰেজ কি?',
    },
    options: {
      en: [
        'Storing files on the internet',
        'Storing files in the sky',
        'A type of hard drive',
        'A weather service',
      ],
      hi: [
        'इंटरनेट पर फ़ाइलें संग्रहीत करना',
        'आकाश में फ़ाइलें संग्रहीत करना',
        'एक प्रकार की हार्ड ड्राइव',
        'एक मौसम सेवा',
      ],
      as: [
        'ইণ্টাৰনেটত ফাইল সংৰক্ষণ কৰা',
        'আকাশত ফাইল সংৰক্ষণ কৰা',
        'এক প্ৰকাৰৰ হাৰ্ড ড্ৰাইভ',
        'এটা বতৰ সেৱা',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'literacy-03',
    module: 'digital-literacy',
    difficulty: 'beginner',
    question: {
      en: 'What does it mean to "bookmark" a website?',
      hi: 'वेबसाइट को "बुकमार्क" करने का क्या अर्थ है?',
      as: 'ৱেবছাইট "বুকমাৰ্ক" কৰাৰ অৰ্থ কি?',
    },
    options: {
      en: [
        'To save the website for easy access later',
        'To print the website',
        'To delete the website',
        'To share the website',
      ],
      hi: [
        'बाद में आसान पहुंच के लिए वेबसाइट सहेजना',
        'वेबसाइट प्रिंट करना',
        'वेबसाइट हटाना',
        'वेबसाइट साझा करना',
      ],
      as: [
        'পিছত সহজ প্ৰৱেশৰ বাবে ৱেবছাইট সংৰক্ষণ কৰা',
        'ৱেবছাইট প্ৰিন্ট কৰা',
        'ৱেবছাইট মচি পেলোৱা',
        'ৱেবছাইট শ্বেয়াৰ কৰা',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'literacy-04',
    module: 'digital-literacy',
    difficulty: 'beginner',
    question: {
      en: 'What is a screenshot?',
      hi: 'स्क्रीनशॉट क्या है?',
      as: 'স্ক্ৰীণশ্বট কি?',
    },
    options: {
      en: [
        'A picture of what is on your screen',
        'A video recording',
        'A type of game',
        'A printer setting',
      ],
      hi: [
        'आपकी स्क्रीन पर क्या है इसकी एक तस्वीर',
        'एक वीडियो रिकॉर्डिंग',
        'एक प्रकार का गेम',
        'एक प्रिंटर सेटिंग',
      ],
      as: [
        'আপোনাৰ স্ক্ৰীনত কি আছে তাৰ ছবি',
        'এটা ভিডিঅ ৰেকৰ্ডিং',
        'এক প্ৰকাৰৰ গেম',
        'এটা প্ৰিণ্টাৰ ছেটিং',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'literacy-05',
    module: 'digital-literacy',
    difficulty: 'beginner',
    question: {
      en: 'What is an operating system?',
      hi: 'ऑपरेटिंग सिस्टम क्या है?',
      as: 'অপাৰেটিং চিষ্টেম কি?',
    },
    options: {
      en: [
        'Software that manages computer hardware and software',
        'A type of application',
        'An internet browser',
        'A computer game',
      ],
      hi: [
        'सॉफ़्टवेयर जो कंप्यूटर हार्डवेयर और सॉफ़्टवेयर का प्रबंधन करता है',
        'एक प्रकार का एप्लिकेशन',
        'एक इंटरनेट ब्राउज़र',
        'एक कंप्यूटर गेम',
      ],
      as: [
        'চফ্টৱেৰ যি কম্পিউটাৰ হাৰ্ডৱেৰ আৰু চফ্টৱেৰ পৰিচালনা কৰে',
        'এক প্ৰকাৰৰ এপ্লিকেশ্যন',
        'এটা ইণ্টাৰনেট ব্ৰাউজাৰ',
        'এটা কম্পিউটাৰ গেম',
      ],
    },
    correctAnswer: 0,
  },
  {
    id: 'literacy-06',
    module: 'digital-literacy',
    difficulty: 'beginner',
    question: {
      en: 'What does "Ctrl + V" do?',
      hi: '"Ctrl + V" क्या करता है?',
      as: '"Ctrl + V" কি কৰে?',
    },
    options: {
      en: ['Paste copied content', 'Copy content', 'Cut content', 'Save file'],
      hi: [
        'कॉपी की गई सामग्री पेस्ट करें',
        'सामग्री कॉपी करें',
        'सामग्री काटें',
        'फ़ाइल सहेजें',
      ],
      as: [
        'কপি কৰা সমল পেষ্ট কৰক',
        'সমল কপি কৰক',
        'সমল কাট কৰক',
        'ফাইল সংৰক্ষণ কৰক',
      ],
    },
    correctAnswer: 0,
  },
]

// Helper function to get questions by language
export function getQuestionsByLanguage(
  lang: 'en' | 'hi' | 'as'
): Array<{
  id: string
  module: string
  question: string
  options: string[]
  correctAnswer: number
}> {
  return ASSESSMENT_QUESTIONS.map((q) => ({
    id: q.id,
    module: q.module,
    question: q.question[lang],
    options: q.options[lang],
    correctAnswer: q.correctAnswer,
  }))
}

// Helper function to shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
