export const events = [
  {id:'market-morning',title:'A morning at the market',date:'2027-05-08',time:'9:00 AM – 1:00 PM',category:'Markets',place:'Sample market square',description:'A fictional weekly market with seasonal produce, flowers and neighborhood makers. Demonstrates an event detail with a date, category and location.',art:'market'},
  {id:'art-walk',title:'The slow-down art walk',date:'2027-05-15',time:'11:00 AM – 3:00 PM',category:'Arts',place:'Sample downtown art route',description:'A fictional self-guided afternoon of outdoor sculpture and studio stops. A production version would use approved artwork, verified locations and accessible route details.',art:'art'},
  {id:'music-evening',title:'An evening on the square',date:'2027-05-22',time:'5:30 PM – 8:00 PM',category:'Music',place:'Sample community square',description:'A fictional live-music evening demonstrating a featured event. No actual performers, ticket availability or municipal event are represented.',art:'music'},
  {id:'june-market',title:'Fresh finds, familiar faces',date:'2027-06-05',time:'9:00 AM – 1:00 PM',category:'Markets',place:'Sample market square',description:'A second fictional market occurrence demonstrates browsing another month. Production recurrence and cancellation workflows require a CMS.',art:'market'},
  {id:'june-art',title:'Meet the neighborhood makers',date:'2027-06-12',time:'12:00 PM – 4:00 PM',category:'Arts',place:'Sample studio district',description:'A fictional maker afternoon used to demonstrate category filters and searchable event descriptions.',art:'art'},
  {id:'june-music',title:'The summer listening room',date:'2027-06-19',time:'6:00 PM – 8:00 PM',category:'Music',place:'Sample community venue',description:'A fictional acoustic performance used to demonstrate a second month of event data.',art:'music'}
];
export const businesses = [
  {id:'corner-cup',name:'The Corner Cup',category:'Food & Drink',tag:'A warm welcome, one cup at a time.',keywords:'coffee cafe tea bakery',icon:'☕',color:'coffee',description:'Fictional café profile. A production record would include approved contact information, hours, address, imagery and accessibility details.'},
  {id:'paper-petal',name:'Paper & Petal',category:'Shopping',tag:'Little treasures. Thoughtful gifts.',keywords:'gifts books flowers stationery',icon:'✿',color:'petal',description:'Fictional gift shop profile demonstrating discoverable categories and keyword search. No real merchant or address is represented.'},
  {id:'north-studio',name:'North Street Studio',category:'Arts & Experiences',tag:'Find something made with feeling.',keywords:'art gallery sculpture pottery workshop',icon:'◒',color:'studio',description:'Fictional studio profile. A production directory could connect artist pages, workshops and approved business details.'},
  {id:'market-table',name:'The Market Table',category:'Food & Drink',tag:'Good food. Even better company.',keywords:'restaurant lunch dinner seasonal',icon:'◔',color:'table',description:'Fictional restaurant profile demonstrating a second business in the Food & Drink category. No menu or opening hours are presented as real.'}
];
export function filterRecords(records,{query='',category='All',month}={}) {
  const term=query.trim().toLocaleLowerCase('en-US');
  return records.filter(r=>(category==='All'||r.category===category)&&(!month||r.date?.startsWith(month))&&(!term||[r.title,r.name,r.category,r.place,r.description,r.keywords].filter(Boolean).join(' ').toLocaleLowerCase('en-US').includes(term)));
}
export function monthKey(date) {return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;}
export function calendarCells(year,month) {
  const offset=new Date(Date.UTC(year,month,1)).getUTCDay();
  const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  return Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>i<offset||i>=offset+count?null:i-offset+1);
}
