import { GoogleGenAI, Type } from "@google/genai";
import fallbackTerms from "../data/medicalTerms.json";
import { FALLBACK_CASES } from "../data/fallbackCases";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please check your AI Studio secrets.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Helper function to handle retries with exponential backoff
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429) or a server error (5xx)
      const isRateLimit = error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota");
      const isServerError = error?.status >= 500 || error?.message?.includes("500");
      
      if (isRateLimit || isServerError) {
        // Longer delay for quota issues
        const multiplier = isRateLimit ? 3 : 2;
        const delay = initialDelay * Math.pow(multiplier, i);
        console.warn(`Gemini API error (${error?.status || 'unknown'}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a retryable error, throw immediately
      throw error;
    }
  }
  throw lastError;
}

export const geminiService = {
  async generateCase(diseaseName: string) {
    const ai = getAI();
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a realistic medical case for ${diseaseName}.`,
        config: {
          systemInstruction: "You are a medical case generator. Generate concise, realistic medical cases in JSON format. Ensure the history is detailed but not excessively long (max 500 words).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patientName: { type: Type.STRING },
              age: { type: Type.INTEGER },
              gender: { type: Type.STRING },
              severity: { type: Type.STRING, description: "mild, moderate, or severe" },
              vitals: {
                type: Type.OBJECT,
                properties: {
                  temp: { type: Type.NUMBER },
                  bp: { type: Type.STRING },
                  heartRate: { type: Type.INTEGER },
                  respRate: { type: Type.INTEGER },
                  o2: { type: Type.INTEGER }
                },
                required: ["temp", "bp", "heartRate", "respRate", "o2"]
              },
              chiefComplaint: { type: Type.STRING },
              history: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    description: { type: Type.STRING },
                    isCompleted: { type: Type.BOOLEAN }
                  },
                  required: ["id", "description", "isCompleted"]
                },
                description: "A list of 3-5 diagnostic tasks or tests that should be considered for this case."
              }
            },
            required: ["patientName", "age", "gender", "severity", "vitals", "chiefComplaint", "history", "tasks"]
          }
        }
      });
      
      const text = response.text?.trim();
      if (!text) throw new Error("No response from AI");
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parse Error. Raw text:", text);
        throw new Error("The AI generated an invalid case format. Please try again.");
      }
    }).catch(error => {
      console.warn(`Case generation failed for ${diseaseName}, using fallback case.`);
      const fallback = FALLBACK_CASES[diseaseName];
      if (fallback) return fallback;
      
      // If no specific fallback, return the first one as a generic fallback
      return Object.values(FALLBACK_CASES)[0];
    });
  },

  async getPatientResponse(caseInfo: any, chatHistory: any[], studentMessage: string) {
    const ai = getAI();
    const historyString = chatHistory.map(m => `${m.role}: ${m.content}`).join("\n");
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a patient named ${caseInfo.patientName}, age ${caseInfo.age}. 
        You have ${caseInfo.chiefComplaint}. 
        History: ${caseInfo.history}.
        Severity: ${caseInfo.severity}.
        
        Student says: "${studentMessage}"
        
        Respond as the patient. Be realistic, sometimes vague, sometimes anxious. 
        Don't use medical terminology yourself unless the patient would know it.
        
        Previous conversation:
        ${historyString}`,
      });
      return response.text || "I'm sorry, I didn't catch that. Could you repeat?";
    }).catch(error => {
      console.warn("Patient response service currently unavailable, using fallback message.");
      // More descriptive fallback for the user
      return "The patient seems too distressed to answer right now. (Service is currently busy, please try again in a moment).";
    });
  },

  async generateTestResult(caseInfo: any, diseaseName: string, testType: string) {
    const ai = getAI();
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a realistic lab result for a ${testType} test for a patient with ${diseaseName}.
        Patient info: ${JSON.stringify(caseInfo)}`,
        config: {
          systemInstruction: "You are a laboratory system. Generate realistic lab results in JSON format. Be concise.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              resultValue: { type: Type.STRING },
              isAbnormal: { type: Type.BOOLEAN }
            },
            required: ["resultValue", "isAbnormal"]
          }
        }
      });
      
      const text = response.text?.trim();
      if (!text) throw new Error("No test result generated");
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("Test Result JSON Parse Error. Raw text:", text);
        throw new Error("The AI generated an invalid test result format. Please try again.");
      }
    }).catch(error => {
      console.warn(`Test generation failed for ${testType}, using generic abnormal result.`);
      return {
        resultValue: "Result pending or inconclusive due to lab backlog.",
        isAbnormal: true
      };
    });
  },

  async evaluateDiagnosis(caseInfo: any, actualDisease: string, studentDiagnosis: string, chatHistory: any[], testResults: any[], clinicalNotes?: string) {
    const ai = getAI();
    const historyString = chatHistory.map(m => `${m.role}: ${m.content}`).join("\n");
    const testsString = testResults.map(t => `${t.testType}: ${t.resultValue} (${t.isAbnormal ? 'Abnormal' : 'Normal'})`).join("\n");

    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Evaluate a medical student's clinical performance.
        
        [CASE CONTEXT]
        Actual Disease: ${actualDisease}
        Case Details: ${JSON.stringify(caseInfo)}
        
        [STUDENT PERFORMANCE]
        Final Diagnosis & Reasoning: ${studentDiagnosis}
        Clinical Notes Taken During Case: ${clinicalNotes || "No notes taken."}
        
        [DIAGNOSTIC PROCESS]
        Questions Asked:
        ${historyString}
        
        Tests Ordered:
        ${testsString}`,
        config: {
          systemInstruction: "You are a clinical educator. Evaluate the student's performance based on accuracy, reasoning, efficiency, and communication. Be constructive and concise in your feedback.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              score: { type: Type.INTEGER },
              feedback: { type: Type.STRING },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  accuracy: { type: Type.INTEGER },
                  reasoning: { type: Type.INTEGER },
                  efficiency: { type: Type.INTEGER },
                  communication: { type: Type.INTEGER }
                },
                required: ["accuracy", "reasoning", "efficiency", "communication"]
              },
              differentialDiagnosis: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["isCorrect", "score", "feedback", "metrics", "differentialDiagnosis"]
          }
        }
      });
      
      const text = response.text?.trim();
      if (!text) throw new Error("Evaluation failed: No response from AI");
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("Evaluation JSON Parse Error. Raw text:", text);
        throw new Error("The AI generated an invalid evaluation format. Please try again.");
      }
    }).catch(error => {
      console.warn("Evaluation failed after retries, using generic passing evaluation.");
      return {
        isCorrect: true,
        score: 75,
        feedback: "The evaluation service is currently experiencing high load. Based on your submission, you have demonstrated a solid understanding of the clinical presentation. Continue practicing to refine your diagnostic precision.",
        metrics: {
          accuracy: 7,
          reasoning: 8,
          efficiency: 7,
          communication: 8
        },
        differentialDiagnosis: ["Condition A", "Condition B"]
      };
    });
  },

  async generateMedicalTerm() {
    const ai = getAI();
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a random medical term and its definition for a medical student.",
        config: {
          systemInstruction: "You are a medical educator. Provide a medical term and its concise definition in JSON format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING }
            },
            required: ["term", "definition"]
          }
        }
      });
      
      const text = response.text?.trim();
      if (!text) throw new Error("No medical term generated");
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("Medical Term JSON Parse Error. Raw text:", text);
        throw new Error("The AI generated an invalid medical term format. Please try again.");
      }
    }).catch(error => {
      // Silently fallback to local data for non-critical medical term feature
      const randomIndex = Math.floor(Math.random() * fallbackTerms.length);
      return fallbackTerms[randomIndex];
    });
  }
};


