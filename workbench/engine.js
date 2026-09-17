export const sample = [
 {id:1,title:"Autumn Makers Market",type:"Event",old:"/events/autumn-market",path:"/events/autumn-market",date:"2026-10-10",alt:"Makers displaying pottery under a striped canopy",approved:true},
 {id:2,title:"Juniper Books",type:"Business",old:"/shop/books",path:"/directory/juniper-books",date:"",alt:"Juniper Books storefront",approved:true},
 {id:3,title:"Evening on Main",type:"Event",old:"/events/evening",path:"/events/evening",date:"",alt:"Music stage at dusk",approved:false},
 {id:4,title:"Riverbend Studio",type:"Business",old:"/shops/riverbend",path:"/directory/riverbend-studio",date:"",alt:"",approved:false},
 {id:5,title:"Market information",type:"Page",old:"/market",path:"/visit/market",date:"",alt:"Market stalls around a town square",approved:true},
 {id:6,title:"Market archive",type:"Page",old:"/market-archive",path:"/visit/market",date:"",alt:"Archived market poster",approved:false}
];
export function issues(row,rows){
 const list=[];
 if(!row.title.trim())list.push("Add a title");
 if(!/^\/(?!\/)[a-z0-9/-]*$/.test(row.path))list.push("Use a lowercase local URL path");
 if(rows.some(r=>r.id!==row.id&&r.path===row.path))list.push("Resolve duplicate destination or document an approved merge");
 if(row.type==="Event"&&!row.date)list.push("Set the event date");
 if(!row.alt.trim())list.push("Review image alternative text");
 if(!row.approved)list.push("Content owner approval pending");
 return list;
}
export function exportPlan(rows){return JSON.stringify({demo:true,note:"Synthetic content. This plan does not publish content or configure redirects.",records:rows.map(r=>({...r,reviewIssues:issues(r,rows),proposedRedirect:r.old!==r.path?{from:r.old,to:r.path,status:301}:null}))},null,2)}
