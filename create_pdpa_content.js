const fs = require('fs');

try {
  const content = fs.readFileSync('pdpa_extracted.txt', 'utf8');
  const tsContent = `export const pdpaHtml = ${JSON.stringify(content)};`;
  
  // Create utils directory if it doesn't exist
  if (!fs.existsSync('app/utils')) {
    fs.mkdirSync('app/utils', { recursive: true });
  }
  
  fs.writeFileSync('app/utils/pdpaContent.ts', tsContent, 'utf8');
  console.log('Successfully created app/utils/pdpaContent.ts');
} catch (error) {
  console.error('Error:', error);
}
