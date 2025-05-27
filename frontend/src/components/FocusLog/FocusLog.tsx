import React, { useEffect, useState } from 'react';
import './FocusLog.css';
import Calendar from '../Calendar/Calendar';
import { motion } from 'framer-motion';
import { useSupabase } from "../../contexts/SupabaseContext";

interface FocusLogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DailyData {
  date: string;
  focusTime: string;
  focusCycle: number;
  avgScore: number | null;
}

const FocusLog: React.FC<FocusLogProps> = ({ isOpen, onClose }) => {
  const [focusData, setFocusData] = useState<DailyData[]>([]);
  const [_, setAvgScore] = useState<number | null>(null);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const supabase = useSupabase();


  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchFocusData = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        console.error("No access_token found");
        return;
      }

      try {
        const user = localStorage.getItem('user');
        const userId = user ? JSON.parse(user).id : null;

        if (!userId || !token) {
          console.error("Missing user_id or token in localStorage");
          return;
        }

        const response = await fetch("https://nagai.onrender.com/sessions/monthly-focus-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            year,
            month,
            access_token: token
          })
        });

        if (!response.ok) {
          console.error("Failed to fetch focus data:", response.statusText);
          return;
        }

        const data = await response.json();
        const result: DailyData[] = [];

        let totalScoreSum = 0, scoreDays = 0;

        data.forEach((entry: any) => {
          const date = entry.day;
          const secs = entry.total_focus_secs || 0;
          const avgScore = entry.avg_focus_score != null ? Math.round(entry.avg_focus_score) : null;

          const hours = Math.floor(secs / 3600);
          const mins = Math.floor((secs % 3600) / 60);
          const timeStr = `${hours}h ${mins}m`;
          const cycle = secs / 60 / 25.0;

          if (avgScore !== null) {
            totalScoreSum += avgScore;
            scoreDays++;
          }

          result.push({
            date,
            focusTime: timeStr,
            focusCycle: parseFloat(cycle.toFixed(1)),
            avgScore: avgScore,
          });
        });

        setFocusData(result);
        result.forEach(d => {
          console.log(`🔍 ${d.date} → ${d.focusTime} (${d.avgScore ?? "N/A"})`);
        });

        setAvgScore(scoreDays ? Math.round(totalScoreSum / scoreDays) : null);
      } catch (error) {
        console.error("Error fetching focus data:", error);
      }
    };

    fetchFocusData();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Focus Log</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <Calendar data={focusData} />
        </div>
      </div>
    </motion.div>
  );
};

export default FocusLog;
