/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  BarChart2, 
  Hash, 
  Grid, 
  Shuffle, 
  Sliders, 
  Clipboard, 
  Check, 
  RefreshCw, 
  Info, 
  TrendingUp, 
  Sparkles,
  Layers,
  FileText,
  Search,
  BookOpen,
  Filter,
  CheckCircle,
  Copy,
  Plus,
  Trash2,
  ListFilter,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { initialNumbers } from "./data";

export default function App() {
  // Input state
  const [rawInput, setRawInput] = useState<string>(() => initialNumbers.join(", "));
  const [tempInput, setTempInput] = useState<string>(() => initialNumbers.join(", "));
  const [activeTab, setActiveTab] = useState<"rekomendasi" | "matriks" | "posisi" | "top2d" | "generator">("rekomendasi");
  
  // Matrix inspection state
  const [selectedPair, setSelectedPair] = useState<{ d1: number; d2: number } | null>({ d1: 2, d2: 5 });
  
  // Generator settings
  const [genType, setGenType] = useState<"2D" | "3D" | "4D">("2D");
  const [customDigits, setCustomDigits] = useState<number[]>([]);
  const [filterGenapGanjil, setFilterGenapGanjil] = useState<"all" | "even" | "odd">("all");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Parse numbers from input text
  const parsedNumbers = useMemo(() => {
    return rawInput
      .split(/[\s,;\n\t\.]+/)
      .map(n => n.trim())
      .filter(n => /^\d+$/.test(n)); // Only numbers
  }, [rawInput]);

  // Statistics Engine
  const stats = useMemo(() => {
    const digitCounts = Array(10).fill(0);
    const positionCounts = Array.from({ length: 4 }, () => Array(10).fill(0));
    const pairingMatrix = Array.from({ length: 10 }, () => Array(10).fill(0));
    
    const belakang2D: { [key: string]: number } = {};
    const depan2D: { [key: string]: number } = {};
    const tengah2D: { [key: string]: number } = {};
    const allAdjacent2D: { [key: string]: number } = {};
    
    let doublesCount = 0;
    let triplesCount = 0;
    let quadruplesCount = 0;

    parsedNumbers.forEach((numStr) => {
      // pad/truncate to 4 chars to analyze standard 4D, but support any length
      const cleanStr = numStr.padStart(4, "0").slice(-4);
      const digits = cleanStr.split("").map(Number);
      const uniqueDigits = Array.from(new Set(digits));
      
      const digitFreqInNum: { [key: number]: number } = {};
      
      digits.forEach((d, idx) => {
        if (d >= 0 && d <= 9) {
          digitCounts[d]++;
          if (idx < 4) {
            positionCounts[idx][d]++;
          }
          digitFreqInNum[d] = (digitFreqInNum[d] || 0) + 1;
        }
      });

      // Count patterns: double, triple, quadruple
      const maxFreq = Math.max(...Object.values(digitFreqInNum), 0);
      if (maxFreq === 2) doublesCount++;
      else if (maxFreq === 3) triplesCount++;
      else if (maxFreq >= 4) quadruplesCount++;

      // Unordered pairings (Any position co-occurrence)
      // We look at digit pairs present in the same 4D number.
      for (let i = 0; i < uniqueDigits.length; i++) {
        const d1 = uniqueDigits[i] as number;
        for (let j = i; j < uniqueDigits.length; j++) {
          const d2 = uniqueDigits[j] as number;
          if (d1 === d2) {
            if (digitFreqInNum[d1] > 1) {
              pairingMatrix[d1][d2]++;
            }
          } else {
            pairingMatrix[d1][d2]++;
            pairingMatrix[d2][d1]++;
          }
        }
      }

      // 2-digit combos
      if (cleanStr.length === 4) {
        // 2D Depan
        const dep = cleanStr.substring(0, 2);
        depan2D[dep] = (depan2D[dep] || 0) + 1;

        // 2D Tengah
        const mid = cleanStr.substring(1, 3);
        tengah2D[mid] = (tengah2D[mid] || 0) + 1;

        // 2D Belakang
        const bel = cleanStr.substring(2, 4);
        belakang2D[bel] = (belakang2D[bel] || 0) + 1;

        // All adjacent 2D
        for (let i = 0; i < 3; i++) {
          const adj = cleanStr.substring(i, i + 2);
          allAdjacent2D[adj] = (allAdjacent2D[adj] || 0) + 1;
        }
      }
    });

    // Connectivity score = how often a digit pairs with any other distinct digit
    const connectivityScores = Array(10).fill(0).map((_, d) => {
      let score = 0;
      for (let other = 0; other < 10; other++) {
        if (other !== d) {
          score += pairingMatrix[d][other];
        }
      }
      return { digit: d, score, frequency: digitCounts[d] };
    });

    // Sort by connectivity descending to find the 6 numbers that pair up the most
    const sortedByConnectivity = [...connectivityScores].sort((a, b) => b.score - a.score);
    const top6Digits = sortedByConnectivity.slice(0, 6).map(item => item.digit);

    // List of ordered pairings sorted by frequency
    const topPairsList: { d1: number; d2: number; count: number }[] = [];
    for (let i = 0; i < 10; i++) {
      for (let j = i + 1; j < 10; j++) {
        if (pairingMatrix[i][j] > 0) {
          topPairsList.push({ d1: i, d2: j, count: pairingMatrix[i][j] });
        }
      }
    }
    topPairsList.sort((a, b) => b.count - a.count);

    // Sort 2D arrays
    const getSorted2D = (obj: { [key: string]: number }) => {
      return Object.entries(obj)
        .map(([pair, count]) => ({ pair, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      digitCounts,
      positionCounts,
      pairingMatrix,
      top6Digits,
      connectivityScores,
      topPairsList,
      sortedDepan2D: getSorted2D(depan2D),
      sortedTengah2D: getSorted2D(tengah2D),
      sortedBelakang2D: getSorted2D(belakang2D),
      sortedAllAdjacent2D: getSorted2D(allAdjacent2D),
      doublesCount,
      triplesCount,
      quadruplesCount,
      totalCount: parsedNumbers.length
    };
  }, [parsedNumbers]);

  // Set default generator digits to top 6 digits once stats are computed
  React.useEffect(() => {
    if (customDigits.length === 0 && stats.top6Digits.length > 0) {
      setCustomDigits(stats.top6Digits);
    }
  }, [stats.top6Digits]);

  // Helper to trigger toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Copy text utility
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    triggerToast(`Copied: ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Re-process numbers from textarea
  const handleApplyInput = () => {
    setRawInput(tempInput);
    triggerToast("Data angka berhasil diperbarui dan dianalisis ulang!");
  };

  // Reset to initial user numbers
  const handleResetInput = () => {
    const initialText = initialNumbers.join(", ");
    setTempInput(initialText);
    setRawInput(initialText);
    triggerToast("Data angka dikembalikan ke data awal bawaan.");
  };

  // Generate lucky combinations based on selected digits
  const generatedCombos = useMemo(() => {
    const digits = customDigits.length > 0 ? customDigits : stats.top6Digits;
    const list: string[] = [];
    
    if (genType === "2D") {
      // 2-digit combinations (all permutations)
      for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits.length; j++) {
          const combo = `${digits[i]}${digits[j]}`;
          list.push(combo);
        }
      }
    } else if (genType === "3D") {
      // 3-digit combinations
      for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits.length; j++) {
          for (let k = 0; k < digits.length; k++) {
            const combo = `${digits[i]}${digits[j]}${digits[k]}`;
            list.push(combo);
          }
        }
      }
    } else if (genType === "4D") {
      // 4-digit combinations
      for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits.length; j++) {
          for (let k = 0; k < digits.length; k++) {
            for (let l = 0; l < digits.length; l++) {
              const combo = `${digits[i]}${digits[j]}${digits[k]}${digits[l]}`;
              list.push(combo);
            }
          }
        }
      }
    }

    // Filter Even/Odd (Genap/Ganjil) based on the last digit
    return list.filter(combo => {
      const lastDigit = Number(combo[combo.length - 1]);
      if (filterGenapGanjil === "even") {
        return lastDigit % 2 === 0;
      }
      if (filterGenapGanjil === "odd") {
        return lastDigit % 2 !== 0;
      }
      return true;
    });
  }, [customDigits, stats.top6Digits, genType, filterGenapGanjil]);

  // Find numbers in database that contain the selected pair
  const sampleNumbersWithPair = useMemo(() => {
    if (!selectedPair) return [];
    const { d1, d2 } = selectedPair;
    return parsedNumbers
      .filter(numStr => {
        const cleanStr = numStr.padStart(4, "0").slice(-4);
        const digits = cleanStr.split("").map(Number);
        if (d1 === d2) {
          // Check if double exists
          return digits.filter(d => d === d1).length >= 2;
        }
        return digits.includes(d1) && digits.includes(d2);
      })
      .slice(0, 16); // Limit for view
  }, [parsedNumbers, selectedPair]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-medium border border-emerald-400"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative background glow elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Analisis Pasangan Angka <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-normal">v2.0</span>
              </h1>
              <p className="text-xs text-slate-400">Algoritma Statistik & Matriks Frekuensi Pola 4D</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-xs text-slate-500 block">Waktu Analisis</span>
              <span className="text-xs font-mono font-medium text-slate-300">15 Juli 2026, 01:45 UTC</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Side: Data Source & Quick Stats (4 columns on lg) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Bento Card 1: Data Input & Seeding */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Sumber Data Angka (Input)
              </h2>
              <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">
                {stats.totalCount} Data
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Ubah atau tambahkan angka 4D Anda di bawah ini (pisahkan dengan koma atau spasi). Semua diagram akan langsung diperbarui.
            </p>

            <div className="relative">
              <textarea
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-slate-300 focus:outline-none focus:border-emerald-500 transition-all resize-none leading-relaxed scrollbar-thin"
                placeholder="Masukkan angka 4D di sini..."
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <button
                  onClick={handleResetInput}
                  title="Kembalikan ke data bawaan"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleApplyInput}
              disabled={parsedNumbers.length === 0}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 border border-emerald-400/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Proses Ulang & Hitung Matriks
            </button>
          </div>

          {/* Bento Card 2: Quick Stats Distribution */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Karakteristik Distribusi
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-medium tracking-wider">Kembar 2 (Double)</span>
                <span className="text-lg font-bold text-slate-100 font-mono mt-0.5 block">{stats.doublesCount}</span>
                <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {((stats.doublesCount / stats.totalCount) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-medium tracking-wider">Kembar 3 (Triple)</span>
                <span className="text-lg font-bold text-slate-100 font-mono mt-0.5 block">{stats.triplesCount}</span>
                <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                  {((stats.triplesCount / stats.totalCount) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Total Digit Tunggal Dianalisis</span>
                  <span className="font-mono text-slate-200">{stats.totalCount * 4} digit</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Rasio Kembar 4 (Quadruple)</span>
                  <span className="font-mono text-slate-200">{stats.quadruplesCount} Kali</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                  <div 
                    className="bg-amber-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.quadruplesCount / stats.totalCount) * 1000)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/50 flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-medium">Tips:</span> Pola kembar (Double) muncul cukup sering di data Anda. Pertimbangkan memasukkan angka ganda saat membuat kombinasi 2D/3D.
              </p>
            </div>
          </div>

        </section>

        {/* Right Side: Main Workbenches & Tabs (8 columns on lg) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Interactive Custom Tab Bar */}
          <div className="bg-slate-900/40 border border-slate-800 p-1.5 rounded-xl flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("rekomendasi")}
              className={`flex-1 min-w-[120px] py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "rekomendasi"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Rekomendasi Utama
            </button>

            <button
              onClick={() => setActiveTab("matriks")}
              className={`flex-1 min-w-[120px] py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "matriks"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Grid className="w-4 h-4" />
              Matriks Pasangan
            </button>

            <button
              onClick={() => setActiveTab("posisi")}
              className={`flex-1 min-w-[120px] py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "posisi"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Frekuensi & Posisi
            </button>

            <button
              onClick={() => setActiveTab("top2d")}
              className={`flex-1 min-w-[120px] py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "top2d"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Layers className="w-4 h-4" />
              Daftar 2D Teratas
            </button>

            <button
              onClick={() => setActiveTab("generator")}
              className={`flex-1 min-w-[120px] py-2 px-3 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "generator"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Shuffle className="w-4 h-4" />
              Generator & Kombinasi
            </button>
          </div>

          {/* Active Tab Panel with Motion Animation */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative min-h-[450px]">
            
            <AnimatePresence mode="wait">
              {activeTab === "rekomendasi" && (
                <motion.div
                  key="rekomendasi"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Glowing 6 Ball Showcase */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 md:p-6 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-900 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      6 Angka Utama Terkuat Berpasangan
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-white max-w-xl mx-auto leading-relaxed">
                      Hasil Analisis: 6 Angka yang Paling Sering Muncul & Berpasangan
                    </h3>

                    <p className="text-xs text-slate-400 max-w-2xl mx-auto">
                      Dihitung secara algoritmik dari data Anda berdasarkan frekuensi kemunculan absolut dikombinasikan dengan kekuatan hubungan ko-eksistensi (seberapa sering angka tersebut muncul bersama angka lain).
                    </p>

                    {/* Golden Lucky Balls */}
                    <div className="flex flex-wrap justify-center gap-3 md:gap-5 py-6">
                      {stats.top6Digits.map((digit, index) => {
                        const scoreItem = stats.connectivityScores.find(item => item.digit === digit);
                        return (
                          <motion.div
                            key={digit}
                            whileHover={{ scale: 1.15 }}
                            className="group relative flex flex-col items-center"
                          >
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 text-slate-950 text-2xl md:text-3xl font-extrabold font-mono flex items-center justify-center shadow-xl shadow-amber-950/30 border-2 border-amber-300/40 cursor-pointer relative z-10">
                              {digit}
                              {/* Inner shine */}
                              <div className="absolute top-1 left-2.5 w-4 h-2 bg-white/20 rounded-full rotate-[-15deg]" />
                            </div>
                            <div className="mt-2 text-center">
                              <span className="text-[10px] text-amber-400 font-mono font-medium block">
                                #{index + 1} Terkuat
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {scoreItem?.frequency}x keluar
                              </span>
                            </div>
                            
                            {/* Halo Glow effect */}
                            <div className="absolute -inset-0.5 rounded-full bg-amber-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl max-w-xl mx-auto text-left flex gap-2.5 items-start">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-amber-300 leading-relaxed">
                        <span className="font-bold">Analisis Pola:</span> Angka-angka di atas memiliki indeks keterikatan tertinggi. Ketika salah satu angka ini keluar, besar kemungkinan angka lainnya dalam daftar ini juga turut mendampingi dalam satu kombinasi 4D.
                      </p>
                    </div>
                  </div>

                  {/* Top 6 Specific 2D Pairs list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* List Box 1 */}
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>TOP 6 PASANGAN DIGIT TERKUAT (BEBAS)</span>
                        <span className="text-[10px] text-slate-500 font-mono">Konektivitas</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Pasangan dua angka yang paling sering muncul bersamaan di mana saja pada nomor 4D.
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {stats.topPairsList.slice(0, 6).map((pair, idx) => (
                          <div 
                            key={`${pair.d1}-${pair.d2}`}
                            onClick={() => {
                              setSelectedPair({ d1: pair.d1, d2: pair.d2 });
                              setActiveTab("matriks");
                            }}
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-800/60 p-2.5 rounded-lg flex items-center justify-between cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-mono">#{idx+1}</span>
                              <div className="flex gap-1">
                                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center justify-center">
                                  {pair.d1}
                                </span>
                                <span className="text-slate-500 font-mono text-xs self-center">&amp;</span>
                                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center justify-center">
                                  {pair.d2}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                              {pair.count}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* List Box 2 */}
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>TOP 6 NOMOR 2D BELAKANG (EKOR)</span>
                        <span className="text-[10px] text-slate-500 font-mono">Kemunculan</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Dua angka terakhir (Kepala + Ekor) yang paling sering keluar dalam data Anda.
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {stats.sortedBelakang2D.slice(0, 6).map((item, idx) => (
                          <div 
                            key={item.pair}
                            className="bg-slate-900 border border-slate-800/60 p-2.5 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-mono">#{idx+1}</span>
                              <span className="text-sm font-mono font-extrabold text-amber-400">
                                {item.pair}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                              {item.count}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* CTA to Generate Combinations */}
                  <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Simulator Kombinasi</span>
                      <p className="text-xs text-slate-300">
                        Buat seluruh kombinasi angka 2D/3D/4D bergaransi dari 6 Angka Utama di atas secara instan!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCustomDigits(stats.top6Digits);
                        setActiveTab("generator");
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/20"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Mulai Generator Angka
                    </button>
                  </div>

                </motion.div>
              )}

              {activeTab === "matriks" && (
                <motion.div
                  key="matriks"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Matrix Grid Box */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200">Matriks Intensitas Hubungan Angka (0-9)</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Klik sel matriks di bawah untuk menginspeksi frekuensi dua angka keluar bersamaan dalam baris data yang sama.
                        </p>
                      </div>

                      {/* 10x10 Heatmap Grid */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col items-center">
                        <div className="w-full max-w-[420px] aspect-square flex flex-col">
                          
                          {/* Column Headers */}
                          <div className="flex h-8 w-full border-b border-slate-800/40">
                            <div className="w-8 flex items-center justify-center text-[10px] font-mono text-slate-600 font-bold">Y\X</div>
                            {Array.from({ length: 10 }).map((_, colIdx) => (
                              <div key={colIdx} className="flex-1 flex items-center justify-center text-[11px] font-mono font-bold text-slate-400">
                                {colIdx}
                              </div>
                            ))}
                          </div>

                          {/* Grid Rows */}
                          {Array.from({ length: 10 }).map((_, rowIdx) => (
                            <div key={rowIdx} className="flex flex-1 w-full">
                              
                              {/* Row Header */}
                              <div className="w-8 flex items-center justify-center text-[11px] font-mono font-bold text-slate-400 border-r border-slate-800/40">
                                {rowIdx}
                              </div>

                              {/* Row Cells */}
                              {Array.from({ length: 10 }).map((_, colIdx) => {
                                const count = stats.pairingMatrix[rowIdx][colIdx];
                                
                                // Calculate color depth (Max count is usually around 30-40)
                                const maxCount = Math.max(...stats.pairingMatrix.flat(), 1);
                                const pct = count / maxCount;
                                
                                // Color scale: dark slate -> emerald green -> gold
                                let bgStyle = "bg-slate-900/30 hover:bg-slate-800/60";
                                if (count > 0) {
                                  if (pct < 0.2) bgStyle = "bg-emerald-950/30 text-emerald-500 border border-emerald-900/20";
                                  else if (pct < 0.4) bgStyle = "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40";
                                  else if (pct < 0.6) bgStyle = "bg-emerald-800/40 text-emerald-300 border border-emerald-700/60 shadow-inner";
                                  else if (pct < 0.8) bgStyle = "bg-emerald-700/50 text-emerald-200 border border-emerald-600 shadow";
                                  else bgStyle = "bg-amber-500/80 text-slate-950 font-bold shadow-lg ring-1 ring-amber-400/40";
                                }

                                const isSelected = selectedPair && 
                                  ((selectedPair.d1 === rowIdx && selectedPair.d2 === colIdx) ||
                                   (selectedPair.d1 === colIdx && selectedPair.d2 === rowIdx));

                                return (
                                  <div
                                    key={colIdx}
                                    onClick={() => setSelectedPair({ d1: rowIdx, d2: colIdx })}
                                    className={`flex-1 aspect-square flex items-center justify-center text-[10px] md:text-xs font-mono font-medium rounded-sm cursor-pointer transition-all m-0.5 ${bgStyle} ${
                                      isSelected 
                                        ? "ring-2 ring-white scale-110 z-10 shadow-2xl" 
                                        : "hover:scale-105"
                                    }`}
                                    title={`Angka ${rowIdx} & ${colIdx}: ${count} kali muncul bersama`}
                                  >
                                    {count}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 bg-slate-900/30 border border-slate-800 rounded"></span>
                            <span>0 Kali</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 bg-emerald-950/40 border border-emerald-900 rounded"></span>
                            <span>Rendah (1-5)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 bg-emerald-800/40 border border-emerald-700 rounded"></span>
                            <span>Sedang (6-15)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 bg-emerald-700/50 border border-emerald-600 rounded"></span>
                            <span>Tinggi (16-25)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 bg-amber-500 text-slate-950 rounded font-bold text-center text-[8px] flex items-center justify-center">★</span>
                            <span>Tertinggi (&gt;25)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Matrix Detail Inspector Card (Right side of matrix) */}
                    <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                      {selectedPair ? (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                          <div className="border-b border-slate-800 pb-3">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Inspektur Pasangan</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-1">
                                <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center">
                                  {selectedPair.d1}
                                </span>
                                <span className="text-slate-500 font-mono text-sm self-center">-</span>
                                <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center">
                                  {selectedPair.d2}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 font-mono">
                                ({selectedPair.d1 === selectedPair.d2 ? "Kembar" : "Pasangan"})
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Frekuensi Bersamaan</span>
                              <span className="text-2xl font-bold font-mono text-emerald-400 mt-0.5 block">
                                {stats.pairingMatrix[selectedPair.d1][selectedPair.d2]} <span className="text-xs text-slate-400 font-normal">kali keluar</span>
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block">Probabilitas Kemunculan</span>
                              <span className="text-xs font-mono font-medium text-slate-300 mt-0.5 block">
                                {((stats.pairingMatrix[selectedPair.d1][selectedPair.d2] / stats.totalCount) * 100).toFixed(2)}% dari total data
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block">Contoh Angka di Database ({sampleNumbersWithPair.length})</span>
                              <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                                Nomor 4D yang mengandung angka {selectedPair.d1} dan {selectedPair.d2}:
                              </p>
                              {sampleNumbersWithPair.length > 0 ? (
                                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                                  {sampleNumbersWithPair.map((num, idx) => (
                                    <div 
                                      key={idx} 
                                      className="bg-slate-900 border border-slate-800 text-[11px] font-mono p-1 rounded text-center text-slate-300"
                                    >
                                      {num}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500 italic p-2 bg-slate-900/50 rounded text-center">
                                  Tidak ditemukan data
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-950/30 border border-slate-850 rounded-xl p-6 text-center text-slate-500 italic text-xs h-full flex items-center justify-center">
                          Pilih salah satu sel di matriks untuk melihat detail relasi pasangan angka.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "posisi" && (
                <motion.div
                  key="posisi"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">Kekuatan Angka Berdasarkan Posisi Struktur (As - Kop - Kepala - Ekor)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Analisis frekuensi kemunculan setiap angka 0-9 spesifik di masing-masing 4 posisi nomor 4D.
                    </p>
                  </div>

                  {/* Positioning Bento Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { title: "As", subtitle: "Ribuan (Digit 1)", index: 0, color: "from-blue-400 to-indigo-600", accent: "text-blue-400" },
                      { title: "Kop", subtitle: "Ratusan (Digit 2)", index: 1, color: "from-purple-400 to-pink-600", accent: "text-purple-400" },
                      { title: "Kepala", subtitle: "Puluhan (Digit 3)", index: 2, color: "from-emerald-400 to-teal-600", accent: "text-emerald-400" },
                      { title: "Ekor", subtitle: "Satuan (Digit 4)", index: 3, color: "from-amber-400 to-orange-600", accent: "text-amber-400" }
                    ].map((pos) => {
                      // Find most frequent digit in this position
                      const frequencies = stats.positionCounts[pos.index];
                      const maxFreq = Math.max(...frequencies, 1);
                      const bestDigit = frequencies.indexOf(maxFreq);

                      return (
                        <div key={pos.title} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`text-base font-bold ${pos.accent}`}>{pos.title}</span>
                              <span className="text-[10px] text-slate-500 block leading-tight">{pos.subtitle}</span>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-center">
                              <span className="text-[9px] text-slate-400 block font-semibold">ANGKA TOP</span>
                              <span className="text-sm font-extrabold font-mono text-white block">{bestDigit}</span>
                            </div>
                          </div>

                          {/* Mini Bar Chart */}
                          <div className="space-y-1.5 flex-1 flex flex-col justify-end">
                            {frequencies.map((count, d) => {
                              const pct = (count / maxFreq) * 100;
                              const isMax = count === maxFreq;

                              return (
                                <div key={d} className="flex items-center gap-2">
                                  <span className={`text-[10px] font-mono w-2 ${isMax ? "font-bold text-white" : "text-slate-500"}`}>
                                    {d}
                                  </span>
                                  <div className="flex-1 bg-slate-900 h-2.5 rounded overflow-hidden">
                                    <div 
                                      className={`h-full bg-gradient-to-r ${pos.color} rounded`}
                                      style={{ width: `${Math.max(4, pct)}%` }}
                                    />
                                  </div>
                                  <span className={`text-[9px] font-mono w-5 text-right ${isMax ? "font-bold text-emerald-400" : "text-slate-500"}`}>
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300">Formasi Struktur Paling Ideal Berdasarkan Frekuensi Posisi</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Kombinasi 4D terkuat yang dihasilkan dari pemenang frekuensi tertinggi masing-masing posisi adalah:
                    </p>
                    <div className="flex gap-2 py-2">
                      {stats.positionCounts.map((freqs, idx) => {
                        const maxFreq = Math.max(...freqs);
                        const bestDigit = freqs.indexOf(maxFreq);
                        const names = ["As", "Kop", "Kepala", "Ekor"];
                        
                        return (
                          <div key={idx} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                            <span className="text-[10px] text-slate-500 block font-semibold">{names[idx]}</span>
                            <span className="text-xl font-extrabold font-mono text-emerald-400">{bestDigit}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">({maxFreq}x)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "top2d" && (
                <motion.div
                  key="top2d"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Peta Kombinasi 2 Digit (2D) Teratas</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Daftar lengkap kombinasi 2 digit yang paling dominan muncul pada berbagai bagian nomor 4D.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Box 1: 2D Depan */}
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block uppercase">2D Depan (As + Kop)</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Digit ke-1 dan ke-2 dari angka 4D</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                        {stats.sortedDepan2D.slice(0, 15).map((item, idx) => (
                          <div key={item.pair} className="bg-slate-900 border border-slate-800/60 rounded-lg py-2 px-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">#{idx+1}</span>
                              <span className="text-sm font-mono font-bold text-blue-400">{item.pair}</span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {item.count}x keluar
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Box 2: 2D Tengah */}
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block uppercase">2D Tengah (Kop + Kepala)</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Digit ke-2 dan ke-3 dari angka 4D</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                        {stats.sortedTengah2D.slice(0, 15).map((item, idx) => (
                          <div key={item.pair} className="bg-slate-900 border border-slate-800/60 rounded-lg py-2 px-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">#{idx+1}</span>
                              <span className="text-sm font-mono font-bold text-purple-400">{item.pair}</span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {item.count}x keluar
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Box 3: 2D Belakang */}
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block uppercase text-amber-400">2D Belakang (Kepala + Ekor)</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Digit ke-3 dan ke-4 dari angka 4D</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                        {stats.sortedBelakang2D.slice(0, 15).map((item, idx) => (
                          <div key={item.pair} className="bg-slate-900 border border-slate-800/60 rounded-lg py-2 px-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">#{idx+1}</span>
                              <span className="text-sm font-mono font-bold text-amber-400">{item.pair}</span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {item.count}x keluar
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "generator" && (
                <motion.div
                  key="generator"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Simulator &amp; Generator Kombinasi Angka Keberuntungan</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Hasilkan seluruh permutasi kombinasi angka keberuntungan berdasarkan pilihan angka dasar Anda sendiri.
                      </p>
                    </div>
                  </div>

                  {/* Setup Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/60 p-5 border border-slate-800 rounded-xl">
                    <div className="space-y-4">
                      {/* Digit Selector */}
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-2 uppercase">
                          Langkah 1: Pilih Angka Dasar (0-9)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 10 }).map((_, d) => {
                            const isSelected = customDigits.includes(d);
                            return (
                              <button
                                key={d}
                                onClick={() => {
                                  if (isSelected) {
                                    setCustomDigits(customDigits.filter(x => x !== d));
                                  } else {
                                    setCustomDigits([...customDigits, d].sort((a, b) => a - b));
                                  }
                                }}
                                className={`w-9 h-9 rounded-xl font-mono text-sm font-bold flex items-center justify-center border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button 
                            onClick={() => setCustomDigits(stats.top6Digits)}
                            className="text-[10px] text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Gunakan 6 Angka Utama
                          </button>
                          <span className="text-slate-600 text-[10px]">•</span>
                          <button 
                            onClick={() => setCustomDigits([])}
                            className="text-[10px] text-slate-500 hover:underline font-semibold cursor-pointer"
                          >
                            Kosongkan Pilihan
                          </button>
                        </div>
                      </div>

                      {/* Combo Type Selection */}
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-2 uppercase">
                          Langkah 2: Pilih Format Kombinasi
                        </label>
                        <div className="flex gap-2">
                          {["2D", "3D", "4D"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setGenType(type as any)}
                              className={`flex-1 py-2 rounded-lg font-bold font-mono text-xs border transition-all cursor-pointer ${
                                genType === type
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              Format {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Filter Options */}
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-2 uppercase">
                          Langkah 3: Filter Hasil Kombinasi
                        </label>
                        <div className="flex gap-2">
                          {[
                            { value: "all", label: "Tampilkan Semua" },
                            { value: "even", label: "Ekor Genap" },
                            { value: "odd", label: "Ekor Ganjil" }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setFilterGenapGanjil(opt.value as any)}
                              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                filterGenapGanjil === opt.value
                                  ? "bg-slate-800 border-slate-700 text-white"
                                  : "bg-slate-900/50 border-slate-800/60 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stats inside setup */}
                      <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-850 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Angka Dasar Terpilih:</span>
                          <span className="font-mono text-white">{customDigits.length > 0 ? customDigits.join(", ") : "Tidak ada"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Estimasi Total Hasil:</span>
                          <span className="font-mono text-emerald-400 font-bold">{generatedCombos.length} baris kombinasi</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Output Display Box */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Hasil Kombinasi Keberuntungan ({generatedCombos.length} Kombinasi)
                      </h4>
                      {generatedCombos.length > 0 && (
                        <button
                          onClick={() => copyToClipboard(generatedCombos.join(", "), "Kombinasi Angka")}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          Salin Semua Kombinasi
                        </button>
                      )}
                    </div>

                    {generatedCombos.length > 0 ? (
                      <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 max-h-72 overflow-y-auto scrollbar-thin">
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {generatedCombos.map((combo, idx) => (
                            <div 
                              key={idx}
                              onClick={() => copyToClipboard(combo, `Kombinasi ${combo}`)}
                              className="bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/40 border border-slate-800/80 rounded-lg py-1.5 px-2 text-center font-mono font-bold text-sm text-slate-300 cursor-pointer group transition-all"
                              title="Klik untuk menyalin"
                            >
                              <span className="group-hover:text-emerald-400 transition-colors">
                                {combo}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950/30 border border-slate-900 border-dashed rounded-xl p-8 text-center text-slate-500 text-xs italic">
                        Tidak ada hasil kombinasi. Harap pilih minimal 1 Angka Dasar di Langkah 1 untuk menghasilkan kombinasi keberuntungan.
                      </div>
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-6 px-4 md:px-8 text-center mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Penganalisis Pasangan Angka Terpopuler. Semua perhitungan didasarkan pada model statistik murni.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-help flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Bantuan
            </span>
            <span className="text-slate-700">|</span>
            <span className="hover:text-slate-400">Privasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
