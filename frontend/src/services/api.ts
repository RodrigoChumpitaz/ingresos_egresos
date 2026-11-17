import type { Category, Filters, MoneyType, Summary, Transaction, TransactionInput, TransactionPage } from '../types/finance';
export const API_BASE = (import.meta.env.VITE_API_URL || 'https://ingreso-egresos-backend.vercel.app/api/v1').replace(/\/$/, '');
export class ApiError extends Error { constructor(public status:number,message:string){super(message);this.name='ApiError';} }
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  let response:Response;
  try {response=await fetch(`${API_BASE}${path}`,{...init,headers:{'Content-Type':'application/json',...init?.headers}});}catch{throw new ApiError(0,'No se pudo conectar con la API. Verifica internet, CORS o la URL configurada.');}
  if(!response.ok){const data=await response.json().catch(()=>null) as {message?:string}|null;throw new ApiError(response.status,data?.message||`Error HTTP ${response.status}`);}
  if(response.status===204) return undefined as T;
  return response.json() as Promise<T>;
}
function query(params:Record<string,string|number|undefined>){const s=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v!==undefined && v!=='')s.set(k,String(v));});return s.toString()?`?${s}`:'';}
export const api={
  categories:(type?:MoneyType)=>request<Category[]>('/categories'+query({type})),
  createCategory:(data:{name:string;type:MoneyType})=>request<Category>('/categories',{method:'POST',body:JSON.stringify(data)}),
  updateCategory:(id:string,name:string)=>request<Category>(`/categories/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({name})}),
  deleteCategory:(id:string)=>request<void>(`/categories/${encodeURIComponent(id)}`,{method:'DELETE'}),
  transactions:(filters:Filters={})=>request<TransactionPage>('/transactions'+query({...filters})),
  createTransaction:(data:TransactionInput)=>request<Transaction>('/transactions',{method:'POST',body:JSON.stringify(data)}),
  updateTransaction:(id:string,data:Partial<TransactionInput>)=>request<Transaction>(`/transactions/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(data)}),
  deleteTransaction:(id:string)=>request<void>(`/transactions/${encodeURIComponent(id)}`,{method:'DELETE'}),
  summary:(from?:string,to?:string)=>request<Summary>('/summary'+query({from,to})),
  health:()=>request<{status:string}>('/health'),
};