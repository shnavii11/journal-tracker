import React, { useState, useEffect, useMemo } from 'react';
import { Leaf, Award, Calendar, Check, Flame, Save } from 'lucide-react';

// --- UTILITIES ---

const formatDate = (date) => {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const getTodayStr = () => formatDate(new Date());

const getYearDates = (year) => {
  const dates = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
};

// --- STREAK LOGIC ---

const calculateStats = (datesSet) => {
  const dates = Array.from(datesSet).sort();
  const today = getTodayStr();
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  
  if (dates.length > 0) {
    let prevDate = new Date(dates[0]);
    tempStreak = 1;
    maxStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const currDate = new Date(dates[i]);
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;
      prevDate = currDate;
    }
  }

  let streakActive = datesSet.has(today) || datesSet.has(yesterday);
  
  if (streakActive) {
    let checkDate = new Date();
    if (!datesSet.has(formatDate(checkDate)) && datesSet.has(yesterday)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = formatDate(checkDate);
      if (datesSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    total: datesSet.size,
    currentStreak,
    maxStreak
  };
};

// --- COMPONENTS ---

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-100 transition-transform hover:scale-105">
    <div className={`p-2 rounded-full mb-2 ${colorClass} bg-opacity-20`}>
      <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <span className="text-2xl font-bold text-stone-700 font-hand">{value}</span>
    <span className="text-xs uppercase tracking-wider text-stone-500 font-sans mt-1">{label}</span>
  </div>
);

const HeatmapCell = ({ dateObj, isCompleted, isClickable, onClick }) => {
  const dateStr = formatDate(dateObj);

  const baseClass = "w-3 h-3 m-[1.5px] rounded-[3px] transition-all duration-300";
  const cursorClass = isClickable ? "cursor-pointer" : "cursor-default";
  const activeClass = isCompleted
    ? "bg-[#8FB996] shadow-[0_0_4px_rgba(143,185,150,0.6)] scale-110"
    : isClickable
      ? "bg-[#EFEBE9] hover:bg-[#E6A4B4] hover:opacity-50"
      : "bg-[#EFEBE9] opacity-60";

  return (
    <div
      className={`${baseClass} ${cursorClass} ${activeClass}`}
      onClick={() => isClickable && onClick(dateStr)}
      title={`${dateStr}${isCompleted ? ' (Journaled)' : isClickable ? ' — click to mark' : ''}`}
    />
  );
};

export default function App() {
  const [completedDates, setCompletedDates] = useState(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [yearView, setYearView] = useState(new Date().getFullYear());
  const [showSaveMsg, setShowSaveMsg] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('journal_tracker_data');
    if (saved) {
      setCompletedDates(new Set(JSON.parse(saved)));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('journal_tracker_data', JSON.stringify(Array.from(completedDates)));
      setShowSaveMsg(true);
      const timer = setTimeout(() => setShowSaveMsg(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [completedDates, isLoaded]);

  const markDate = (dateStr) => {
    if (completedDates.has(dateStr)) return;
    const newSet = new Set(completedDates);
    newSet.add(dateStr);
    setCompletedDates(newSet);
  };

  const markToday = () => markDate(getTodayStr());

  const stats = useMemo(() => calculateStats(completedDates), [completedDates]);
  const todayStr = getTodayStr();
  const isTodayDone = completedDates.has(todayStr);

  const calendarData = useMemo(() => {
    const dates = getYearDates(yearView);
    const weeks = [];
    let currentWeek = [];

    const firstDay = dates[0].getDay(); 
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    dates.forEach(date => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return weeks;
  }, [yearView]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-stone-700 font-sans selection:bg-[#FAD9E0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Nunito:wght@400;600;700&display=swap');
        .font-hand { font-family: 'Patrick Hand', cursive; }
        .font-sans { font-family: 'Nunito', sans-serif; }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
        
        {/* HEADER */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 mb-4 bg-[#FAD9E0] bg-opacity-30 rounded-full">
            <Leaf className="text-[#8FB996]" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-hand text-stone-800 mb-2">Daily Journal</h1>
          <p className="text-stone-500 tracking-wide text-sm md:text-base font-light">
            One tick a day. Offline. Intentional.
          </p>
        </header>

        {/* MAIN ACTION - TODAY */}
        <div className="mb-12 w-full max-w-md">
          <button
            onClick={markToday}
          disabled={isTodayDone}
            className={`
              group w-full relative overflow-hidden rounded-3xl p-8 transition-all duration-500
              ${isTodayDone 
                ? 'shadow-inner ring-4 ring-[#8FB996] ring-opacity-20' 
                : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 hover:shadow-lg hover:-translate-y-1'
              }
            `}
            style={{
              backgroundImage: `url('https://i.pinimg.com/1200x/8a/0e/d5/8a0ed54065a51b024e6e90eca4da340e.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className={`absolute inset-0 transition-all duration-500 ${isTodayDone ? 'bg-[#8FB996] bg-opacity-90' : 'bg-white bg-opacity-70'}`} />

            <div className="relative z-10 flex flex-col items-center justify-center gap-3">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm
                ${isTodayDone ? 'bg-[#FDFCF8] text-[#8FB996]' : 'bg-[#FAD9E0] text-[#D88C9A] group-hover:scale-110'}
              `}>
                {isTodayDone ? <Check size={32} strokeWidth={3} /> : <Leaf size={32} />}
              </div>
              
              <div className="text-center">
                <h2 className={`text-2xl font-hand font-bold transition-colors ${isTodayDone ? 'text-white' : 'text-stone-700'}`}>
                  {isTodayDone ? "All done for today!" : "Did you write today?"}
                </h2>
                <p className={`text-sm mt-1 transition-colors ${isTodayDone ? 'text-[#D1E2C4]' : 'text-stone-500'}`}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-2xl mb-12">
          <StatCard 
            icon={Calendar} 
            label="Total Days" 
            value={stats.total} 
            colorClass="bg-[#E6A4B4]" 
          />
          <StatCard 
            icon={Flame} 
            label="Current Streak" 
            value={stats.currentStreak} 
            colorClass="bg-[#E8C39E]" 
          />
          <StatCard 
            icon={Award} 
            label="Max Streak" 
            value={stats.maxStreak} 
            colorClass="bg-[#8FB996]" 
          />
        </div>

        {/* HEATMAP SECTION */}
        <div 
          className="w-full max-w-4xl rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm relative overflow-hidden"
          style={{
            backgroundImage: `url('https://i.pinimg.com/1200x/8a/0e/d5/8a0ed54065a51b024e6e90eca4da340e.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm" />

          <div className="relative z-10">
            <div className="flex justify-between items-end mb-6">
              <h3 className="font-hand text-2xl text-stone-700">Yearly Overview</h3>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-sans text-[#8FB996] transition-opacity duration-500 flex items-center gap-1 ${showSaveMsg ? 'opacity-100' : 'opacity-0'}`}>
                  <Save size={12} /> Saved
                </span>
                <span className="text-xs text-stone-400 font-sans bg-stone-100 px-2 py-1 rounded-md">{yearView}</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
              <div className="inline-flex flex-col gap-1 min-w-max">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                  <div key={dayIndex} className="flex gap-1">
                    <div className="w-8 text-[10px] text-stone-400 flex items-center h-3">
                      {dayIndex === 1 ? 'Mon' : dayIndex === 3 ? 'Wed' : dayIndex === 5 ? 'Fri' : ''}
                    </div>
                    {calendarData.map((week, weekIndex) => {
                      const date = week[dayIndex];
                      if (!date) return <div key={weekIndex} className="w-3 h-3 m-[1.5px] bg-transparent" />;
                      return (
                        <HeatmapCell
                          key={weekIndex}
                          dateObj={date}
                          isCompleted={completedDates.has(formatDate(date))}
                          isClickable={formatDate(date) === todayStr && !completedDates.has(formatDate(date))}
                          onClick={markDate}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-1 mt-2 pl-8 min-w-max">
                {calendarData.map((week, i) => {
                   const date = week.find(d => d !== null);
                   if (!date) return <div key={i} className="w-3 mx-[1.5px]" />;

                   let showLabel = false;
                   if (i === 0) {
                     showLabel = true;
                   } else {
                     const prevWeek = calendarData[i-1];
                     const prevDate = prevWeek.find(d => d !== null);
                     if (prevDate && prevDate.getMonth() !== date.getMonth()) {
                       showLabel = true;
                     }
                   }

                   if (showLabel) {
                     return (
                       <div key={i} className="text-[10px] text-stone-400 w-3 mx-[1.5px] overflow-visible whitespace-nowrap">
                         {date.toLocaleString('default', { month: 'short' })}
                       </div>
                     );
                   }
                   return <div key={i} className="w-3 mx-[1.5px]" />;
                })}
              </div>
            </div>
            
            <div className="flex justify-end items-center gap-2 mt-4 text-[10px] text-stone-400">
               <span>Less</span>
               <div className="w-3 h-3 bg-[#EFEBE9] rounded-[3px]"></div>
               <div className="w-3 h-3 bg-[#8FB996] rounded-[3px]"></div>
               <span>More</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-16 pb-8 flex flex-col items-center gap-4 text-center text-stone-400 text-sm font-hand">
          <p>"The pages are still blank, but there is a miraculous feeling of the words being there."</p>
        </footer>

      </div>
    </div>
  );
}
