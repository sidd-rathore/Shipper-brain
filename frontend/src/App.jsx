import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Ship, Activity, Calendar, Layers } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [route, setRoute] = useState("SHANGHAI_TO_LA");
  const [loading, setLoading] = useState(false);
  
  // --- NEW CONTROLS STATE ---
  const [daysAhead, setDaysAhead] = useState(30); // Default 1 Month
  const [showLastYear, setShowLastYear] = useState(false); // Toggle off by default
  const API_URL = "https://shipper-brain.onrender.com";
  const fetchPrediction = async () => {
    setLoading(true);
    try {
      // We pass the 'daysAhead' state to the API
      const response = await axios.get(`${API_URL}/predict/${route}?days_ahead=${daysAhead}`);
      setData(response.data.forecast);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever Route OR DaysAhead changes
  useEffect(() => {
    fetchPrediction();
  }, [route, daysAhead]);

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Ship size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold"> <span className="text-blue-400">DemandAI</span></h1>
              <p className="text-slate-400 text-sm">Predictive Logistics Engine</p>
            </div>
          </div>
          
          <select 
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="mt-4 md:mt-0 bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SHANGHAI_TO_LA">Shanghai ➔ Los Angeles</option>
            <option value="ROTTERDAM_TO_NY">Rotterdam ➔ New York</option>
            <option value="MUMBAI_TO_DUBAI">Mumbai ➔ Dubai</option>
          </select>
        </header>

        {/* --- CONTROLS BAR (NEW) --- */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Time Range Selectors */}
            <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm text-slate-400 mr-2">Forecast Horizon:</span>
                <div className="flex bg-slate-900 rounded-lg p-1">
                    {[
                        { label: '1W', days: 7 },
                        { label: '1M', days: 30 },
                        { label: '3M', days: 90 },
                        { label: '6M', days: 180 }
                    ].map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => setDaysAhead(opt.days)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                daysAhead === opt.days 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comparison Toggle */}
            <button 
                onClick={() => setShowLastYear(!showLastYear)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    showLastYear 
                    ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                    : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
            >
                <Layers size={18} />
                <span>Last Year Trend</span>
                <div className={`w-3 h-3 rounded-full ml-1 ${showLastYear ? 'bg-purple-500' : 'bg-slate-600'}`}></div>
            </button>
        </div>

        {/* --- MAIN CHART --- */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="text-blue-500" size={20}/> 
              Volume Forecast
            </h2>
            {loading && <span className="text-xs text-blue-400 animate-pulse">Running AI Model...</span>}
          </div>
          
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="top" height={36}/>
                
                {/* 1. Confidence Interval Area */}
                <Area 
                    type="monotone" 
                    dataKey="upper_bound" 
                    stroke="none" 
                    fill="#3b82f6" 
                    fillOpacity={0.1} 
                />

                {/* 2. Last Year Line (Only shows if toggled) */}
                {showLastYear && (
                    <Line 
                        name="Last Year (Actual)"
                        type="monotone" 
                        dataKey="last_year_teu" 
                        stroke="#a855f7" // Purple color
                        strokeWidth={2} 
                        strokeDasharray="5 5" // Dashed line to indicate history
                        dot={false}
                    />
                )}

                {/* 3. Main Prediction Line */}
                <Line 
                    name="2026 Forecast (AI)"
                    type="monotone" 
                    dataKey="predicted_teu" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 8 }}
                />
                
                <ReferenceLine y={9500} label="Max Capacity" stroke="#ef4444" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
