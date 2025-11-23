import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from './utils';
import { Button } from './button';
import { Calendar } from './calendar';

interface DatePickerWithTimeProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
}

export const DatePickerWithTime: React.FC<DatePickerWithTimeProps> = ({ label, value, onChange }) => {
    const [date, setDate] = React.useState<Date | undefined>(() => {
        if (!value) return undefined;
        // Handle both "YYYY-MM-DD HH:mm" and "YYYY-MM-DDTHH:mm" formats
        const dStr = value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
        if (dStr) {
            const [y, m, day] = dStr.split('-').map(Number);
            return new Date(y, m - 1, day);
        }
        return undefined;
    });

    const [time, setTime] = React.useState(() => {
        if (!value) return "12:00";
        // Handle both "YYYY-MM-DD HH:mm" and "YYYY-MM-DDTHH:mm" formats
        const tStr = value.includes('T') ? value.split('T')[1] : value.split(' ')[1];
        return tStr ? tStr.substring(0, 5) : "12:00"; // Ensure HH:mm
    });

    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (date && time) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            // Return in ISO-like format compatible with backend expectations or UI needs
            // EventForge uses "YYYY-MM-DD HH:mm", EventEditModal uses ISO.
            // Let's standardize on "YYYY-MM-DD HH:mm" for display/internal logic, 
            // but the parent component can transform it if needed.
            // Wait, EventForge expects "YYYY-MM-DD HH:mm".
            onChange(`${y}-${m}-${d} ${time}`);
        }
    }, [date, time]);

    // Sync internal state if value prop changes externally
    React.useEffect(() => {
        if (!value) {
            setDate(undefined);
            setTime("12:00");
            return;
        }
        const dStr = value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
        const tStr = value.includes('T') ? value.split('T')[1] : value.split(' ')[1];

        if (dStr) {
            const [y, m, day] = dStr.split('-').map(Number);
            const newDate = new Date(y, m - 1, day);
            if (newDate.getTime() !== date?.getTime()) {
                setDate(newDate);
            }
        }

        if (tStr) {
            const newTime = tStr.substring(0, 5);
            if (newTime !== time) {
                setTime(newTime);
            }
        }
    }, [value]);

    return (
        <div className="space-y-2 relative">
            <label className="text-xs uppercase tracking-wider text-gray-700 ml-1">{label}</label>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant={"outline"}
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-white border-amber-200 hover:bg-amber-50 h-12 rounded-xl",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-amber-500" />
                    {date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : <span>Pick a date</span>}
                </Button>

                <div className="relative w-32">
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full h-12 bg-white border border-amber-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#F59E0B]/50 transition-colors shadow-sm text-center"
                    />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+0.5rem)] left-0 z-50 bg-white border border-amber-200 rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200">
                    <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setIsOpen(false)}
                    />
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => { setDate(d); setIsOpen(false); }}
                        initialFocus
                        className="rounded-md border-0 bg-white"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                </div>
            )}
        </div>
    );
};
