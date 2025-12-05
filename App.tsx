
import React, { useState } from 'react';
import { ExamConfig, Question } from './types';
import SetupForm from './components/SetupForm';
import QuestionCard from './components/QuestionCard';
import { generateExamQuestions } from './services/geminiService';
import { BrainCircuit, BookOpen, Download, ArrowLeft, Eye, EyeOff, FileText, Share2, Copy, Check, FileCode, Info } from 'lucide-react';

// Helper to get instruction based on exam type
const getExamInstruction = (type: string = ''): string => {
  const t = type.toLowerCase();
  if (t.includes('pilihan ganda') || t.includes('mcq')) return "Pilihlah satu jawaban yang paling tepat dari opsi yang tersedia.";
  if (t.includes('benar') || t.includes('salah')) return "Tentukan apakah pernyataan berikut Benar atau Salah.";
  if (t.includes('menjodohkan')) return "Pasangkan pernyataan di sebelah kiri dengan jawaban yang sesuai di sebelah kanan.";
  if (t.includes('isian')) return "Lengkapi kalimat atau jawab pertanyaan berikut dengan singkat dan tepat.";
  if (t.includes('uraian') || t.includes('essay')) return "Jawablah pertanyaan berikut dengan penjelasan yang lengkap dan sistematis.";
  if (t.includes('studi kasus')) return "Bacalah studi kasus berikut dengan saksama, lalu jawablah pertanyaan yang menyertainya.";
  if (t.includes('praktik')) return "Ikuti langkah kerja berikut dan catat hasil pengamatan atau demonstrasikan hasilnya.";
  if (t.includes('portofolio')) return "Kumpulkan dan susun karya/dokumen sesuai dengan instruksi berikut.";
  if (t.includes('project')) return "Kerjakan proyek berikut sesuai dengan tahapan yang ditentukan.";
  if (t.includes('lisan')) return "Jawablah pertanyaan yang diajukan secara lisan dengan jelas.";
  if (t.includes('hots')) return "Analisis informasi yang diberikan dan gunakan pemikiran kritis untuk menjawab pertanyaan.";
  if (t.includes('multimedia')) return "Perhatikan gambar/grafik/visual yang disajikan, lalu jawablah pertanyaan terkait.";
  if (t.includes('campuran')) return "Kerjakan soal-soal berikut sesuai dengan instruksi pada setiap bagian.";
  return "Kerjakan soal-soal berikut dengan teliti dan jujur.";
};

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  
  // Google Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleGenerate = async (newConfig: ExamConfig) => {
    setIsGenerating(true);
    setConfig(newConfig);
    try {
      const generatedQuestions = await generateExamQuestions(newConfig);
      setQuestions(generatedQuestions);
    } catch (error) {
      alert("Terjadi kesalahan saat membuat soal. Pastikan API Key valid dan coba lagi.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setConfig(null);
    setShowAnswers(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Export to simple text file
  const handleExportText = () => {
    if (!questions.length) return;

    const instruction = getExamInstruction(config?.examType);

    let content = `MATA PELAJARAN: ${config?.subject || 'Ujian'}\n`;
    content += `JENJANG: ${config?.gradeLevel}\n`;
    content += `TIPE: ${config?.examType}\n`;
    content += `\nINSTRUKSI:\n${instruction}\n`;
    // CP & TP removed from display
    content += `\n--- SOAL ---\n\n`;

    questions.forEach((q, i) => {
      content += `${i + 1}. [${q.type}] ${q.question_text}\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, idx) => {
          content += `   - ${opt}\n`;
        });
      }
      content += `\n`;
    });

    content += `\n--- KUNCI JAWABAN & PEMBAHASAN ---\n\n`;
    questions.forEach((q, i) => {
      content += `${i + 1}. ${q.correct_answer}`;
      if (q.explanation) {
        content += `\n   Pembahasan/Rubrik: ${q.explanation}\n`;
      }
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config?.subject?.replace(/\s+/g, '_') || 'soal'}_export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to Word (.doc / .docx compatible HTML)
  const handleExportWord = () => {
    if (!questions.length) return;

    const instruction = getExamInstruction(config?.examType);

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export Soal</title>
    <style>
      body { font-family: Calibri, sans-serif; font-weight: 400; }
      h1, h2 { font-weight: 700; }
      .question-row { width: 100%; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; page-break-inside: avoid; }
      .q-text { font-weight: 700; font-size: 11pt; }
      .options { margin-left: 20px; font-size: 11pt; font-weight: 400; }
      /* Key Change: Separates Answer Key section to new page, but keeps items flowing together */
      .answer-key { page-break-before: always; margin-top: 20px; }
      .answer-item { margin-bottom: 10px; page-break-inside: avoid; }
      .instruction { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; margin: 10px 0; font-style: italic; font-weight: 400; }
    </style>
    </head><body>`;
    
    let body = `<h1>${config?.subject || 'Ujian'}</h1>`;
    body += `<p><strong>Jenjang:</strong> ${config?.gradeLevel} | <strong>Tipe:</strong> ${config?.examType}</p>`;
    
    // Add Instruction
    body += `<div class='instruction'><strong>Instruksi:</strong> ${instruction}</div><hr/>`;

    // CP & TP Removed from display
    
    body += `<h2>DAFTAR SOAL</h2>`;
    
    questions.forEach((q, i) => {
      // Use table for layout to support Word's primitive HTML rendering for images side-by-side
      body += `<div class='question-row'>`;
      body += `<table width="100%" border="0" cellspacing="0" cellpadding="5"><tr>`;
      
      // Left Column: Text
      body += `<td valign="top" width="${q.image_url ? '70%' : '100%'}">`;
      body += `<p class='q-text'>${i + 1}. ${q.question_text}</p>`;
      
      // Options
      if (q.options && q.options.length > 0) {
        body += `<div class='options'>`;
        q.options.forEach((opt, idx) => {
           body += `<p>${String.fromCharCode(65 + idx)}. ${opt}</p>`;
        });
        body += `</div>`;
      }
      body += `</td>`;

      // Right Column: Image (if exists)
      if (q.image_url) {
        // Force width to be smaller (approx 5cm or 180px) and auto height
        body += `<td valign="top" width="30%" align="center">`;
        body += `<img src="${q.image_url}" width="180" style="width:180px; height:auto; border:1px solid #ccc;" alt="Soal ${i+1}" />`;
        body += `</td>`;
      }

      body += `</tr></table>`;
      body += `</div>`;
    });

    // Answer Key Section - Modified to list items compactly
    body += `<div class='answer-key'><h2>KUNCI JAWABAN</h2>`;
    questions.forEach((q, i) => {
       body += `<div class='answer-item'><strong>${i+1}. ${q.correct_answer}</strong><br/><em>${q.explanation || ''}</em></div>`;
    });
    body += `</div>`;

    const footer = "</body></html>";
    const sourceHTML = header + body + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config?.subject?.replace(/\s+/g, '_') || 'soal'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy HTML for Google Docs
  const handleCopyForDocs = () => {
    if (!questions.length) return;

    const instruction = getExamInstruction(config?.examType);

    // Build simple HTML representation with tables for layout
    let html = `<h2>${config?.subject} - ${config?.gradeLevel}</h2>`;
    html += `<p><strong>Instruksi:</strong> <em>${instruction}</em></p><hr/>`;
    
    questions.forEach((q, i) => {
       html += `<table style="width: 100%; border-bottom: 1px solid #ccc; margin-bottom: 10px;"><tr><td style="vertical-align: top; padding-right: 15px;">`;
       html += `<p><strong>${i+1}. ${q.question_text}</strong></p>`;
       
       if (q.options) {
         q.options.forEach((opt, idx) => {
            html += `<div>${String.fromCharCode(65 + idx)}. ${opt}</div>`;
         });
       }
       html += `</td>`;
       
       if (q.image_url) {
          html += `<td style="vertical-align: top; width: 200px;"><img src="${q.image_url}" width="180" /></td>`;
       }
       html += `</tr></table>`;
    });
    html += `<hr/><h3>Kunci Jawaban</h3>`;
    questions.forEach((q, i) => {
       html += `<p>${i+1}. ${q.correct_answer}</p>`;
    });

    // Copy to clipboard as HTML
    const blob = new Blob([html], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({ 'text/html': blob });
    
    navigator.clipboard.write([clipboardItem]).then(() => {
       setCopyFeedback('Tersalin! Paste ke Google Docs sekarang.');
       setTimeout(() => setCopyFeedback(''), 3000);
    }).catch(err => {
       alert("Gagal menyalin. Browser tidak support.");
    });
  };

  const updateQuestion = (updated: Question) => {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
  };

  const generateAppsScript = () => {
    if (!questions.length) return '';

    // Sanitizer helper to escape quotes and newlines for Apps Script
    const safeStr = (str: string) => {
      if (!str) return '';
      // Escape backslashes first, then quotes, then handle newlines as literal \n characters
      return str.replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\n/g, "\\n");
    };

    const instruction = getExamInstruction(config?.examType);
    const safeInstruction = safeStr(instruction);
    // CP & TP unused in final display
    const safeSubject = safeStr(config?.subject || "Ujian");
    const safeLevel = safeStr(config?.gradeLevel || "");
    const safeType = safeStr(config?.examType || "");

    const script = `
function createQuiz() {
  var form = FormApp.create('${safeSubject} - ${safeLevel}');
  form.setIsQuiz(true);
  form.setDescription('Tipe: ${safeType}.\\nInstruksi: ${safeInstruction}');
  
  // Collect Email
  form.setCollectEmail(true);

  // --- Identitas Responden ---
  var nameItem = form.addTextItem();
  nameItem.setTitle('Nama Lengkap');
  nameItem.setRequired(true);

  var classItem = form.addTextItem();
  classItem.setTitle('Kelas');
  classItem.setRequired(true);

  form.addPageBreakItem().setTitle('Soal Ujian');
  // ---------------------------

  // Questions
  ${questions.map((q, i) => {
    // Sanitasi teks
    const qText = safeStr(q.question_text);
    const qExpl = safeStr(q.explanation);
    
    // Determine Google Form Item Type based on our internal types
    let itemType = 'ParagraphTextItem'; // Default to Essay/Long Answer
    let isChoice = false;

    // Check types strictly
    const typeLower = q.type ? q.type.toLowerCase() : "";
    if (typeLower.includes('pilihan ganda') || typeLower.includes('multiple choice') || typeLower.includes('mcq')) {
      itemType = 'MultipleChoiceItem';
      isChoice = true;
    } else if (typeLower.includes('benar') || typeLower.includes('salah') || typeLower.includes('true')) {
      itemType = 'MultipleChoiceItem'; // Treat True/False as MCQ
      isChoice = true;
    } else if (typeLower.includes('isian') || typeLower.includes('short')) {
      itemType = 'TextItem'; // Short answer
    }
    
    let qScript = `
  // Soal ${i + 1} (${q.type})
  var item${i} = form.add${itemType}();
  item${i}.setTitle('${qText}');
  item${i}.setPoints(10);
    `;

    if (isChoice && q.options && q.options.length > 0) {
      // MCQ or True/False Logic
      const correctVal = q.correct_answer.trim();
      
      const choices = q.options.map((opt, idx) => {
         const optClean = safeStr(opt);
         // Simple heuristic for correctness
         let isCorrect = false;
         if (correctVal.length === 1 && idx === (correctVal.toUpperCase().charCodeAt(0) - 65)) {
            isCorrect = true; // A, B, C...
         } else if (optClean.toLowerCase().startsWith(correctVal.toLowerCase())) {
            isCorrect = true;
         } else if (correctVal.toLowerCase() === optClean.toLowerCase()) {
            isCorrect = true;
         }

         return `item${i}.createChoice('${optClean}', ${isCorrect})`;
      }).join(',\n    ');
      
      qScript += `
  item${i}.setChoices([
    ${choices}
  ]);
      `;

      if (qExpl) {
         qScript += `
  var feedback${i} = FormApp.createFeedback().setText('${qExpl}').build();
  item${i}.setFeedbackForCorrect(feedback${i});
  item${i}.setFeedbackForIncorrect(feedback${i});
         `;
      }
    } else {
      // Essay / Short Answer / Project / Portfolio / Case Study / Matching (Fall back to text for simplicity)
      if (qExpl) {
         // ParagraphTextItem uses setGeneralFeedback
         qScript += `
  var feedback${i} = FormApp.createFeedback().setText('${qExpl}').build();
  item${i}.setGeneralFeedback(feedback${i});
         `;
      }
    }

    return qScript;
  }).join('\n')}

  Logger.log('Form Created URL: ' + form.getEditUrl());
  Logger.log('Form Published URL: ' + form.getPublishedUrl());
}
    `;
    return script.trim();
  };

  const handleCopyScript = () => {
    const script = generateAppsScript();
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-poppins">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">BUAT SOAL</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
             Generator Soal SD-SMP-SMA Otomatis
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {questions.length === 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isGenerating ? (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="relative w-24 h-24 mb-8">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <BrainCircuit className="text-indigo-600 animate-pulse" size={32} />
                   </div>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">Sedang Menganalisis Materi & Kurikulum...</h2>
                 <p className="text-slate-500 max-w-md">
                   AI sedang membaca materi, CP, dan TP Anda, lalu menyusun {config?.count} soal tipe {config?.examType} yang relevan.
                 </p>
               </div>
            ) : (
              <SetupForm onGenerate={handleGenerate} isLoading={isGenerating} />
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 print:hidden">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                <ArrowLeft size={20} /> Kembali
              </button>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors border ${
                    showAnswers 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {showAnswers ? <EyeOff size={16}/> : <Eye size={16}/>}
                  {showAnswers ? 'Hide' : 'Kunci'}
                </button>
                
                {/* Export Google Docs (Copy) */}
                <button
                  onClick={handleCopyForDocs}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium shadow-sm"
                  title="Copy untuk Paste ke Google Docs"
                >
                  {copyFeedback ? <Check size={16}/> : <Copy size={16}/>} 
                  {copyFeedback ? 'Disalin!' : 'Copy GDocs'}
                </button>

                 {/* Export Word */}
                 <button
                  onClick={handleExportWord}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-blue-800 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium shadow-sm"
                >
                  <FileText size={16} /> Word
                </button>

                {/* Google Forms */}
                <button
                  onClick={() => setShowFormModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <Share2 size={16} /> GForms
                </button>

              </div>
            </div>

            {/* Exam Paper View - REVISED STYLES (NO DARK COLUMNS) */}
            <div className="bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-xl overflow-hidden print:shadow-none print:w-full border border-slate-200">
              {/* Exam Header - CHANGED FROM DARK BLUE TO WHITE/LIGHT */}
              <div className="bg-white p-8 print:bg-white print:text-black print:border-b-2 border-b border-slate-200">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <h2 className="text-3xl font-bold mb-2 text-slate-900">{config?.subject || 'Ujian Sekolah'}</h2>
                    <div className="flex flex-wrap gap-4 text-slate-600 text-sm font-medium mb-4">
                      <span className="flex items-center gap-1"><BookOpen size={16}/> {config?.gradeLevel}</span>
                      <span>•</span>
                      <span>{questions.length} Soal</span>
                      <span>•</span>
                      <span>{config?.examType}</span>
                    </div>

                    {/* Instruction Block */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                       <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
                       <div>
                         <span className="font-bold text-slate-800 block mb-1">Instruksi Pengerjaan:</span>
                         <p className="text-slate-700 italic">{getExamInstruction(config?.examType)}</p>
                       </div>
                    </div>

                  </div>
                  <div className="text-right hidden sm:block shrink-0 ml-4">
                     <div className="text-2xl font-bold opacity-10 text-slate-900">BUAT SOAL</div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="p-4 sm:p-8 bg-white print:bg-white">
                {questions.map((q, idx) => (
                  <QuestionCard 
                    key={q.id} 
                    index={idx} 
                    question={q} 
                    showAnswer={showAnswers} 
                    onUpdateQuestion={updateQuestion}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-6 text-center text-slate-500 text-sm print:hidden">
                Dibuat otomatis oleh BUAT SOAL dengan teknologi Gemini
              </div>
            </div>
          </div>
        )}

        {/* Google Forms Modal */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg text-green-700">
                    <Share2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Export ke Google Forms</h3>
                </div>
                <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-slate-600 mb-4 text-sm">
                  Karena keterbatasan akses langsung, kami membuatkan <strong>Google Apps Script</strong> otomatis untuk Anda.
                  Salin kode di bawah ini, lalu ikuti langkah mudah berikut:
                </p>
                <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <li>Buka <a href="https://script.google.com/home/start" target="_blank" className="text-blue-600 underline hover:text-blue-800">script.google.com</a> dan klik <strong>+ New Project</strong>.</li>
                  <li>Hapus semua kode yang ada, lalu <strong>Paste</strong> kode di bawah ini.</li>
                  <li>Klik tombol <strong>Run</strong> (ikon Play &#9658;).</li>
                  <li>Berikan izin akses (Review Permissions -&gt; Allow) jika diminta.</li>
                  <li>Link Google Form Anda akan muncul di bagian bawah log (Execution Log).</li>
                </ol>
                <div className="relative">
                  {/* Code block with LIGHT background (Requested: no dark columns) */}
                  <pre className="bg-slate-100 text-slate-800 p-4 rounded-lg text-xs overflow-x-auto h-64 font-mono border border-slate-300">
                    {generateAppsScript()}
                  </pre>
                  <button 
                    onClick={handleCopyScript}
                    className="absolute top-2 right-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-2 rounded-md transition-colors shadow-sm"
                    title="Copy Code"
                  >
                    {copiedScript ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setShowFormModal(false)}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
