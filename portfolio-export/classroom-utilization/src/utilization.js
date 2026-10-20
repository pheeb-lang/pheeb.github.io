// Port of utilization_service.py's pure calculation; no database or network.
import {rooms, reservations, closedDates} from './mock-data.js';
const DAY = 86400000;
const periods = [['09:00','12:00'], ['13:30','17:30'], ['18:45','21:45']];
const round = x => Math.round(x * 1e6) / 1e6;
export function parsePeriod(start, end) {
  const valid = text => typeof text === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(text) &&
    Number.isFinite(Date.parse(text)) && new Date(text).toISOString().slice(0,10) === text;
  if (!valid(start) || !valid(end)) throw new Error('日期必須使用有效的 YYYY-MM-DD 格式。');
  if (start > end || (Date.parse(end)-Date.parse(start))/DAY >= 366) throw new Error('起日不能晚於迄日，查詢範圍最多 366 天。');
  if (+start.slice(0,4)<2000 || +end.slice(0,4)>2100) throw new Error('查詢年份必須介於 2000 到 2100。');
}
export function mergedMilliseconds(intervals) {
  let total=0, left=null, right=null;
  for (const [start,end] of [...intervals].sort((a,b)=>a[0]-b[0])) {
    if (right !== null && start<=right) right=Math.max(right,end);
    else { if (right!==null) total+=right-left; left=start; right=end; }
  }
  return total+(right===null?0:right-left);
}
export function buildReport(start, end, source={rooms, reservations, closedDates}) {
  parsePeriod(start,end);
  const included=source.rooms.filter(r=>!['講師休息室','線上教室01','線上教室02'].some(s=>r.name.replace(/\s/g,'').endsWith(s)));
  const windows=[], holidays=[];
  let open_days=0;
  for (let t=Date.parse(start);t<=Date.parse(end);t+=DAY) {
    const day=new Date(t).toISOString().slice(0,10);
    if (source.closedDates[day]) holidays.push({date:day,name:source.closedDates[day]});
    else { open_days++; for (const [a,b] of periods) windows.push([Date.parse(`${day}T${a}:00+08:00`),Date.parse(`${day}T${b}:00+08:00`)]); }
  }
  const available=windows.reduce((s,[a,b])=>s+b-a,0);
  let total=0;
  const result=included.map(room=>{
    const intervals=[], ids=new Set();
    for (const booking of source.reservations) {
      if (booking.status_id!==1 || booking.resource_id!==room.resource_id) continue;
      for (const [a,b] of windows) {
        const left=Math.max(a,Date.parse(booking.start_date)), right=Math.min(b,Date.parse(booking.end_date));
        if(left<right) { intervals.push([left,right]); ids.add(booking.reservation_instance_id); }
      }
    }
    const used=mergedMilliseconds(intervals); total+=used;
    return {...room, reservation_count:ids.size, booked_hours:round(used/3600000), available_hours:available/3600000, utilization:available?round(used/available*100):null};
  });
  const totalAvailable=available*result.length;
  return {start_date:start,end_date:end,location:'展示資料・星河學苑',timezone:'Asia/Taipei',open_days,holidays,
    updated_at:new Date().toISOString(), is_stale:false, rooms:result,
    summary:{room_count:result.length,booked_hours:round(total/3600000),available_hours:totalAvailable/3600000,utilization:totalAvailable?round(total/totalAvailable*100):null}};
}
