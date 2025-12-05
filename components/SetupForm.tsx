
import React, { useState } from 'react';
import { ExamConfig, Difficulty, BloomLevel, ExamType } from '../types';
import { Upload, FileText, Check, AlertCircle, Target, Book } from 'lucide-react';

interface SetupFormProps {
  onGenerate: (config: ExamConfig) => void;
  isLoading: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ onGenerate, isLoading }) => {
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Kelas 10 SMA');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [examType, setExamType] = useState<ExamType>(ExamType.MCQ);
  const [selectedBlooms, setSelectedBlooms] = useState<string[]>([BloomLevel.C1, BloomLevel.C2, BloomLevel.C3]);
  const [includeImages, setIncludeImages] = useState(false);
  const [contextText, setContextText] = useState('');
  const [cp, setCp] = useState(''); // Capaian Pembelajaran
  const [tp, setTp] = useState(''); // Tujuan Pembelajaran
  const [fileData, setFileData] = useState<{ mimeType: string, data: string } | undefined>(undefined);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      
      // If PDF, read as Data URL (base64)
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          // Result format is "data:application/pdf;base64,JVBERi..."
          // We need to extract just the base64 part
          const base64 = result.split(',')[1];
          setFileData({ mimeType: 'application/pdf', data: base64 });
          setContextText(''); // Clear text input if file is used
        };
        reader.readAsDataURL(file);
      } else {
        // Assume text for other formats (.txt, .md, .csv)
        const reader = new FileReader();
        reader.onload = (event) => {
          setContextText(event.target?.result as string);
          setFileData(undefined);
        };
        reader.readAsText(file);
      }
    }
  };

  const toggleBloom = (bloom: string) => {
    if (selectedBlooms.includes(bloom)) {
      setSelectedBlooms(selectedBlooms.filter(b => b !== bloom));
    } else {
      setSelectedBlooms([...selectedBlooms, bloom]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || (!contextText && !fileData)) {
      alert("Mohon isi mata pelajaran dan upload materi (PDF/Txt) atau masukkan teks.");
      return;
    }
    onGenerate({
      subject,
      gradeLevel,
      count,
      difficulty,
      examType,
      bloomLevels: selectedBlooms,
      includeImages,
      contextText,
      cp,
      tp,
      fileData
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Konfigurasi Soal</h2>
        <p className="text-slate-500">Sesuaikan parameter, CP, dan TP untuk generate soal otomatis</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Material Upload Section */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">1. Materi / Bahan Ajar</label>
          {/* File Upload Box - Dark Theme */}
          <div className="border-2 border-dashed border-slate-600 bg-slate-800 rounded-xl p-6 text-center hover:bg-slate-700 transition-colors relative">
            <input 
              type="file" 
              accept=".txt,.md,.csv,.pdf" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <div className="w-12 h-12 bg-slate-700 text-blue-400 rounded-full flex items-center justify-center">
                <Upload size={24} />
              </div>
              {fileName ? (
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <Check size={16} /> {fileName}
                </div>
              ) : (
                <>
                  <p className="text-slate-200 font-medium">Klik untuk upload file (PDF, TXT)</p>
                  <p className="text-xs text-slate-400">atau paste teks di bawah ini</p>
                </>
              )}
            </div>
          </div>
          {/* Context Text Area - Dark Theme */}
          <textarea
            placeholder="Atau tempel materi pelajaran di sini..."
            className="w-full h-32 p-4 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-800 text-white placeholder-slate-400"
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            disabled={!!fileData} // Disable text area if a file (PDF) is loaded
          />
          {fileData && <p className="text-xs text-blue-600 italic">* File PDF terdeteksi. Kolom teks dinonaktifkan.</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Subject & Level */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">2. Detail Pelajaran</label>
            <div>
              <span className="text-xs text-slate-500 mb-1 block">Mata Pelajaran</span>
              {/* Subject Input - Dark Theme */}
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Biologi - Sel Hewan"
                className="w-full p-2.5 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-800 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <span className="text-xs text-slate-500 mb-1 block">Jenjang</span>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <optgroup label="SD (Sekolah Dasar)">
                  <option>Kelas 1 SD</option>
                  <option>Kelas 2 SD</option>
                  <option>Kelas 3 SD</option>
                  <option>Kelas 4 SD</option>
                  <option>Kelas 5 SD</option>
                  <option>Kelas 6 SD</option>
                </optgroup>
                <optgroup label="SMP (Sekolah Menengah Pertama)">
                  <option>Kelas 7 SMP</option>
                  <option>Kelas 8 SMP</option>
                  <option>Kelas 9 SMP</option>
                </optgroup>
                <optgroup label="SMA (Sekolah Menengah Atas)">
                  <option>Kelas 10 SMA</option>
                  <option>Kelas 11 SMA</option>
                  <option>Kelas 12 SMA</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Difficulty & Count */}
          <div className="space-y-4">
             <label className="block text-sm font-semibold text-slate-700">3. Parameter Soal</label>
             <div className="space-y-3">
                <div>
                   <span className="text-xs text-slate-500 mb-1 block">Tipe Soal (Assessment)</span>
                   <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value as ExamType)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   >
                      {Object.values(ExamType).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">Kesulitan</span>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      {Object.values(Difficulty).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">Jumlah Soal (1-50)</span>
                    {/* Count Input - Dark Theme */}
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-800 text-white placeholder-slate-400"
                    />
                  </div>
                </div>
             </div>
             <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="imgCheck"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="imgCheck" className="text-sm text-slate-700 cursor-pointer select-none">
                  Generate soal bergambar? (Eksperimental)
                </label>
             </div>
          </div>
        </div>

        {/* CP & TP Section */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
           <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
             <Target size={18} className="text-indigo-600"/>
             4. Kurikulum (CP & TP)
           </label>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <span className="text-xs text-slate-500 mb-1 block">Capaian Pembelajaran (CP)</span>
                {/* CP Input - Dark Theme (Already Applied) */}
                <textarea
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  placeholder="Paste Capaian Pembelajaran di sini..."
                  className="w-full p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none h-24 text-sm bg-slate-800 text-white placeholder-slate-400"
                />
             </div>
             <div>
                <span className="text-xs text-slate-500 mb-1 block">Tujuan Pembelajaran (TP)</span>
                {/* TP Input - Dark Theme (Already Applied) */}
                <textarea
                  value={tp}
                  onChange={(e) => setTp(e.target.value)}
                  placeholder="Paste Tujuan Pembelajaran di sini..."
                  className="w-full p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none h-24 text-sm bg-slate-800 text-white placeholder-slate-400"
                />
             </div>
           </div>
        </div>

        {/* Bloom's Taxonomy */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">5. Taksonomi Bloom (Pilih yang diinginkan)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(BloomLevel).map((level) => {
              const isSelected = selectedBlooms.includes(level);
              return (
                <div 
                  key={level}
                  onClick={() => toggleBloom(level)}
                  className={`cursor-pointer p-3 rounded-lg border text-sm font-medium transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    {level.split(' - ')[0]} <span className="text-xs font-normal text-slate-500">{level.split(' - ')[1]}</span>
                  </div>
                </div>
              )
            })}
          </div>
          {selectedBlooms.length === 0 && (
             <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Pilih minimal satu level kognitif.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (!contextText && !fileData) || selectedBlooms.length === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>Generating...</>
          ) : (
            <>
              <FileText /> Generate {count} Soal Sekarang
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SetupForm;
