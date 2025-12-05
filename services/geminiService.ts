
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
          type: { type: Type.STRING },
          taxonomy: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          question_text: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Options for MCQ (a-e), or True/False choices, or Matching pairs if applicable."
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
  
  const systemPrompt = `
    Bertindaklah sebagai Guru SMA ahli di Indonesia yang ahli dalam kurikulum merdeka. Buatlah ujian/asesmen berdasarkan materi.
    
    Konfigurasi Ujian:
    - Mata Pelajaran: ${config.subject}
    - Jenjang: ${config.gradeLevel}
    - Jumlah Soal: ${config.count}
    - Tingkat Kesulitan: ${config.difficulty}
    - Taksonomi Bloom (TARGET KOGNITIF): ${config.bloomLevels.join(', ')}
    - TIPE SOAL YANG DIMINTA: ${config.examType}
    
    Kurikulum Alignment (SANGAT PENTING):
    - Capaian Pembelajaran (CP): ${config.cp || "Sesuaikan dengan materi"}
    - Tujuan Pembelajaran (TP): ${config.tp || "Sesuaikan dengan materi"}
    
    Instruksi Khusus (FORMAT JSON):
    1. Pastikan setiap soal MENGACU PADA CP dan TP.
    2. Level Kognitif harus sesuai Bloom (${config.bloomLevels.join(', ')}).
    
    3. ATURAN TIPE SOAL (CRITICAL):
       - Jika Tipe Soal adalah 'Pilihan Ganda', set JSON field "type" menjadi "mcq".
       - Jika Tipe Soal adalah 'Uraian' atau 'Esai', set JSON field "type" menjadi "essay".
       - Jika Tipe Soal adalah 'Benar/Salah', set JSON field "type" menjadi "true_false".
       - Jika Tipe Soal adalah 'Menjodohkan', set JSON field "type" menjadi "matching".
       - Jika Tipe Soal adalah 'Isian Singkat', set JSON field "type" menjadi "short_answer".
    
    4. ATURAN STRUKTUR SOAL:
       - Untuk tipe "mcq" (Pilihan Ganda): Field "options" WAJIB ADA dan berisi array 5 pilihan jawaban (a-e).
       - Field "correct_answer": Harus berisi teks jawaban yang benar.
       - Field "explanation": Berikan pembahasan lengkap.

    Gambar: ${config.includeImages ? "Beberapa soal HARUS memiliki deskripsi gambar visual yang relevan (image_description)." : "Jangan sertakan deskripsi gambar."}
    
    Output JSON dengan format: questions: Array of objects.
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
    // New style based on user request: Flat minimal illustration, muted earth tones, thin outlines.
    // We combine the context (prompt) with the requested aesthetic style.
    const stylePrompt = `${prompt}. Style: Flat minimal illustration, muted earth tones, thin outlines, simple shading, calm mood, minimalistic composition. Negative prompt: No realism, no 3D look, no dramatic lighting, no heavy shadows, no saturated colors, no complex background, no detailed textures, no comic style, no anime, no harsh outlines, no clutter, NO Text.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", 
      contents: {
        parts: [{ text: `Generate an educational illustration: ${stylePrompt}` }]
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
            // Apply the same consistent style for edits
            text: `Edit this image: ${editInstruction}. Return the edited image with style: Flat minimal illustration, muted earth tones, thin outlines, simple shading, calm mood, minimalistic composition. NO Text.`
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
