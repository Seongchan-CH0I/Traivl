"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarProps {
    onConfirm: (startDate: Date, endDate: Date) => void;
    onCancel: () => void;
}

export default function CalendarPicker({ onConfirm, onCancel }: CalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Picker state
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        
        if (!startDate || (startDate && endDate)) {
            setStartDate(selectedDate);
            setEndDate(null);
        } else if (selectedDate < startDate) {
            setStartDate(selectedDate);
            setEndDate(null);
        } else if (selectedDate.getTime() === startDate.getTime()) {
            setStartDate(null);
        } else {
            setEndDate(selectedDate);
        }
    };

    const isInRange = (day: number) => {
        if (!startDate || !endDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date > startDate && date < endDate;
    };

    const isSelected = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return (startDate && date.getTime() === startDate.getTime()) || 
               (endDate && date.getTime() === endDate.getTime());
    };

    const isStart = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return startDate && date.getTime() === startDate.getTime();
    };

    const isEnd = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return endDate && date.getTime() === endDate.getTime();
    };

    const formatDateRange = () => {
        const format = (d: Date) => `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
        if (startDate && endDate) {
            return `${format(startDate)} ~ ${format(endDate)}`;
        } else if (startDate) {
            return `${format(startDate)} ~ `;
        }
        return "";
    };

    const handleMonthSelect = (month: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
        setShowMonthPicker(false);
    };

    const handleYearSelect = (year: number) => {
        setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
        setShowYearPicker(false);
    };

    const renderDays = () => {
        const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
        const firstDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
        const days = [];

        // Empty cells for days of prev month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="cal-day-cell empty"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayOfWeek = date.getDay();
            const isSun = dayOfWeek === 0;
            const isSat = dayOfWeek === 6;

            let cellClass = "cal-day-cell";
            if (isSun) cellClass += " sun";
            if (isSat) cellClass += " sat";
            if (isInRange(day)) cellClass += " in-range";
            if (isStart(day) && endDate) cellClass += " range-start";
            if (isEnd(day)) cellClass += " range-end";

            days.push(
                <div key={day} className={cellClass} onClick={() => handleDateClick(day)}>
                    <div className={isSelected(day) ? "selected-circle" : ""}>
                        {day}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="cal-container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="cal-header">
                <button className="cal-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                <div style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <h3 onClick={() => setShowMonthPicker(true)}>{currentMonth.getMonth() + 1}월</h3>
                    <div className="cal-year" onClick={() => setShowYearPicker(true)}>{currentMonth.getFullYear()}</div>
                </div>
                <button className="cal-nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
            </div>

            <div className="cal-grid-header">
                <div className="cal-day-label sun">일</div>
                <div className="cal-day-label">월</div>
                <div className="cal-day-label">화</div>
                <div className="cal-day-label">수</div>
                <div className="cal-day-label">목</div>
                <div className="cal-day-label">금</div>
                <div className="cal-day-label sat">토</div>
            </div>

            <div className="cal-grid" style={{ flex: 1 }}>
                {renderDays()}
            </div>

            <div className="cal-result-area" style={{ flexShrink: 0 }}>
                <div className="cal-result-text">{formatDateRange() || "날짜를 선택해주세요"}</div>
            </div>

            <div className="cal-footer" style={{ marginTop: 'auto', flexShrink: 0 }}>
                <button className="cal-btn-cancel" onClick={onCancel}>취소</button>
                <button 
                  className="cal-btn-confirm" 
                  onClick={() => startDate && endDate && onConfirm(startDate, endDate)}
                  disabled={!startDate || !endDate}
                  style={{ opacity: (startDate && endDate) ? 1 : 0.6 }}
                >
                    다음으로
                </button>
            </div>

            {/* Month Picker Overlay */}
            {showMonthPicker && (
                <div className="cal-picker-overlay">
                    <div className="cal-picker-header">
                        <h4>월 선택</h4>
                        <button className="cal-nav-btn" onClick={() => setShowMonthPicker(false)}><X size={20} /></button>
                    </div>
                    <div className="cal-picker-grid">
                        {Array.from({ length: 12 }, (_, i) => (
                            <div 
                                key={i} 
                                className={`cal-picker-item ${currentMonth.getMonth() === i ? 'selected' : ''}`}
                                onClick={() => handleMonthSelect(i)}
                            >
                                {i + 1}월
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Year Picker Overlay */}
            {showYearPicker && (
                <div className="cal-picker-overlay">
                    <div className="cal-picker-header">
                        <h4>연도 선택</h4>
                        <button className="cal-nav-btn" onClick={() => setShowYearPicker(false)}><X size={20} /></button>
                    </div>
                    <div className="cal-picker-grid" style={{ overflowY: 'auto' }}>
                        {Array.from({ length: 2100 - (today.getFullYear() - 2) + 1 }, (_, i) => today.getFullYear() - 2 + i).map(year => (
                            <div 
                                key={year} 
                                className={`cal-picker-item ${currentMonth.getFullYear() === year ? 'selected' : ''}`}
                                onClick={() => handleYearSelect(year)}
                            >
                                {year}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
