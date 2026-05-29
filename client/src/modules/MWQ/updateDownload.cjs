const fs = require('fs');
const path = 'c:/Users/BhavaniSinghThakur/FEA-Unified-code/FEA-Unified-code/client/src/modules/MQW/components/DownloadDropdown.jsx';
let content = fs.readFileSync(path, 'utf8');

const helper = `
  const getTransLabel = (val) => {
    const map = {
      'Download InExcel': 'common.downloadInExcel',
      'Download in Word': 'common.downloadInWord',
      'Download in Pdf': 'common.downloadInPdf'
    };
    return map[val] ? t(map[val], val) : val;
  };
`;

if (!content.includes('getTransLabel')) {
  content = content.replace("const options = ['Download InExcel', 'Download in Word', 'Download in Pdf'];", helper + "\n  const options = ['Download InExcel', 'Download in Word', 'Download in Pdf'];");
  content = content.replace(/>{option}</g, '>{getTransLabel(option)}<');
  fs.writeFileSync(path, content);
  console.log('DownloadDropdown.jsx updated');
}
