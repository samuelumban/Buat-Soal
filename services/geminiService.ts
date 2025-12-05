import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExamConfig, Question, ExamType } from "../types";

// Helper to get AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ["mcq", "essay"] },
          taxonomy: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          question_text: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of 5 options string if mcq. Empty if essay."
          },
          correct_answer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          image_description: { 
            type: Type.STRING, 
            description: "A detailed visual description for an image to accompany this question, ONLY if necessary. Leave empty if no image needed." 
          },
        },
        required: ["id", "type", "question_text", "correct_answer", "explanation", "taxonomy", "difficulty"]
      }
    }
  }
};

export const generateExamQuestions = async (config: ExamConfig): Promise<Question[]> => {
  const ai = getAI();
  
  let questionTypeInstruction = "Variasi Soal: Campuran Pilihan Ganda (opsi a-e) dan Esai.";
  if (config.examType === ExamType.MCQ) {
    questionTypeInstruction = "Format Soal: SEMUA harus Pilihan Ganda (MCQ) dengan 5 opsi (a-e).";
  } else if (config.examType === ExamType.ESSAY) {
    questionTypeInstruction = "Format Soal: SEMUA harus Uraian / Esai (essay). Jangan buat pilihan ganda.";
  }

  const systemPrompt = `
    Bertindaklah sebagai Guru SMA ahli di Indonesia. Buatlah ujian berdasarkan materi yang diberikan.
    
    Konfigurasi Ujian:
    - Mata Pelajaran: ${config.subject}
    - Jenjang: ${config.gradeLevel}
    - Jumlah Soal: ${config.count}
    - Tingkat Kesulitan: ${config.difficulty}
    - Taksonomi Bloom: ${config.bloomLevels.join(', ')}
    - ${questionTypeInstruction}
    - Gambar: ${config.includeImages ? "Beberapa soal HARUS memiliki deskripsi gambar visual yang relevan (image_description) untuk digenerate AI." : "Jangan sertakan deskripsi gambar."}
    
    Output JSON dengan format:
    questions: Array of objects.
  `;

  // Construct parts based on input type (Text or File)
  const parts: any[] = [{ text: systemPrompt }];

  if (config.fileData) {
    parts.push({
      inlineData: {
        mimeType: config.fileData.mimeType,
        data: config.fileData.data
      }
    });
    parts.push({ text: "Buatlah soal-soal ujian berdasarkan dokumen di atas." });
  } else if (config.contextText) {
    parts.push({ text: `Materi:\n"${config.contextText.substring(0, 30000)}..."` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        systemInstruction: "You are a helpful educational AI assistant. You generate structured exam data in Indonesian.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    
    const data = JSON.parse(text);
    return data.questions || [];
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};

export const generateQuestionImage = async (prompt: string): Promise<string | undefined> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", 
      contents: {
        parts: [{ text: `Generate an educational illustration: ${prompt}` }]
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image gen error:", error);
    return undefined; 
  }
};

export const editImageWithGemini = async (base64Image: string, editInstruction: string): Promise<string | undefined> => {
  const ai = getAI();
  try {
    const base64Data = base64Image.split(',')[1]; 
    const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: `Edit this image: ${editInstruction}. Return the edited image.`
          }
        ]
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image edit error:", error);
    throw error;
  }
};