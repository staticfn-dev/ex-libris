
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { PaperMetadata } from "../types";

const COMMON_PROMPT_INSTRUCTIONS = `
    2.  **Title**: Identify the title of the paper.
    3.  **Abstract**: Write a **summary** of the paper's abstract in your own words.
        - **STRICTLY FORBIDDEN**: Do NOT copy the abstract text verbatim. This causes copyright errors.
        - **REQUIRED**: specific scientific details (Background, Methods, Results, Conclusion) must be rewritten/paraphrased.
        - **IMPORTANT**: Escape any double quotes (") inside the text with a backslash (\\") to ensure valid JSON.
    4.  **Authors**: List ALL authors found on the paper. Do not shorten the list (e.g. do not use "et al").
    5.  **Journal & Date**:
        - Extract the **Journal Name** (e.g., "Nature", "arXiv", "CVPR").
        - Extract the **Publish Date** (e.g., "September 2023", "2024-01-15").
    6.  **Topic, Sub-topic & Tags**:
        - **Main Topic**: Identify the single most relevant field (e.g., Neuroscience, Immunology, Biology).
        - **Sub-topic**: Identify the specific sub-field (e.g., Cognitive Neuroscience, T-Cell Biology).
        - **Tags**: Generate a list of 3-5 specific keywords. Include the corresponding author's name, key molecules, or organism models.

    **CRITICAL OUTPUT RULES**:
    1. Return ONLY a valid JSON object.
    2. Do NOT use markdown code blocks (e.g., \`\`\`json).
    3. Do NOT include any introductory or concluding text (e.g., "Here is the JSON").
    4. Ensure the output is valid JSON syntax.
    
    Structure:
    {
      "title": "Title",
      "summary": "Paraphrased Abstract or Summary",
      "authors": ["Author 1", "Author 2"],
      "journal": "Journal Name",
      "publishDate": "Publish Date",
      "topic": "Selected Main Topic",
      "subTopic": "Selected Sub-topic",
      "tags": ["Keyword 1", "Keyword 2", "Corresponding Author", "Organism"],
      "foundUrl": "https://..." (Only if requested to find a URL)
    }
`;

// Use string literals for maximum compatibility and to ensure BLOCK_NONE is applied correctly
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE }
];

export const analyzePaperUrl = async (url: string): Promise<PaperMetadata> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    I have a research paper URL: "${url}".
    
    Your task is to identify this specific paper and extract its metadata.
    
    1.  **Search**: Use the Google Search tool to find the official page for this URL. Ensure you are looking at the correct paper that corresponds to this link.
    ${COMMON_PROMPT_INSTRUCTIONS}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        safetySettings: SAFETY_SETTINGS,
      }
    });

    if (!response.text) {
      console.warn("Gemini returned empty text. Response:", response);
      // Even if blocked, try to parse if there is any candidate text, otherwise throw
      if (response.candidates && response.candidates.length > 0) {
          const reason = response.candidates[0].finishReason;
          if (reason !== 'STOP') {
             // If recitation blocked it, throw a helpful error
             if (reason === 'RECITATION') {
                throw new Error("The AI service blocked the response due to copyright (RECITATION). The paper's text might be protected. Please try adding the paper via PDF upload instead.");
             }
             throw new Error(`The AI service blocked the response (Reason: ${reason}). The paper might be behind a strict paywall or triggered sensitive content filters.`);
          }
      }
      throw new Error("The AI service returned an empty response. Please check if the URL is accessible and points to a valid paper.");
    }

    const metadata = parseResponse(response.text);
    return metadata;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze paper. Please check the URL or try again.");
  }
};

export const analyzePaperPdf = async (base64Pdf: string): Promise<PaperMetadata & { url?: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    I have attached a research paper PDF.
    
    Your task is to identify this paper, extract its metadata, AND find its official online source.
    
    1.  **Identify & Search**: Analyze the PDF content. Then, use Google Search to find the official DOI link or permanent publisher URL (e.g. arxiv.org, nature.com, ieee.org) for this specific paper.
    2.  **Output URL**: Include the found URL in the "foundUrl" field of the JSON response.
    ${COMMON_PROMPT_INSTRUCTIONS}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          },
          { text: prompt }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }],
        safetySettings: SAFETY_SETTINGS,
      }
    });

    if (!response.text) {
        console.warn("Gemini returned empty text for PDF analysis. Response:", response);
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason !== 'STOP') {
           throw new Error(`The AI service blocked the response (Reason: ${response.candidates[0].finishReason}).`);
        }
        throw new Error("The AI service returned an empty response for the PDF.");
    }

    const data = parseResponse(response.text);
    
    return {
      ...data,
      url: (data as any).foundUrl // Map the foundUrl to the standard url field
    };
  } catch (error: any) {
    console.error("Gemini PDF Analysis Error Details:", error);
    
    let errorMessage = "Failed to analyze PDF.";
    if (error.message?.includes("413") || error.message?.includes("too large")) {
      errorMessage = "PDF file is too large. Please try a smaller file (under 10MB).";
    } else if (error.message?.includes("JSON")) {
      errorMessage = "AI response parsing failed. Please try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

const parseResponse = (text: string | undefined): PaperMetadata => {
  if (!text) {
    throw new Error("No response received from AI service.");
  }

  // Improved cleanup strategy
  let jsonString = text.trim();
  
  // 1. Try to extract from Markdown code blocks first
  const jsonCodeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonCodeBlockMatch) {
    jsonString = jsonCodeBlockMatch[1];
  } else {
    // 2. If no code block, try to find the outer braces
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = text.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields (topic is now required)
    if (!data.title || !data.summary || !Array.isArray(data.authors) || !Array.isArray(data.tags) || !data.topic) {
       console.warn("Incomplete data structure received", data);
       if (!data.title) throw new Error("Could not extract paper title from AI response.");
    }

    return data as PaperMetadata;
  } catch (e) {
    console.error("JSON Parse Error:", e);
    console.error("Raw Text Received:", text);
    console.error("Attempted JSON String:", jsonString);
    throw new Error("Failed to parse AI response. The model did not return valid JSON.");
  }
};
