'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import type { DiaryEntry } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface MoodCalendarProps {
  entries: DiaryEntry[];
  currentMood?: string;
  currentMoodColor?: string;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export function MoodCalendar({ entries, currentMood, currentMoodColor, selectedDate, onDateSelect }: MoodCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isTypingYear, setIsTypingYear] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const { year, month, weeks, entryMap } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Create a map of date strings to entries
    const entryMap = new Map<string, DiaryEntry>();
    entries.forEach((entry) => {
      const dateStr = entry.entryDate.toISOString().split('T')[0];
      entryMap.set(dateStr, entry);
    });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Build calendar weeks
    const weeks: Array<Array<Date | null>> = [];
    let currentWeek: Array<Date | null> = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return { year, month, weeks, entryMap };
  }, [entries, viewDate]);

  const getEntryForDate = (date: Date | null): DiaryEntry | undefined => {
    if (!date) return undefined;
    const dateStr = date.toISOString().split('T')[0];
    return entryMap.get(dateStr);
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = () => {
    setIsEditingDate(true);
    setDateInput('');
    setSuggestion('');
    setIsTypingYear(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDateInputChange = (value: string) => {
    setDateInput(value);

    if (isTypingYear) {
      // Typing year - no suggestions
      setSuggestion('');
    } else {
      // Typing month
      const lowerInput = value.toLowerCase();

      // Check if input is a number (1-12)
      const monthNum = parseInt(value);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const monthName = monthNames[monthNum - 1];
        setSuggestion(monthName);
      } else {
        // Check for month name match
        const match = monthNames.find(m => m.toLowerCase().startsWith(lowerInput));
        if (match && lowerInput.length > 0) {
          setSuggestion(match);
        } else {
          setSuggestion('');
        }
      }
    }
  };

  const handleDateInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && suggestion && !isTypingYear) {
      e.preventDefault();
      setDateInput(suggestion);
      setSuggestion('');
      setIsTypingYear(true);
    } else if (e.key === 'Enter') {
      if (isTypingYear) {
        // Finalize year
        const yearNum = parseInt(dateInput);
        if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
          setViewDate(new Date(yearNum, month, 1));
          setIsEditingDate(false);
        }
      } else if (suggestion) {
        // Accept suggestion and move to year
        setDateInput(suggestion);
        setSuggestion('');
        setIsTypingYear(true);
      } else {
        // Try to parse month
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === dateInput.toLowerCase());
        const monthNum = parseInt(dateInput);

        if (monthIndex !== -1) {
          setViewDate(new Date(year, monthIndex, 1));
          setIsEditingDate(false);
        } else if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
          setViewDate(new Date(year, monthNum - 1, 1));
          setIsEditingDate(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsEditingDate(false);
    } else if (e.key === ' ' && !isTypingYear && suggestion) {
      // Space also accepts suggestion
      e.preventDefault();
      setDateInput(suggestion);
      setSuggestion('');
      setIsTypingYear(true);
    }
  };

  useEffect(() => {
    if (isEditingDate && isTypingYear && dateInput && suggestion === '') {
      // User accepted month, now show year prompt
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === dateInput.toLowerCase());
      if (monthIndex !== -1) {
        setDateInput('');
      }
    }
  }, [isTypingYear, dateInput, suggestion]);

  const today = new Date().toISOString().split('T')[0];
  const selectedDateStr = selectedDate?.toISOString().split('T')[0];
  const selectedEntry = selectedDate ? getEntryForDate(selectedDate) : null;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {isEditingDate ? (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={dateInput}
                onChange={(e) => handleDateInputChange(e.target.value)}
                onKeyDown={handleDateInputKeyDown}
                onBlur={() => setIsEditingDate(false)}
                placeholder={isTypingYear ? 'Year (e.g. 2024)' : 'Month name or number'}
                className="px-4 py-1 bg-white/10 border border-white/20 rounded-lg text-center text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-star-gold/50 min-w-[200px]"
              />
              {suggestion && !isTypingYear && (
                <div className="absolute left-0 right-0 top-full mt-1 px-4 py-2 bg-black/90 border border-white/20 rounded-lg text-sm text-gray-300 backdrop-blur-sm z-10">
                  {suggestion} (press Tab or Space)
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleDateClick}
              className="text-xl font-medium text-white hover:text-star-gold transition-colors cursor-pointer"
            >
              {monthNames[month]} {year}
            </button>
          )}

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {currentMood && (
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentMoodColor }}
            />
            <p className="text-sm text-gray-400">
              Current mood: <span className="text-white capitalize">{currentMood}</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={dayIndex} className="aspect-square" />;
              }

              const entry = getEntryForDate(date);
              const dateStr = date.toISOString().split('T')[0];
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDateStr;
              const hasEntry = !!entry;

              return (
                <motion.button
                  key={dayIndex}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDateSelect(date)}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                    transition-all duration-200 relative cursor-pointer
                    ${isToday ? 'ring-2 ring-white/50' : ''}
                    ${isSelected ? 'ring-2 ring-star-gold' : ''}
                    ${hasEntry
                      ? 'bg-gradient-to-br from-white/20 to-white/10 text-white hover:from-white/30 hover:to-white/20'
                      : 'bg-white/5 text-gray-600 hover:bg-white/10'
                    }
                  `}
                  style={{
                    backgroundColor: hasEntry && currentMoodColor
                      ? `${currentMoodColor}40`
                      : undefined,
                    borderColor: hasEntry && currentMoodColor
                      ? `${currentMoodColor}80`
                      : undefined,
                    borderWidth: hasEntry ? '1px' : undefined,
                  }}
                >
                  {date.getDate()}
                  {hasEntry && (
                    <div
                      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: currentMoodColor || '#fff' }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span>Days with entries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-star-gold" />
            <span>Selected date</span>
          </div>
        </div>
      </div>

      {/* Selected entry preview */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-4 bg-white/10 border border-white/20 rounded-lg"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-300">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {selectedEntry ? (
              <p className="text-gray-200 text-sm leading-relaxed line-clamp-4">
                {selectedEntry.content}
              </p>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No entry for this day. Write one on the left.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
