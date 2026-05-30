import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import ReportsFilterForm from '../components/ReportsFilterForm';
import { useTranslation } from 'react-i18next';
import BuoysChart from '../components/BuoysChart';
import SensorDataTable from '../components/SensorDataTable';
import DownloadDropdown from '../components/DownloadDropdown';
import { getMqwBuoys, getMqwParameters, generateReport, downloadReportFile } from '../../../lib/queries';

const DOWNLOAD_FORMAT_MAP = {
  'Download InExcel': 'XLSX',
  'Download in Word': 'DOCX',
  'Download in Pdf':  'PDF',
};

// BuoysChart / SensorDataTable select parameters by their internal `filterName`
// strings, but the filter form stores parameter IDs. A few MWQ ParameterMaster
// names also differ from those filterName strings — reconcile them here so the
// overview chart + table render the chosen parameters instead of nothing.
const PARAM_NAME_TO_CHART_FILTER = {
  'Temperature': 'Water Temperature',
  'Conductivity': 'Specific Conductivity',
  'Algae': 'Blue-Green Algae',
};

const Toast = ({ message, type, onClose }) => (
  <div
    style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
      padding: '12px 20px', borderRadius: 12, maxWidth: 380,
      background: type === 'error' ? 'rgba(220,38,38,0.92)' : 'rgba(29,205,221,0.92)',
      color: '#fff', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}
  >
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>x</button>
  </div>
);

const ReportsPage = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const buoysRef = useRef(null);
  const paramsRef = useRef(null);
  const [loadedBuoys, setLoadedBuoys] = useState([]);
  const [loadedParams, setLoadedParams] = useState([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMqwBuoys(), getMqwParameters()]).then(([buoys, params]) => {
      if (cancelled) return;
      buoysRef.current  = buoys;
      paramsRef.current = params;
      setLoadedBuoys(buoys);
      setLoadedParams(params);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const isMobile = !window.matchMedia('(min-width: 768px)').matches;

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const handleApply = (filters) => {
    setAppliedFilters(filters);
  };

  const handleDownloadAction = async (option) => {
    const format = DOWNLOAD_FORMAT_MAP[option];
    if (!format || !appliedFilters) return;

    // Filters already store IDs (selected in ReportsFilterForm via id-keyed items)
    const stationIds   = appliedFilters.station.filter(Boolean);
    const parameterIds = appliedFilters.parameter.filter(Boolean);

    if (stationIds.length === 0) {
      showToast(t('reports.errorNoStations', 'Could not resolve station IDs — please try again after the page finishes loading.'));
      return;
    }
    if (parameterIds.length === 0) {
      showToast(t('reports.errorNoParams', 'Could not resolve parameter IDs — please try again after the page finishes loading.'));
      return;
    }

    setGenerating(true);
    try {
      const report = await generateReport({
        module: 'MWQ',
        stationIds,
        parameterIds,
        startDate: new Date(appliedFilters.startDate).toISOString(),
        endDate:   new Date(appliedFilters.endDate).toISOString(),
        formats: [format],
      });
      // Use blob-based download so the Bearer token is sent (window.open would 401)
      const blob = await downloadReportFile(report.id, format);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `report_${report.id}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        const retryAfter = err?.response?.headers?.['retry-after'] || 30;
        showToast(t('reports.error429', `Too many concurrent exports. Please try again in ${retryAfter} seconds.`));
      } else if (status === 413) {
        const msg = err?.response?.data?.error?.message || 'Result set too large. Narrow your date range or filter selection.';
        showToast(msg);
      } else {
        showToast(t('reports.errorGeneric', 'Report generation failed. Please try again.'));
      }
    } finally {
      setGenerating(false);
    }
  };

  const resultsSection = (isMob) => {
    if (!appliedFilters) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <span className="text-white/50 text-[15px] font-semibold tracking-wide">{t('reports.noReportsGenerated', 'No Reports Generated Yet')}</span>
        </div>
      );
    }
    // The filter form stores parameter/station IDs; the overview chart + table
    // identify parameters by name and buoys by object. Resolve both here.
    const chartParamNames = (appliedFilters.parameter || [])
      .map((id) => loadedParams.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .map((name) => PARAM_NAME_TO_CHART_FILTER[name] || name);
    const chartBuoys = (appliedFilters.station || [])
      .map((id) => loadedBuoys.find((b) => b.id === id))
      .filter(Boolean);
    // The sensor-data API requires ISO datetimes; the form yields date-only
    // strings. Convert (end-of-day for an inclusive range) so the chart + table
    // fetch real data instead of 400-ing on a bad format.
    const startIso = appliedFilters.startDate ? new Date(appliedFilters.startDate).toISOString() : undefined;
    const endIso = appliedFilters.endDate ? new Date(`${appliedFilters.endDate}T23:59:59`).toISOString() : undefined;

    return (
      <div className="flex-1 rounded-[20px] flex flex-col relative z-[5] mt-2 mb-4"
        style={{
          background: 'radial-gradient(136.25% 136.25% at 50% 100%, rgba(29, 205, 221, 0.15) 0%, rgba(29, 205, 221, 0.03) 100%), rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex flex-col min-h-[400px]">
          <div className="flex-shrink-0 flex justify-between items-center px-4 pt-4 pb-2">
            <h2 className="text-[16px] md:text-[18px] font-bold text-white leading-tight">
              {t('analytics.buoysOverview', 'Buoys Overview')}
            </h2>
            <div className="flex items-center gap-3">
              {generating && (
                <span className="text-white/60 text-[12px] font-medium animate-pulse">
                  {t('reports.generating', 'Generating...')}
                </span>
              )}
              <DownloadDropdown t={t} onDownload={handleDownloadAction} />
            </div>
          </div>
          <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
            <div className="w-full">
              <BuoysChart
                isMobile={isMob}
                showHeader={false}
                selectedParams={chartParamNames}
                selectedBuoy={chartBuoys}
                chartType="Line"
                startDate={startIso}
                endDate={endIso}
                {...(!isMob ? { height: '150px', isGraphAndTableView: true, isTablet: false } : {})}
              />
            </div>
            <div className="w-full h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25) 10%, rgba(255, 255, 255, 0.25) 90%, transparent)' }} />
            <div className="w-full">
              <SensorDataTable
                isMobile={isMob}
                selectedBuoy={chartBuoys}
                selectedParams={chartParamNames}
                startDate={startIso}
                endDate={endIso}
                {...(!isMob ? { isGraphAndTableView: true, isTablet: false } : {})}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen lg:overflow-hidden p-0 flex flex-col bg-transparent relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isMobile && (
        <>
          <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
      )}

      {!isMobile && (
        <div className="hidden md:block z-[2000]">
          <GlobalHeader />
        </div>
      )}

      <div className="flex-1 relative md:h-[calc(100vh-80px)] flex md:flex-row flex-col md:mt-[80px] min-h-0 overflow-hidden">
        {!isMobile && <Sidebar />}

        <div className="flex-1 relative h-full md:pl-[92px] md:pr-[8px] md:pb-[8px] overflow-hidden flex flex-col">

          {isMobile && (
            <div className="flex-1 flex flex-col w-full h-full bg-transparent overflow-hidden p-3 pt-[76px] pb-3">
              <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              <div className="p-5 flex-1 flex flex-col gap-5 min-h-0 overflow-y-auto no-scrollbar"
                style={{
                  borderRadius: '28px',
                  border: '1.5px solid rgba(255, 255, 255, 0.20)',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.3), inset 3px 3px 4px rgba(255,255,255,0.17)',
                  background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.30) 0%, rgba(28, 78, 81, 0.44) 100%)',
                }}
              >
                <div className="flex flex-col">
                  <h1 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight leading-[1.2]">
                    {t('nav.reports', 'Reports')}
                  </h1>
                  <p className="text-[14px] md:text-[16px] text-gray-400 mt-3 max-w-[95%] md:max-w-[80%] leading-relaxed">
                    {t('reports.pageSubtitle')}
                  </p>
                </div>
                <div className="flex flex-col min-h-0">
                  <ReportsFilterForm onApply={handleApply} stations={loadedBuoys} parameters={loadedParams} />
                  <div className="flex-1 mt-6 flex flex-col gap-6">
                    {resultsSection(true)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isMobile && (
            <div className="flex-grow flex flex-col min-w-0 h-full relative animate-fadeIn"
              style={{
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.3) 0%, rgba(28, 78, 81, 0.44) 100%)',
                boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
                backdropFilter: 'blur(7px)',
                WebkitBackdropFilter: 'blur(7px)',
                padding: '24px 32px',
                overflow: 'hidden'
              }}
            >
              <div className="flex flex-col mb-8">
                <h1 className="text-[32px] font-bold text-white tracking-tight leading-none mb-2">
                  {t('nav.reports', 'Reports')}
                </h1>
                <p className="text-[15px] text-gray-400 max-w-[600px] leading-relaxed">
                  {t('reports.pageSubtitle')}
                </p>
              </div>
              <div className="flex-grow flex flex-col min-h-0 pt-2 overflow-y-auto no-scrollbar">
                <ReportsFilterForm isDesktop={true} onApply={handleApply} stations={loadedBuoys} parameters={loadedParams} />
                <div className="flex-grow mt-6 flex flex-col gap-6">
                  {resultsSection(false)}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
