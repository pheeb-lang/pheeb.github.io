// 虛構預約，涵蓋三時段、空白教室及原日期捷徑。
const dates = ['2025-11-04','2025-11-05','2025-12-01','2026-01-06','2026-05-04','2026-06-04','2026-07-01'];
export const demoBookings = dates.flatMap((date,i)=>[
  ['morning','09:00','12:00','A201','星塵繪本工作坊'],
  ['afternoon','13:30','17:30','A302','森林故事設計'],
  ['evening','18:30','21:30','online-01','雲端創作交流']
].map(([timeSlot,start,end,resourceId,title],j)=>({id:`DEMO-E${i}-${j}`,bookingId:`DEMO-B${i}-${j}`,title,instructorName:'星禾老師（虛構）',resource:resourceId,resourceId,courseCode:`DEMO-${j}`,courseType:'展示班',timeSlot,start:`${date}T${start}:00+08:00`,end:`${date}T${end}:00+08:00`})));
