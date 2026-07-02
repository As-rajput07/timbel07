const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const searchTimetableDeclaration = {
  name: "searchTimetable",
  description: "Search the timetable database for classes, rooms, or teachers.",
  parameters: {
    type: "OBJECT",
    properties: {
      room: { type: "STRING" },
      day: { type: "STRING" }
    }
  }
};

async function run() {
  try {
    const contents = [{ role: 'user', parts: [{ text: "aaj MLAI3B A KE kon kon se lacture he?" }] }];
    let response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        tools: [{ functionDeclarations: [searchTimetableDeclaration] }]
      }
    });
    console.log("functionCalls:", response.functionCalls);
  } catch (err) {
    console.error(err);
  }
}
run();
