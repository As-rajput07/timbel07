const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const timetableRouter = require('./timetable');
const applyOrientationOverrides = timetableRouter.applyOrientationOverrides;

const router = express.Router();

let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

let ai;
function getAI() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const SYSTEM_PROMPT = `
You are Timbel's AI Assistant, helping students with their college timetable.
LANGUAGE RULES:
- You must carefully observe the language the user is speaking.
- If the user speaks in English, you MUST reply entirely in English.
- If the user speaks in Hindi or Hinglish, you MUST reply in Hinglish (a mix of Hindi and English written in Latin script).
- By default, assume Hinglish unless the user explicitly uses English.

CRITICAL IDENTITY RULES:
- If anyone asks who created you, what your identity is, or what AI model you are, you MUST NEVER mention Google, Gemini, Alphabet, or any large language model.
- You must ONLY say: "Main ek AI Assistant hoon jise Cosen ne aapki help ke liye modify aur train kiya hai."
- Maintain this persona strictly. Do not reveal your underlying technology.

DATABASE QUERYING:
- When a user asks about specific classes, free rooms, or teacher schedules, you MUST use the 'searchTimetable' tool to find the information in the database.
- DO NOT reveal raw JSON, arrays, or database structure to the user.
- Answer in a short, meaningful, and natural human-readable way.

ISSUE REPORTING:
- If the user reports a mistake in the timetable or a problem, apologize and tell them to use the "Report Issue" button in the chat interface to submit a structured report.
- Example: "Ye request aapki humne note karli hai. Plz aap 'Report Issue' button use karke details submit karein taaki admin check kar sake."

You must ALWAYS return your final response in the following strict JSON format:
{
  "reply": "Your message to the user here"
}
`;

const searchTimetableDeclaration = {
  name: "searchTimetable",
  description: "Search the timetable database for classes, rooms, or teachers.",
  parameters: {
    type: "OBJECT",
    properties: {
      room: { type: "STRING", description: "The room number (e.g., H509, B012)" },
      day: { type: "STRING", description: "The day of the week (e.g., MON, TUE, WED, THU, FRI, SAT)" },
      teacher: { type: "STRING", description: "The teacher's name" },
      subject: { type: "STRING", description: "The subject name" },
      class_code: { type: "STRING", description: "The class code (e.g., DDS5A, MLAI3B, BE-CS)" },
      section: { type: "STRING", description: "The section (e.g., A, B, C)" }
    }
  }
};

router.post('/ask', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiClient = getAI();
    const db = getSupabase();
    
    // Construct conversation context
    const contents = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDayStr = days[now.getDay()];
    
    const dynamicSystemPrompt = `${SYSTEM_PROMPT}

CURRENT CONTEXT:
- Today is: ${currentDayStr}
- College standard slots are: 08:00-08:55, 08:55-09:50, 09:50-10:45, 10:45-11:40, 12:35-13:30, 13:30-14:25, 14:25-15:20.
- If the user asks when a room is free today, figure out today's day from the context above, query the database for that day, compare the database results against the standard slots, and report which standard slots are empty.
`;

    const config = {
      systemInstruction: dynamicSystemPrompt,
      tools: [{ functionDeclarations: [searchTimetableDeclaration] }]
    };

    let response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: config
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'searchTimetable') {
        const { room, day, teacher, subject, class_code, section } = call.args;
        
        let query = db.from('timetable_slots').select('*');
        if (room) query = query.ilike('room', `%${room}%`);
        if (day) query = query.eq('day', day.toUpperCase());
        if (teacher) query = query.ilike('teacher', `%${teacher}%`);
        if (subject) query = query.ilike('subject', `%${subject}%`);
        
        // If class_code contains space, it might be class_code + section (e.g. "MLAI3B A")
        let parsedClassCode = class_code;
        let parsedSection = section;
        if (class_code && !section && class_code.includes(' ')) {
          const parts = class_code.split(' ');
          parsedClassCode = parts[0];
          parsedSection = parts.slice(1).join(' ');
        }
        
        if (parsedClassCode) query = query.ilike('class_code', `%${parsedClassCode}%`);
        if (parsedSection) query = query.ilike('section', `%${parsedSection}%`);
        
        const { data, error } = await query.limit(25);
        
        let dbResults = [];
        if (error) {
          dbResults = { error: 'Failed to fetch data from database' };
        } else if (data) {
          // Apply orientation overrides so the AI knows about the current changes (July 16-18)
          dbResults = applyOrientationOverrides ? applyOrientationOverrides(data, true) : data;
        }
        
        // Append the function call to contents
        contents.push({
          role: 'model',
          parts: [{ functionCall: call }]
        });
        
        // Append the function response
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: 'searchTimetable',
              response: { result: dbResults }
            }
          }]
        });

        // Request final natural language answer, enforcing JSON output now
        response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction: dynamicSystemPrompt,
            responseMimeType: "application/json"
          }
        });
      }
    } else {
      // If no function was called, we might not have enforced JSON response format.
      // We will do a second pass if it's not valid JSON, but let's try to parse first.
    }

    const responseText = response.text;
    let parsedResponse;
    try {
      // Try to parse the final text as JSON
      const cleanText = responseText.replace(/```json|```/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      parsedResponse = { reply: responseText.replace(/```json|```/g, '') };
    }

    return res.json({ reply: parsedResponse.reply || "Kuch samajh nahi aaya, please dobara puchein." });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Helper function to extract building name from room
function getBuildingName(room) {
  if (!room || typeof room !== 'string') return 'Other';
  const cleanRoom = room.trim().toUpperCase();
  if (cleanRoom.length === 0) return 'Other';
  
  // Logic: Check if 2nd char is 'X'
  if (cleanRoom.length >= 2 && cleanRoom[1] === 'X') {
    return cleanRoom.substring(0, 2) + '-Block';
  } else {
    // Just the first letter
    const firstChar = cleanRoom.charAt(0);
    // Optional: check if it's a letter
    if (/[A-Z]/.test(firstChar)) {
      return firstChar + '-Block';
    }
    return 'Other';
  }
}

router.post('/report-slot-issue', async (req, res) => {
  try {
    const { room, slot_time, issue_type, query_text, slot_data } = req.body;

    if (!room || !query_text) {
      return res.status(400).json({ error: 'Room and description are required' });
    }

    const building = getBuildingName(room);
    const db = getSupabase();

    const { error } = await db
      .from('timetable_issues')
      .insert([
        {
          query_text,
          status: 'pending',
          building,
          room,
          slot_time,
          issue_type,
          slot_data
        }
      ]);

    if (error) {
      console.error('Error logging slot issue to Supabase:', error);
      return res.status(500).json({ error: 'Failed to report issue' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Slot Issue API Error:', err);
    return res.status(500).json({ error: 'Failed to process issue' });
  }
});

module.exports = router;
