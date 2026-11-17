export const money=(n:number)=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2}).format(n||0);
export const shortMoney=(n:number)=>new Intl.NumberFormat('es-PE',{notation:'compact',maximumFractionDigits:1}).format(n||0);
export const dateLabel=(date:string)=>{const d=new Date(date);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});};
export const today=()=>{const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;};
export const monthStart=()=>today().slice(0,7)+'-01';
export const dateForInput=(value:string)=>{const d=new Date(value);return Number.isNaN(d.getTime())?today():d.toISOString().slice(0,10);};
export const dateToISO=(value:string)=>new Date(`${value}T12:00:00`).toISOString();
export const errorText=(error:unknown)=>error instanceof Error?error.message:'Ha ocurrido un error inesperado';