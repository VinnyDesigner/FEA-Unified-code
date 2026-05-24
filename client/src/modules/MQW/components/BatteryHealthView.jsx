import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

// Exact mock dataset reflecting the slight voltage variations between 13.0V and 14.0V
const nearshoreData = [
  { time: '01/03/2026, 12:00:00 Am', volt: 13.3 },
  { time: '02/03', volt: 13.6 },
  { time: '05/03', volt: 13.5 },
  { time: '10/03', volt: 13.4 },
  { time: '15/03', volt: 13.8 },
  { time: '20/03', volt: 13.2 },
  { time: '25/03', volt: 13.4 },
  { time: '28/03', volt: 13.5 },
  { time: '30/03', volt: 13.8 },
  { time: '1/04/2026, 12:00:00 AM', volt: 13.2 }
];

const offshoreData = [
  { time: '01/03/2026, 12:00:00 Am', volt: 13.7 },
  { time: '02/03', volt: 13.9 },
  { time: '05/03', volt: 13.6 },
  { time: '10/03', volt: 13.5 },
  { time: '15/03', volt: 13.9 },
  { time: '20/03', volt: 13.6 },
  { time: '25/03', volt: 13.7 },
  { time: '28/03', volt: 13.5 },
  { time: '30/03', volt: 13.9 },
  { time: '1/04/2026, 12:00:00 AM', volt: 13.5 }
];

const alAqahData = [
  { time: '01/03/2026, 12:00:00 Am', volt: 13.5 },
  { time: '02/03', volt: 13.7 },
  { time: '05/03', volt: 13.6 },
  { time: '10/03', volt: 13.8 },
  { time: '15/03', volt: 13.7 },
  { time: '20/03', volt: 13.5 },
  { time: '25/03', volt: 13.6 },
  { time: '28/03', volt: 13.8 },
  { time: '30/03', volt: 13.7 },
  { time: '1/04/2026, 12:00:00 AM', volt: 13.6 }
];

const northDibbahData = [
  { time: '01/03/2026, 12:00:00 Am', volt: 13.2 },
  { time: '02/03', volt: 13.4 },
  { time: '05/03', volt: 13.3 },
  { time: '10/03', volt: 13.5 },
  { time: '15/03', volt: 13.4 },
  { time: '20/03', volt: 13.2 },
  { time: '25/03', volt: 13.3 },
  { time: '28/03', volt: 13.4 },
  { time: '30/03', volt: 13.5 },
  { time: '1/04/2026, 12:00:00 AM', volt: 13.3 }
];

// Circular Barometer Gauge component drawing exact SVG layout shown in mockup
const CircularBarometer = ({ label, value = 14 }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center p-6 relative overflow-hidden flex-shrink-0 animate-fadeIn"
      style={{
        borderRadius: '22px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(2, 2, 2, 0.06)',
        backdropFilter: 'blur(10px)',
        width: '100%',
        height: '100%',
        minHeight: '240px'
      }}
    >
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          
          {/* Red Arc Segment (135° to 225°) */}
          <path 
            d="M 30.3 89.7 A 42 42 0 0 1 30.3 30.3" 
            fill="none" 
            stroke="#EF4444" 
            strokeWidth="5" 
            strokeLinecap="round"
          />

          {/* Yellow/Orange Arc Segment (225° to 315°) */}
          <path 
            d="M 30.3 30.3 A 42 42 0 0 1 89.7 30.3" 
            fill="none" 
            stroke="#F59E0B" 
            strokeWidth="5" 
          />

          {/* Green Arc Segment (315° to 405° / 45°) */}
          <path 
            d="M 89.7 30.3 A 42 42 0 0 1 89.7 89.7" 
            fill="none" 
            stroke="#10B981" 
            strokeWidth="5" 
            strokeLinecap="round"
          />

          {/* Outer scale tick marks */}
          {[...Array(15)].map((_, i) => {
            const angle = 135 + (i * 19.2); // spread 14 points across 270 degrees
            const rad = (angle * Math.PI) / 180;
            const x1 = 60 + 44 * Math.cos(rad);
            const y1 = 60 + 44 * Math.sin(rad);
            const x2 = 60 + 48 * Math.cos(rad);
            const y2 = 60 + 48 * Math.sin(rad);
            return (
              <line 
                key={i} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke="rgba(255, 255, 255, 0.3)" 
                strokeWidth="1" 
              />
            );
          })}

          {/* Scale labels (0, 4, 8, 10, 12, 14) */}
          {[
            { label: '0', val: 0 },
            { label: '4', val: 4 },
            { label: '8', val: 8 },
            { label: '10', val: 10 },
            { label: '12', val: 12 },
            { label: '14', val: 14 }
          ].map((item, idx) => {
            const angle = 135 + (item.val * 19.2);
            const rad = (angle * Math.PI) / 180;
            const tx = 60 + 34 * Math.cos(rad);
            const ty = 60 + 34 * Math.sin(rad);
            return (
              <text 
                key={idx}
                x={tx}
                y={ty}
                fill="rgba(255,255,255,0.6)"
                fontSize="6.5"
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {item.label}
              </text>
            );
          })}

          {/* Rotating White Needle Pointer (pointing to 14, angle ~130 deg relative to pivot point) */}
          <polygon 
            points="60,60 57,60 60,20 63,60" 
            fill="#FFFFFF" 
            transform="rotate(130, 60, 60)" 
          />
          
          {/* Central White Dot */}
          <circle cx="60" cy="60" r="4.5" fill="#FFFFFF" />
          <circle cx="60" cy="60" r="2" fill="#000000" />
        </svg>

        {/* Big digit indicator */}
        <div className="absolute bottom-4 flex flex-col items-center">
          <span className="text-[28px] font-black text-white leading-none">{value}</span>
        </div>
      </div>

      {/* Barometer Footer Labels */}
      <div className="text-center mt-2">
        <span className="text-[15px] font-bold text-white block leading-tight">{label}</span>
        <span className="text-[11px] text-white/50 uppercase tracking-wider block mt-0.5">Battery Voltage</span>
      </div>
    </div>
  );
};

const BatteryHealthView = ({ isMobile = false, selectedBuoy = 'Al Aqah Buoy', selectedDuration = 'Last Day' }) => {
  const { t } = useTranslation();

  const getDurationData = (stationKey) => {
    const hourData = {
      nearshore: [
        { time: '09:00', volt: 13.2 },
        { time: '11:00', volt: 13.4 },
        { time: '13:00', volt: 13.3 },
        { time: '15:00', volt: 13.5 },
        { time: '17:00', volt: 13.4 },
        { time: '19:00', volt: 13.6 },
        { time: '21:00', volt: 13.2 }
      ],
      offshore: [
        { time: '09:00', volt: 13.6 },
        { time: '11:00', volt: 13.8 },
        { time: '13:00', volt: 13.7 },
        { time: '15:00', volt: 13.9 },
        { time: '17:00', volt: 13.8 },
        { time: '19:00', volt: 14.0 },
        { time: '21:00', volt: 13.5 }
      ],
      alAqah: [
        { time: '09:00', volt: 13.4 },
        { time: '11:00', volt: 13.6 },
        { time: '13:00', volt: 13.5 },
        { time: '15:00', volt: 13.7 },
        { time: '17:00', volt: 13.6 },
        { time: '19:00', volt: 13.8 },
        { time: '21:00', volt: 13.6 }
      ],
      northDibbah: [
        { time: '09:00', volt: 13.1 },
        { time: '11:00', volt: 13.3 },
        { time: '13:00', volt: 13.2 },
        { time: '15:00', volt: 13.4 },
        { time: '17:00', volt: 13.3 },
        { time: '19:00', volt: 13.5 },
        { time: '21:00', volt: 13.3 }
      ]
    };

    const weekData = {
      nearshore: [
        { time: 'Mon', volt: 13.3 },
        { time: 'Tue', volt: 13.5 },
        { time: 'Wed', volt: 13.4 },
        { time: 'Thu', volt: 13.6 },
        { time: 'Fri', volt: 13.5 },
        { time: 'Sat', volt: 13.8 },
        { time: 'Sun', volt: 13.2 }
      ],
      offshore: [
        { time: 'Mon', volt: 13.7 },
        { time: 'Tue', volt: 13.9 },
        { time: 'Wed', volt: 13.8 },
        { time: 'Thu', volt: 14.0 },
        { time: 'Fri', volt: 13.9 },
        { time: 'Sat', volt: 14.2 },
        { time: 'Sun', volt: 13.5 }
      ],
      alAqah: [
        { time: 'Mon', volt: 13.5 },
        { time: 'Tue', volt: 13.7 },
        { time: 'Wed', volt: 13.6 },
        { time: 'Thu', volt: 13.8 },
        { time: 'Fri', volt: 13.7 },
        { time: 'Sat', volt: 13.9 },
        { time: 'Sun', volt: 13.6 }
      ],
      northDibbah: [
        { time: 'Mon', volt: 13.2 },
        { time: 'Tue', volt: 13.4 },
        { time: 'Wed', volt: 13.3 },
        { time: 'Thu', volt: 13.5 },
        { time: 'Fri', volt: 13.4 },
        { time: 'Sat', volt: 13.6 },
        { time: 'Sun', volt: 13.3 }
      ]
    };

    const monthData = {
      nearshore: [
        { time: '01/03', volt: 13.3 },
        { time: '05/03', volt: 13.6 },
        { time: '10/03', volt: 13.5 },
        { time: '15/03', volt: 13.8 },
        { time: '20/03', volt: 13.2 },
        { time: '25/03', volt: 13.4 },
        { time: '30/03', volt: 13.8 }
      ],
      offshore: [
        { time: '01/03', volt: 13.7 },
        { time: '05/03', volt: 13.9 },
        { time: '10/03', volt: 13.6 },
        { time: '15/03', volt: 13.9 },
        { time: '20/03', volt: 13.6 },
        { time: '25/03', volt: 13.7 },
        { time: '30/03', volt: 13.9 }
      ],
      alAqah: [
        { time: '01/03', volt: 13.5 },
        { time: '05/03', volt: 13.7 },
        { time: '10/03', volt: 13.6 },
        { time: '15/03', volt: 13.8 },
        { time: '20/03', volt: 13.7 },
        { time: '25/03', volt: 13.5 },
        { time: '30/03', volt: 13.7 }
      ],
      northDibbah: [
        { time: '01/03', volt: 13.2 },
        { time: '05/03', volt: 13.4 },
        { time: '10/03', volt: 13.3 },
        { time: '15/03', volt: 13.5 },
        { time: '20/03', volt: 13.4 },
        { time: '25/03', volt: 13.2 },
        { time: '30/03', volt: 13.5 }
      ]
    };

    const threeMonthsData = {
      nearshore: [
        { time: 'Mar', volt: 13.4 },
        { time: 'Apr', volt: 13.6 },
        { time: 'May', volt: 13.3 }
      ],
      offshore: [
        { time: 'Mar', volt: 13.8 },
        { time: 'Apr', volt: 14.0 },
        { time: 'May', volt: 13.6 }
      ],
      alAqah: [
        { time: 'Mar', volt: 13.6 },
        { time: 'Apr', volt: 13.7 },
        { time: 'May', volt: 13.5 }
      ],
      northDibbah: [
        { time: 'Mar', volt: 13.3 },
        { time: 'Apr', volt: 13.5 },
        { time: 'May', volt: 13.2 }
      ]
    };

    if (selectedDuration === 'Live Data' || selectedDuration === 'Last Day' || selectedDuration === 'Today' || selectedDuration === 'Daily') {
      return hourData[stationKey];
    } else if (selectedDuration === 'Last Week' || selectedDuration === 'Weekly') {
      return weekData[stationKey];
    } else if (selectedDuration === 'Last Month' || selectedDuration === 'Last One Month' || selectedDuration === 'Monthly') {
      return monthData[stationKey];
    } else if (selectedDuration === 'Last Three Months') {
      return threeMonthsData[stationKey];
    }
    return monthData[stationKey];
  };

  // Resolve which stations are selected (supports arrays, strings, and All/4 Stations fallback)
  const selectedArray = Array.isArray(selectedBuoy)
    ? selectedBuoy
    : selectedBuoy === 'All Stations' || selectedBuoy === '4 Stations'
      ? ['Near Shore Buoy', 'Offshore Buoy', 'Al Aqah Buoy', 'North Dibbah']
      : [selectedBuoy];

  const showNearshore = selectedArray.includes('Near Shore Buoy') || selectedArray.includes('All Stations');
  const showOffshore = selectedArray.includes('Offshore Buoy') || selectedArray.includes('All Stations');
  const showAlAqah = selectedArray.includes('Al Aqah Buoy') || selectedArray.includes('All Stations');
  const showNorthDibbah = selectedArray.includes('North Dibbah') || selectedArray.includes('All Stations');

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto analytics-panel-scroll">

      {/* ROW 1: Nearshore Buoy Battery Health */}
      {showNearshore && (
        <div className={`flex flex-col ${isMobile ? 'gap-4' : 'lg:flex-row gap-6 w-full'} animate-fadeIn`}>
          
          {/* Left Side: Chart */}
          <div 
            className="flex-1 flex flex-col p-6 min-h-[240px]"
            style={{
              borderRadius: '22px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-[16px] font-bold">Nearshore Buoy Battery Health</h3>
              
              {/* Legend Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="w-3 h-1.5 rounded-sm bg-[#EF4444]" />
                <span className="text-[10px] font-bold text-white/80">Batt Volt Min</span>
              </div>
            </div>

            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDurationData('nearshore')} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(tick, idx) => (idx === 0 || idx === getDurationData('nearshore').length - 1) ? tick : ''}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    domain={[8, 15]}
                    ticks={[8, 10, 12, 14, 15]}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(0, 22, 26, 0.85)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volt" 
                    stroke="#EF4444" 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#FFFFFF', stroke: '#EF4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Side: Barometer Gauge */}
          <div className={isMobile ? 'w-full' : 'lg:w-[320px] flex flex-col'}>
            <CircularBarometer label="Nearshore" value={13.2} />
          </div>

        </div>
      )}

      {/* ROW 2: Offshore Buoy Battery Health */}
      {showOffshore && (
        <div className={`flex flex-col ${isMobile ? 'gap-4' : 'lg:flex-row gap-6 w-full'} animate-fadeIn`}>
          
          {/* Left Side: Chart */}
          <div 
            className="flex-1 flex flex-col p-6 min-h-[240px]"
            style={{
              borderRadius: '22px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-[16px] font-bold">Offshore Buoy Battery Health</h3>
              
              {/* Legend Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="w-3 h-1.5 rounded-sm bg-[#A855F7]" />
                <span className="text-[10px] font-bold text-white/80">Batt Volt Min</span>
              </div>
            </div>

            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDurationData('offshore')} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(tick, idx) => (idx === 0 || idx === getDurationData('offshore').length - 1) ? tick : ''}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    domain={[8, 15]}
                    ticks={[8, 10, 12, 14, 15]}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(0, 22, 26, 0.85)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volt" 
                    stroke="#A855F7" 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#FFFFFF', stroke: '#A855F7', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Side: Barometer Gauge */}
          <div className={isMobile ? 'w-full' : 'lg:w-[320px] flex flex-col'}>
            <CircularBarometer label="Offshore" value={13.5} />
          </div>

        </div>
      )}

      {/* ROW 3: Al Aqah Buoy Battery Health */}
      {showAlAqah && (
        <div className={`flex flex-col ${isMobile ? 'gap-4' : 'lg:flex-row gap-6 w-full'} animate-fadeIn`}>
          
          {/* Left Side: Chart */}
          <div 
            className="flex-1 flex flex-col p-6 min-h-[240px]"
            style={{
              borderRadius: '22px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-[16px] font-bold">Al Aqah Buoy Battery Health</h3>
              
              {/* Legend Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="w-3 h-1.5 rounded-sm bg-[#10B981]" />
                <span className="text-[10px] font-bold text-white/80">Batt Volt Min</span>
              </div>
            </div>

            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDurationData('alAqah')} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(tick, idx) => (idx === 0 || idx === getDurationData('alAqah').length - 1) ? tick : ''}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    domain={[8, 15]}
                    ticks={[8, 10, 12, 14, 15]}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(0, 22, 26, 0.85)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volt" 
                    stroke="#10B981" 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#FFFFFF', stroke: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Side: Barometer Gauge */}
          <div className={isMobile ? 'w-full' : 'lg:w-[320px] flex flex-col'}>
            <CircularBarometer label="Al Aqah" value={13.6} />
          </div>

        </div>
      )}

      {/* ROW 4: North Dibbah Buoy Battery Health */}
      {showNorthDibbah && (
        <div className={`flex flex-col ${isMobile ? 'gap-4' : 'lg:flex-row gap-6 w-full pb-6'} animate-fadeIn`}>
          
          {/* Left Side: Chart */}
          <div 
            className="flex-1 flex flex-col p-6 min-h-[240px]"
            style={{
              borderRadius: '22px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-[16px] font-bold">North Dibbah Buoy Battery Health</h3>
              
              {/* Legend Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="w-3 h-1.5 rounded-sm bg-[#F59E0B]" />
                <span className="text-[10px] font-bold text-white/80">Batt Volt Min</span>
              </div>
            </div>

            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDurationData('northDibbah')} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(tick, idx) => (idx === 0 || idx === getDurationData('northDibbah').length - 1) ? tick : ''}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    domain={[8, 15]}
                    ticks={[8, 10, 12, 14, 15]}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(0, 22, 26, 0.85)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volt" 
                    stroke="#F59E0B" 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#FFFFFF', stroke: '#F59E0B', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Side: Barometer Gauge */}
          <div className={isMobile ? 'w-full' : 'lg:w-[320px] flex flex-col'}>
            <CircularBarometer label="North Dibbah" value={13.3} />
          </div>

        </div>
      )}

    </div>
  );
};

export default BatteryHealthView;
