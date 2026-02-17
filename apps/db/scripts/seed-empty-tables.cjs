/**
 * Seed empty tables with relevant test data
 */

const url = 'https://hnlsqznoviwnyrkskfay.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubHNxem5vdml3bnlya3NrZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUwMTM3NiwiZXhwIjoyMDc4MDc3Mzc2fQ.cm9trOy1x_oxoBzAz57vYyOV4VsfGlTPlZsoqvmaxXg';

// Known IDs from database
const classId = 'f4aef0b5-1e73-4276-a6ac-4269bfd4152b';
const teacherId = '26c2eca8-b810-4a53-9cb0-e18917e3549b';
const studentIds = [
  '0fd9a81f-28ba-4961-a72c-04040c393885', // Bhanu Pratap Rana
  '3f0744a5-2535-486c-a96e-61ad1274d6a3'  // Avnish Kumar
];

async function insertData(table, data) {
  const r = await fetch(url + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!r.ok) {
    const err = await r.text();
    console.error('Error inserting into ' + table + ':', err);
    return null;
  }
  return r.json();
}

async function main() {
  console.log('=== Seeding class_announcements ===');
  
  const announcements = [
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Welcome to Digital Literacy! / डिजिटल साक्षरता में आपका स्वागत है!',
      body: `Dear Students,

Welcome to our Digital Literacy course! This week we will learn about:
- Basic computer parts (keyboard, mouse, monitor)
- How to turn on and shut down a computer safely
- File and folder basics

प्रिय छात्रों,
डिजिटल साक्षरता पाठ्यक्रम में आपका स्वागत है! इस सप्ताह हम सीखेंगे कंप्यूटर के बुनियादी भागों के बारे में।

Remember: Practice makes perfect! 🖥️`,
      priority: 'high',
      is_pinned: true
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Module 1 Assessment Next Week',
      body: `Hello Class 9!

We will have our first assessment on Module 1 (Computer Basics) next Monday.

Topics to review:
• Input devices (keyboard, mouse)
• Output devices (monitor, printer)
• Storage devices (hard disk, USB)
• CPU and its functions

Use the AI Tutor to practice! Ask questions in Hindi, English, or Assamese.

গোটেই সপ্তাহত ভালদৰে প্ৰস্তুতি কৰক!`,
      priority: 'urgent',
      is_pinned: false
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Internet Safety Tips / इंटरनेट सुरक्षा',
      body: `Important Safety Tips:

1. Never share your password with anyone
2. Do not click on unknown links
3. Ask a parent or teacher before downloading anything
4. Be respectful online - treat others as you want to be treated

कभी भी अपना पासवर्ड किसी के साथ साझा न करें। अज्ञात लिंक पर क्लिक न करें।

Stay safe online! 🛡️`,
      priority: 'normal',
      is_pinned: false
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Congratulations to Our Top Learners!',
      body: `Congratulations to the students who completed Module 1 with excellent scores!

🏆 Keep up the great work!

Remember, learning is a journey. If you need help, use the AI Tutor - it is available in Hindi (हिंदी), English, and Assamese (অসমীয়া).

Next week we start Module 2: Working with Files and Folders.`,
      priority: 'normal',
      is_pinned: false
    }
  ];
  
  const insertedAnnouncements = await insertData('class_announcements', announcements);
  console.log('Inserted', insertedAnnouncements?.length || 0, 'announcements');
  
  // Store announcement IDs for reads
  const announcementIds = insertedAnnouncements?.map(a => a.id) || [];
  
  console.log('\n=== Seeding class_materials ===');
  
  const materials = [
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Computer Parts Diagram / कंप्यूटर के भाग',
      description: `A visual guide showing all the basic parts of a computer with labels in English and Hindi. Perfect for revision!

कंप्यूटर के सभी बुनियादी भागों को दिखाने वाला एक दृश्य मार्गदर्शिका।`,
      material_type: 'image',
      external_url: 'https://example.com/computer-parts-diagram.png',
      module_id: 'M1',
      topic_id: 'T1.1'
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Keyboard Shortcuts Cheat Sheet',
      description: `Essential keyboard shortcuts every student should know:
• Ctrl+C = Copy
• Ctrl+V = Paste
• Ctrl+S = Save
• Ctrl+Z = Undo

Download and keep near your computer!`,
      material_type: 'document',
      external_url: 'https://example.com/keyboard-shortcuts.pdf',
      module_id: 'M1',
      topic_id: 'T1.2'
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'How to Create a Folder - Video Tutorial',
      description: `Step-by-step video showing how to create, rename, and organize folders on your computer. Duration: 5 minutes.

फ़ोल्डर कैसे बनाएं - वीडियो ट्यूटोरियल`,
      material_type: 'video',
      external_url: 'https://youtube.com/watch?v=example',
      module_id: 'M2',
      topic_id: 'T2.1'
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Internet Safety Guide for Students',
      description: `A comprehensive guide on staying safe online. Topics covered:
- Password safety
- Identifying fake websites
- Social media safety
- Cyberbullying prevention

इंटरनेट सुरक्षा गाइड`,
      material_type: 'document',
      external_url: 'https://example.com/internet-safety-guide.pdf',
      module_id: 'M3',
      topic_id: 'T3.1'
    },
    {
      class_id: classId,
      teacher_id: teacherId,
      title: 'Practice Exercise: File Management',
      description: 'Interactive exercise to practice creating folders and organizing files. Complete this before the assessment!',
      material_type: 'link',
      external_url: 'https://example.com/practice-exercise',
      module_id: 'M2',
      topic_id: 'T2.2'
    }
  ];
  
  const insertedMaterials = await insertData('class_materials', materials);
  console.log('Inserted', insertedMaterials?.length || 0, 'materials');
  
  console.log('\n=== Seeding announcement_reads ===');
  
  // Create reads for first 2 announcements by both students
  if (announcementIds.length >= 2) {
    const reads = [
      { announcement_id: announcementIds[0], student_id: studentIds[0] },
      { announcement_id: announcementIds[0], student_id: studentIds[1] },
      { announcement_id: announcementIds[1], student_id: studentIds[0] }
    ];
    const insertedReads = await insertData('announcement_reads', reads);
    console.log('Inserted', insertedReads?.length || 0, 'announcement reads');
  }
  
  console.log('\n=== Seeding student_badges ===');
  
  const badges = [
    { student_id: studentIds[0], badge_id: 'first_steps', earned_at: new Date().toISOString() },
    { student_id: studentIds[0], badge_id: 'curious_mind', earned_at: new Date().toISOString() },
    { student_id: studentIds[1], badge_id: 'first_steps', earned_at: new Date().toISOString() },
    { student_id: studentIds[1], badge_id: 'voice_learner', earned_at: new Date().toISOString() }
  ];
  
  const insertedBadges = await insertData('student_badges', badges);
  console.log('Inserted', insertedBadges?.length || 0, 'student badges');
  
  console.log('\n=== Seeding points_history ===');
  
  const points = [
    { student_id: studentIds[0], points: 50, reason: 'Completed first lesson', source_type: 'badge', source_id: 'first_steps' },
    { student_id: studentIds[0], points: 150, reason: 'Asked 20+ questions to AI tutor', source_type: 'badge', source_id: 'curious_mind' },
    { student_id: studentIds[0], points: 25, reason: 'Completed Module 1 Assessment', source_type: 'assessment', source_id: 'M1' },
    { student_id: studentIds[1], points: 50, reason: 'Completed first lesson', source_type: 'badge', source_id: 'first_steps' },
    { student_id: studentIds[1], points: 100, reason: 'Used voice features 10+ times', source_type: 'badge', source_id: 'voice_learner' },
    { student_id: studentIds[1], points: 20, reason: 'Daily login streak bonus', source_type: 'streak', source_id: 'daily_login' }
  ];
  
  const insertedPoints = await insertData('points_history', points);
  console.log('Inserted', insertedPoints?.length || 0, 'points history records');
  
  console.log('\n=== DONE ===');
}

main().catch(console.error);
