const fs = require('fs');

try {
  const content = fs.readFileSync('pdpa.txt', 'utf8');
  const lines = content.split('\n');
  
  let html = '';
  let inList = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      continue;
    }
    
    // Header e.g., "1. บทนำ"
    if (/^[0-9]+\.\s+.*$/.test(line)) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h3 class="text-lg font-bold text-slate-800 mt-6 mb-3 border-b border-slate-100 pb-2">${line}</h3>\n`;
    }
    // Sub-item e.g., "2.1. ..."
    else if (/^[0-9]+\.[0-9]+(\.)?\s+/.test(line)) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<p class="text-slate-700 mb-3 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-blue-400 before:rounded-full leading-relaxed">${line}</p>\n`;
    }
    // Bullet e.g., "• ..."
    else if (line.startsWith('•')) {
      if (!inList) {
        html += '<ul class="list-none space-y-2 mb-4 pl-6">\n';
        inList = true;
      }
      html += `  <li class="text-slate-600 flex items-start leading-relaxed">
    <svg class="w-4 h-4 text-blue-500 mr-2 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>${line.substring(1).trim()}</span>
  </li>\n`;
    }
    // Regular text
    else {
      if (inList) { html += '</ul>\n'; inList = false; }
      // Bold certain known headers
      if (line.includes('ประกาศความเป็นส่วนตัวสำหรับ') || line.includes('บริษัท ยิปมั่นเทค จำกัด”')) {
        html += `<h2 class="text-xl font-bold text-slate-800 text-center mb-4">${line}</h2>\n`;
      } else {
        html += `<p class="text-slate-700 mb-4 leading-relaxed">${line}</p>\n`;
      }
    }
  }
  
  if (inList) {
    html += '</ul>\n';
  }

  const tsContent = `export const pdpaHtml = ${JSON.stringify(html)};`;
  fs.writeFileSync('app/utils/pdpaContent.ts', tsContent, 'utf8');
  console.log('Successfully formatted pdpa.txt to app/utils/pdpaContent.ts');
} catch (error) {
  console.error('Error:', error);
}
