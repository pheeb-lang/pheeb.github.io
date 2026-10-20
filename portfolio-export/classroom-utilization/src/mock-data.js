// All names, IDs, titles and bookings are fictional. No personal data.
export const rooms = [
  {resource_id:'DEMO-101', name:'星河學苑・晨光教室'},
  {resource_id:'DEMO-102', name:'星河學苑・森林教室'},
  {resource_id:'DEMO-103', name:'星河學苑・海風教室'},
  {resource_id:'DEMO-104', name:'星河學苑・留白教室'},
  {resource_id:'DEMO-R', name:'星河學苑・講師休息室'},
  {resource_id:'DEMO-O1', name:'星河學苑・線上教室01'},
  {resource_id:'DEMO-O2', name:'星河學苑・線上教室02'},
];
// Demonstration calendar only, deliberately not an authoritative holiday calendar.
export const closedDates = {'2026-10-09':'展示休館日', '2026-10-10':'展示紀念日'};
export const reservations = [];
function add(id, room, start, end, status_id=1, title='星光創作工作坊') {
  reservations.push({reservation_instance_id:id, resource_id:room, start_date:start+'+08:00', end_date:end+'+08:00', status_id, title});
}
for (let d=1; d<=7; d++) {
  const day = `2026-10-${String(d).padStart(2,'0')}`;
  add(`FULL-${d}`, 'DEMO-101', day+'T08:00:00', day+'T22:00:00');
  add(`OVERLAP-${d}`, 'DEMO-101', day+'T10:00:00', day+'T11:00:00');
  add(`AM-${d}`, 'DEMO-102', day+'T09:00:00', day+'T12:00:00');
  if (d%2) add(`PM-${d}`, 'DEMO-102', day+'T13:30:00', day+'T15:30:00');
}
add('CROSS', 'DEMO-103','2026-09-30T20:00:00','2026-10-01T10:00:00');
add('NIGHT', 'DEMO-103','2026-10-03T18:45:00','2026-10-03T20:15:00');
add('BREAK', 'DEMO-103','2026-10-04T12:00:00','2026-10-04T13:30:00');
add('PENDING', 'DEMO-104','2026-10-01T09:00:00','2026-10-01T12:00:00',3);
add('DELETED', 'DEMO-104','2026-10-02T09:00:00','2026-10-02T12:00:00',2);
add('CLOSED', 'DEMO-102','2026-10-09T09:00:00','2026-10-10T22:00:00');
add('EXCLUDED', 'DEMO-R','2026-10-01T09:00:00','2026-10-01T12:00:00');
