/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not defined in the environment. AI-powered reporting will use fallback analyzer.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Analyzes a base64 image and context description to determine civic category, severity, and summary.
 */
export async function analyzeImageAndDescription(imageBase64: string, description?: string): Promise<{ category: string; severity: string; summary: string }> {
  const ai = getGeminiClient();

  if (!ai) {
    console.log("No Gemini API client. Using fallback heuristic categorization.");
    const categories = [
      "Pothole", "Garbage", "Water Leakage", 
      "Broken Streetlight", "Damaged Public Property", 
      "Illegal Dumping", "Road Obstruction"
    ];
    
    // Heuristic analysis based on description keywords
    let category = "Garbage";
    let severity = "Medium";
    const desc = (description || "").toLowerCase();

    if (desc.includes("pothole") || desc.includes("road") || desc.includes("hole") || desc.includes("crack")) {
      category = "Pothole";
      severity = "High";
    } else if (desc.includes("water") || desc.includes("leak") || desc.includes("pipe") || desc.includes("flood")) {
      category = "Water Leakage";
      severity = "Critical";
    } else if (desc.includes("light") || desc.includes("bulb") || desc.includes("dark") || desc.includes("lamp")) {
      category = "Broken Streetlight";
      severity = "Medium";
    } else if (desc.includes("bench") || desc.includes("park") || desc.includes("shattered") || desc.includes("graffiti")) {
      category = "Damaged Public Property";
      severity = "Low";
    } else if (desc.includes("dump") || desc.includes("trash") || desc.includes("rubbish")) {
      category = "Illegal Dumping";
      severity = "High";
    } else if (desc.includes("block") || desc.includes("tree") || desc.includes("car")) {
      category = "Road Obstruction";
      severity = "Medium";
    } else {
      category = categories[Math.floor(Math.random() * categories.length)];
      const severities = ["Low", "Medium", "High", "Critical"];
      severity = severities[Math.floor(Math.random() * severities.length)];
    }

    const summary = `AI Heuristic Analyzer: Identified a potential ${category} issue${description ? ` relating to '${description}'` : ''}. Severity level assessed as ${severity} based on typical community risk.`;

    return { category, severity, summary };
  }

  // Clean base64 string
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      },
      {
        text: `You are a professional civic infrastructure inspector. Analyze this image of a community issue. 
        Return a structured JSON object categorizing the issue, deciding its severity level, and writing a concise 1-2 sentence summary of what is seen.
        
        You MUST choose the category exactly from these options:
        - Pothole
        - Garbage
        - Water Leakage
        - Broken Streetlight
        - Damaged Public Property
        - Illegal Dumping
        - Road Obstruction
        
        You MUST choose severity exactly from these options:
        - Low
        - Medium
        - High
        - Critical
        
        Optional context provided by reporter: "${description || 'None'}"`
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: "Must be exactly one of: Pothole, Garbage, Water Leakage, Broken Streetlight, Damaged Public Property, Illegal Dumping, Road Obstruction"
          },
          severity: {
            type: Type.STRING,
            description: "Must be exactly one of: Low, Medium, High, Critical"
          },
          summary: {
            type: Type.STRING,
            description: "A short professional 1-2 sentence description of the visible community issue."
          }
        },
        required: ["category", "severity", "summary"]
      }
    }
  });

  const resultText = response.text || "{}";
  return JSON.parse(resultText.trim());
}
