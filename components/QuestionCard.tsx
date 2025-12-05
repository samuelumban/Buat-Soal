
import React, { useState } from 'react';
import { Question } from '../types';
import { generateQuestionImage, editImageWithGemini } from '../services/geminiService';
import { Loader2, Wand2, Edit, Save, X, Download, ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuestionCardProps {
  question: Question;
  index: number;
  showAnswer: boolean;
  onUpdateQuestion: (updated: Question) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, showAnswer, onUpdateQuestion }) => {
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isEditingImg, setIsEditingImg] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // State for text editing
  const [editedQ, setEditedQ] = useState(question);

  // Helper to determine if question is MCQ broadly
  const isMcq = ['mcq', 'pilihan ganda', 'multiple choice'].some(t => question.type.toLowerCase().includes(t));

  const handleGenerateImage = async () => {
    if (!question.image_description) return;
    setIsGeneratingImg(true);
    try {
      const base64 = await generateQuestionImage(question.image_description);
      if (base64) {
        onUpdateQuestion({ ...question, image_url: base64 });
      }
    } catch (e) {
      alert("Gagal membuat gambar.");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleEditImage = async () => {
    if (!question.image_url || !editPrompt) return;
    setIsEditingImg(true);
    try {
      const newImage = await editImageWithGemini(question.image_url, editPrompt);
      if (newImage) {
        onUpdateQuestion({ ...question, image_url: newImage });
        setShowEditModal(false);
        setEditPrompt('');
      } else {
        alert("Gagal mengedit gambar. Coba instruksi lain.");
      }
    } catch (e) {
      alert("Error saat edit gambar.");
    } finally {
      setIsEditingImg(false);
    }
  };

  const handleDownloadImage = () => {
    if (question.image_url) {
      const a = document.createElement('a');
      a.href = question.image_url;
      a.download = `soal_${index + 1}_image.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const saveTextChanges = () => {
    onUpdateQuestion(editedQ);
    setIsEditingText(false);
  };

  const cancelTextChanges = () => {
    setEditedQ(question);
    setIsEditingText(false);
  };

  const handleOptionChange = (idx: number, val: string) => {
    if (!editedQ.options) return;
    const newOptions = [...editedQ.options];
    newOptions[idx] = val;
    setEditedQ({ ...editedQ, options: newOptions });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 transition-all hover:shadow-md relative group/card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full">
            {index + 1}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isMcq ? 'Pilihan Ganda' : 'Esai'} • {question.taxonomy} • {question.difficulty}
            </span>
          </div>
        </div>
        
        {/* Text Edit Toggle */}
        {!isEditingText && (
          <button 
            onClick={() => { setIsEditingText(true); setEditedQ(question); }}
            className="text-slate-400 hover:text-blue-600 p-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
            title="Edit Soal"
          >
            <Edit size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Question Text & Options */}
        <div className="flex-1 order-2 md:order-1">
          {isEditingText ? (
            <div className="mb-4 space-y-3">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500">Soal:</label>
                 <textarea 
                   className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                   rows={3}
                   value={editedQ.question_text}
                   onChange={(e) => setEditedQ({ ...editedQ, question_text: e.target.value })}
                 />
              </div>
            </div>
          ) : (
            <div className="mb-4 text-slate-800 text-lg leading-relaxed">
              <ReactMarkdown>{question.question_text}</ReactMarkdown>
            </div>
          )}

          {/* Options for MCQ */}
          {isMcq && question.options && (
            <div className="space-y-2 ml-2">
              {question.options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C...
                const isCorrect = showAnswer && opt.startsWith(question.correct_answer) || (showAnswer && label === question.correct_answer);
                
                if (isEditingText && editedQ.options) {
                   return (
                     <div key={idx} className="flex gap-2 items-center">
                        <span className="font-bold w-6 text-slate-500">{label}.</span>
                        <input 
                          type="text" 
                          value={editedQ.options[idx]} 
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="flex-1 p-2 border border-slate-300 rounded-md text-sm"
                        />
                     </div>
                   )
                }

                return (
                  <div key={idx} className={`flex gap-3 p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-transparent border-transparent hover:bg-slate-50'}`}>
                    <span className={`font-bold w-6 ${isCorrect ? 'text-green-700' : 'text-slate-500'}`}>{label}.</span>
                    <span className={`${isCorrect ? 'text-green-800 font-medium' : 'text-slate-700'}`}>{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Answer Key Section (Editable) */}
          {(showAnswer || isEditingText) && (
            <div className="mt-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Kunci Jawaban & Pembahasan:</h4>
              
              {isEditingText ? (
                <div className="space-y-3">
                   <div>
                      <label className="text-xs text-slate-500 block mb-1">Jawaban Benar:</label>
                      <input 
                        type="text"
                        value={editedQ.correct_answer}
                        onChange={(e) => setEditedQ({ ...editedQ, correct_answer: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-md text-sm"
                      />
                   </div>
                   <div>
                      <label className="text-xs text-slate-500 block mb-1">Pembahasan:</label>
                      <textarea
                        value={editedQ.explanation}
                        onChange={(e) => setEditedQ({ ...editedQ, explanation: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-md text-sm"
                        rows={2}
                      />
                   </div>
                   <div className="flex justify-end gap-2 mt-2">
                     <button onClick={cancelTextChanges} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded">
                       <X size={14}/> Batal
                     </button>
                     <button onClick={saveTextChanges} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded">
                       <Save size={14}/> Simpan
                     </button>
                   </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 mb-2">
                    <span className="font-semibold text-green-600">Jawaban: {question.correct_answer}</span>
                  </p>
                  <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200">
                    {question.explanation}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Image Section */}
        {(question.image_description || question.image_url) && (
          <div className="md:w-1/3 order-1 md:order-2 flex flex-col gap-2">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              {question.image_url ? (
                <div className="relative group">
                  <img 
                    src={question.image_url} 
                    alt="Question Illustration" 
                    className="w-full h-auto rounded-md shadow-sm border border-slate-200 bg-white"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                      onClick={handleDownloadImage}
                      className="bg-white/90 text-slate-700 p-2 rounded-full shadow-lg hover:bg-blue-50 text-xs font-medium"
                      title="Download Gambar"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="bg-white/90 text-slate-700 p-2 rounded-full shadow-lg hover:bg-blue-50 text-xs font-medium"
                      title="Edit Gambar"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                   <div className="h-32 bg-slate-100 rounded-md flex items-center justify-center border-2 border-dashed border-slate-300">
                      <ImageIcon className="text-slate-300" size={32}/>
                   </div>
                  {/* Removed prompt text display here */}
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImg}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-xs font-medium disabled:opacity-50 w-full"
                  >
                    {isGeneratingImg ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                    Generate Gambar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Image Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wand2 className="text-purple-600" /> Edit Gambar AI
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Instruksikan AI untuk mengubah gambar ini. (Contoh: "Ubah menjadi sketsa hitam putih", "Tambahkan label pada sel", "Hapus latar belakang")
            </p>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none mb-4"
              rows={3}
              placeholder="Instruksi edit..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Batal
              </button>
              <button 
                onClick={handleEditImage}
                disabled={isEditingImg || !editPrompt.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isEditingImg ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                Proses Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
