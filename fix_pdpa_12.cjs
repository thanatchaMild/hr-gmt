const fs = require('fs');
let text = fs.readFileSync('app/utils/pdpaContent.ts', 'utf8');

const t1 = '<div class=\\"bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6 text-slate-700 leading-relaxed text-justify\\">ผู้ควบคุมข้อมูลส่วนบุคคล : บริษัท ยิปมั่นเทค จำกัด</div>';
const t3 = '<div class=\\"bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6 text-slate-700 leading-relaxed text-justify\\">กรณีที่ท่านมีข้อสอบถามเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล โปรดติดต่อเบอร์ 02-335-5555 / 02-335-5777 หรือ e-mail: Data.Privacy@toagroup.com</div>';

const merged = '<div class=\\"bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6 text-slate-700 leading-relaxed\\">\\n  <p class=\\"mb-2\\"><strong>ผู้ควบคุมข้อมูลส่วนบุคคล :</strong> บริษัท ยิปมั่นเทค จำกัด</p>\\n  <p class=\\"mb-2\\"><strong>สถานที่ติดต่อ :</strong> เลขที่ 9/9 อาคารแอทสาทร ชั้น 16 โซนเอ ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพ 10120</p>\\n  <p><strong>กรณีที่ท่านมีข้อสอบถามเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล :</strong> โปรดติดต่อเบอร์ 02-335-5555 / 02-335-5777 หรือ e-mail: Data.Privacy@toagroup.com</p>\\n</div>';

if (text.includes(t1)) {
  let p1 = text.split(t1);
  let p2 = p1[1].split(t3);
  text = p1[0] + merged + p2[1];
  fs.writeFileSync('app/utils/pdpaContent.ts', text, 'utf8');
  console.log('Success');
} else {
  console.log('Failed to find t1');
}
