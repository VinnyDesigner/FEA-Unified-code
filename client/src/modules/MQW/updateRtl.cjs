const fs = require('fs');

function replaceBlock(path, newBlock) {
  let content = fs.readFileSync(path, 'utf8');
  const startStr = 'const updatePositions = useCallback(() => {';
  const startIndex = content.indexOf(startStr);
  if (startIndex === -1) {
    console.log('Failed to find start of block in ' + path);
    return;
  }
  
  const endStr = '  }, []);';
  const endIndex = content.indexOf(endStr, startIndex);
  if (endIndex === -1) {
    console.log('Failed to find end of block in ' + path);
    return;
  }
  
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + endStr.length);
  
  fs.writeFileSync(path, before + newBlock + after);
  console.log(path + ' updated');
}

// 1. AnalyticsFilters.jsx
const afPath = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/AnalyticsFilters.jsx';
const afNew = `const updatePositions = useCallback(() => {
    const isRtl = document.documentElement.dir === 'rtl';

    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      const leftPos = window.innerWidth < 450 ? 16 : (isRtl ? rect.left + window.scrollX : rect.right + window.scrollX - 350);
      setFilterPos({
        top: rect.bottom + window.scrollY + 10,
        left: Math.max(16, leftPos)
      });
    }
    if (viewBtnRef.current) {
      const rect = viewBtnRef.current.getBoundingClientRect();
      const leftPos = isRtl ? rect.right + window.scrollX - 200 : rect.left + window.scrollX;
      setViewPos({
        top: rect.bottom + window.scrollY + 10,
        left: Math.max(16, leftPos)
      });
    }
    if (buoyBtnRef.current) {
      const rect = buoyBtnRef.current.getBoundingClientRect();
      const leftPos = isRtl ? rect.right + window.scrollX - 200 : rect.left + window.scrollX;
      setBuoyPos({
        top: rect.bottom + window.scrollY + 10,
        left: Math.max(16, leftPos)
      });
    }
  }, []);`;
replaceBlock(afPath, afNew);

// 2. SensorDataFilters.jsx
const sdPath = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/SensorDataFilters.jsx';
const sdNew = `const updatePositions = useCallback(() => {
    const isRtl = document.documentElement.dir === 'rtl';
    if (subTabBtnRef.current) {
      const rect = subTabBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 1024 ? (window.innerWidth - 380) / 2 : rect.right + window.scrollX - 220;
      setSubTabPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
    if (buoyBtnRef.current) {
      const rect = buoyBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 1024 ? (window.innerWidth - 380) / 2 : rect.right + window.scrollX - 220;
      setBuoyPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
    if (dateBtnRef.current) {
      const rect = dateBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 1024 ? (window.innerWidth - 380) / 2 : rect.right + window.scrollX - 380;
      setDatePos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      const defaultLeft = window.innerWidth < 450 ? 16 : rect.right + window.scrollX - 350;
      setFilterPos({
        top: rect.bottom + window.scrollY + 10,
        left: isRtl ? Math.max(16, rect.left + window.scrollX) : defaultLeft
      });
    }
  }, []);`;
replaceBlock(sdPath, sdNew);

// 3. ReportsFilterForm.jsx
const rfPath = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/ReportsFilterForm.jsx';
const rfNew = `const updatePositions = useCallback(() => {
    const isRtl = document.documentElement.dir === 'rtl';
    if (stationBtnRef.current) {
      const rect = stationBtnRef.current.getBoundingClientRect();
      setStationPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? rect.right + window.scrollX - rect.width : rect.left + window.scrollX,
        width: rect.width
      });
    }
    if (monitoringTypeBtnRef.current) {
      const rect = monitoringTypeBtnRef.current.getBoundingClientRect();
      setMonitoringTypePos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? rect.right + window.scrollX - rect.width : rect.left + window.scrollX,
        width: rect.width
      });
    }
    if (parameterBtnRef.current) {
      const rect = parameterBtnRef.current.getBoundingClientRect();
      setParameterPos({
        top: rect.bottom + window.scrollY + 8,
        left: isRtl ? rect.right + window.scrollX - rect.width : rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);`;
replaceBlock(rfPath, rfNew);
