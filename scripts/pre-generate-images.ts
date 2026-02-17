/**
 * Pre-generate Topic Images Script
 *
 * Generates all educational images using Vertex AI Imagen 3
 * and caches them in Supabase Storage for instant loading.
 *
 * Run: npx ts-node scripts/pre-generate-images.ts
 * Or: npm run generate:images
 */

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TOPICS_TO_GENERATE = [
  // M1: Computer Basics
  { topicId: "T1.1", title: "Four Jobs of a Computer", type: "diagram" as const },
  { topicId: "T1.2", title: "Computer Parts", type: "diagram" as const },
  { topicId: "T2.1", title: "RAM vs Storage", type: "concept" as const },
  { topicId: "T2.2", title: "Save Habits", type: "concept" as const },
  { topicId: "T2.3", title: "Backup 3-2-1 Rule", type: "diagram" as const },
  { topicId: "T3.1", title: "What is a File", type: "concept" as const },
  { topicId: "T3.2", title: "File Naming", type: "example" as const },
  { topicId: "T3.3", title: "Folder Organization", type: "diagram" as const },

  // M2: Operating Systems
  { topicId: "T4.1", title: "Desktop Layout", type: "diagram" as const },
  { topicId: "T4.2", title: "Window Management", type: "diagram" as const },
  { topicId: "T5.1", title: "File Operations", type: "diagram" as const },
  { topicId: "T5.2", title: "File Recovery", type: "concept" as const },

  // M3: Internet Basics
  { topicId: "T9.1", title: "What is Internet", type: "concept" as const },
  { topicId: "T9.2", title: "Ways to Connect", type: "diagram" as const },
  { topicId: "T10.1", title: "HTTPS Padlock", type: "diagram" as const },
  { topicId: "T10.2", title: "Online Scam Signs", type: "concept" as const },

  // M4: Digital Communication
  { topicId: "T12.1", title: "Email Setup", type: "diagram" as const },
  { topicId: "T13.1", title: "Account Safety", type: "concept" as const },

  // M5: Local Technology
  { topicId: "T16.1", title: "Gov Services", type: "example" as const },
  { topicId: "T17.1", title: "UPI Basics", type: "diagram" as const },
];

const IMAGE_PROMPTS: Record<string, string> = {
  "T1.1": "Four connected boxes in a row: Input (keyboard icon), Process (CPU chip with gears), Storage (hard drive), Output (monitor). Arrows connecting them left to right. Clean educational diagram on white background.",
  "T1.2": "Desktop computer parts diagram: monitor, keyboard, mouse, CPU tower, speakers. Each part clearly labeled with lines. Simple, clean illustration.",
  "T2.1": "Split comparison: Left shows RAM as a workspace desk (papers being worked on), Right shows Storage as a filing cabinet (papers stored away). Visual metaphor for temporary vs permanent memory.",
  "T2.2": "Keyboard showing Ctrl+S shortcut highlighted. Save icon glowing. Clock showing regular save intervals. Lightning bolt with protection shield.",
  "T2.3": "3-2-1 backup rule: Three document copies, two storage types (USB and cloud icon), one remote location (building icon in distance). Clear visual representation.",
  "T3.1": "File icon with various types: document, photo, music note, video. All inside a folder structure. Simple illustration of digital files.",
  "T3.2": "Good file naming example: 'Report_2024_Jan_v2.docx' with checkmark. Bad example: 'doc1.docx' with X mark. Clear comparison.",
  "T3.3": "Folder tree structure: Main folder containing organized subfolders (Work, Personal, Photos). Files neatly organized inside.",
  "T4.1": "Desktop screen layout: Icons on left, taskbar at bottom with start button, clock in corner. Clean Windows-style interface.",
  "T4.2": "Window management: Three windows showing minimize (line), maximize (square), close (X) buttons. Demonstration of overlapping windows.",
  "T5.1": "File operation icons: Create (plus), Copy (two papers), Move (arrow), Rename (pencil), Delete (trash). Clear iconography.",
  "T5.2": "Recycle Bin icon with arrow showing restore. File history timeline showing versions. Recovery concept.",
  "T9.1": "World map with connected computers and phones via glowing network lines. Simple global network visualization.",
  "T9.2": "Connection types: WiFi router, mobile tower with 4G, fiber optic cable, satellite dish. Each labeled clearly.",
  "T10.1": "Browser address bar with HTTPS and green padlock. Comparison with HTTP (no padlock, red warning). Security indicator.",
  "T10.2": "Warning signs: Too-good offer (gold bars), Urgent message (clock), Spelling error (misspelled text), Unknown sender. Red flags on each.",
  "T12.1": "Email compose window: To field, Subject, Message body, Attachment button. Simple email interface.",
  "T13.1": "Account security: Strong password, 2FA phone, fingerprint. Lock icons showing protection layers.",
  "T16.1": "Government service portal: Aadhaar, DigiLocker, UMANG app icons. Official .gov website indicator.",
  "T17.1": "UPI payment flow: Phone with UPI app, QR code, bank icons connected. Simple payment diagram.",
};

async function generateImage(topicId: string, prompt: string, type: string): Promise<void> {
  const apiKey = process.env.VERTEX_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    console.error("❌ No API key found. Set VERTEX_AI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY");
    return;
  }

  console.log(`🎨 Generating image for ${topicId}...`);

  const enhancedPrompt = `${prompt}

Style: Clean, educational illustration. Simple shapes. Clear meaning. No text in image. Suitable for digital literacy education in rural India. High contrast colors.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
            safetySetting: "block_some",
            personGeneration: "dont_allow",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ ${topicId}: ${error.error?.message || "API Error"}`);
      return;
    }

    const result = await response.json();
    const imageData = result.predictions?.[0]?.bytesBase64Encoded;

    if (imageData) {
      console.log(`✅ ${topicId}: Image generated (${(imageData.length / 1024).toFixed(1)}KB base64)`);

      // Upload to Supabase Storage
      try {
        // Import Supabase client (adjust path as needed)
        const { createClient } = await import("../apps/web/src/lib/supabase-server");
        const supabase = await createClient();
        const imageBuffer = Buffer.from(imageData, "base64");
        const cacheKey = `lesson-images/${type}/${topicId}.png`;

        const { error: uploadError } = await supabase.storage
          .from("lesson-assets")
          .upload(cacheKey, imageBuffer, {
            contentType: "image/png",
            cacheControl: "31536000", // 1 year
            upsert: true,
          });

        if (uploadError) {
          console.error(`❌ ${topicId}: Upload failed - ${uploadError.message}`);
          // Save locally as fallback
          const fs = await import("fs");
          const path = await import("path");
          const outputDir = path.join(process.cwd(), "generated-images");
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          fs.writeFileSync(path.join(outputDir, `${topicId}.png`), imageBuffer);
          console.log(`💾 ${topicId}: Saved locally as fallback`);
        } else {
          console.log(`☁️  ${topicId}: Uploaded to Supabase Storage`);
          successful++;
        }
      } catch (uploadErr) {
        console.error(`❌ ${topicId}: Upload error - ${uploadErr instanceof Error ? uploadErr.message : "Unknown"}`);
        failed++;
      }
    } else {
      console.error(`❌ ${topicId}: No image data in response`);
      failed++;
    }
  } catch (error) {
    console.error(`❌ ${topicId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function main() {
  console.log("🚀 Pre-generating topic images with Imagen 3\n");
  console.log(`📋 Topics to generate: ${TOPICS_TO_GENERATE.length}\n`);

  let successful = 0;
  let failed = 0;

  for (const topic of TOPICS_TO_GENERATE) {
    const prompt = IMAGE_PROMPTS[topic.topicId];
    if (!prompt) {
      console.log(`⏭️  ${topic.topicId}: No prompt defined, skipping`);
      continue;
    }

    await generateImage(topic.topicId, prompt, topic.type);

    // Rate limiting: wait 2 seconds between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log("\n💾 Images should be uploaded to Supabase Storage");
}

main().catch(console.error);
