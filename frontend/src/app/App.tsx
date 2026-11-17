import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, BarChart3, CalendarDays, ChevronDown, ChevronRight, CircleHelp, CreditCard, LayoutDashboard, Menu, Plus, RefreshCw, Settings2, Tags, Wallet, X } from 'lucide-react';
import { api } from '../services/api';
import type { Category, Summary, Transaction } from '../types/finance';
import { errorText, monthStart, today } from '../shared/utils/format';
import { ErrorPanel, Loading, Toast } from '../shared/components/UI';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { MovementsPage } from '../modules/movements/MovementsPage';
import { MovementModal } from '../modules/movements/components/MovementModal';
import { CategoriesPage } from '../modules/categories/CategoriesPage';
import { CategoryModal } from '../modules/categories/components/CategoryModal';
import { ReportsPage } from '../modules/reports/ReportsPage';
type Page = 'dashboard' | 'transactions' | 'categories' | 'reports';
type Notice = {message:string;kind:'success'|'error'};
const NAV: {id:Page;label:string;icon:typeof LayoutDashboard}[] = [
  {id:'dashboard',label:'Resumen general',icon:LayoutDashboard},
  {id:'transactions',label:'Movimientos',icon:CreditCard},
  {id:'categories',label:'Categorías',icon:Tags},
  {id:'reports',label:'Reportes',icon:BarChart3},
];

function App(){
  const [page,setPage]=useState<Page>('dashboard');
  const [sidebar,setSidebar]=useState(false);
  const [categories,setCategories]=useState<Category[]>([]);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [recent,setRecent]=useState<Transaction[]>([]);
  const [initialLoad,setInitialLoad]=useState(true);
  const [error,setError]=useState('');
  const [refreshKey,setRefreshKey]=useState(0);
  const [notice,setNotice]=useState<Notice|null>(null);
  const [transactionForm,setTransactionForm]=useState<Transaction|null|'new'>(null);
  const [categoryForm,setCategoryForm]=useState<Category|null|'new'>(null);
  const [dashboardFrom,setDashboardFrom]=useState(monthStart());
  const [dashboardTo,setDashboardTo]=useState(today());
  const notify=(message:string,kind:'success'|'error'='success')=>setNotice({message,kind});
  const reload=()=>setRefreshKey(n=>n+1);
  const selectPage=(id:Page)=>{setPage(id);setSidebar(false);};

  useEffect(()=>{
    let active=true;setInitialLoad(true);setError('');
    Promise.all([api.categories(),api.summary(dashboardFrom,dashboardTo),api.transactions({from:dashboardFrom,to:dashboardTo,limit:8,page:1})])
      .then(([cats,sum,list])=>{if(active){setCategories(cats);setSummary(sum);setRecent(list.items);}})
      .catch(e=>{if(active)setError(errorText(e));})
      .finally(()=>{if(active)setInitialLoad(false);});
    return ()=>{active=false;};
  },[refreshKey,dashboardFrom,dashboardTo]);

  const categoryMap=useMemo(()=>Object.fromEntries(categories.map(c=>[c.id,c])) as Record<string,Category>,[categories]);
  const done=(message:string)=>{setTransactionForm(null);setCategoryForm(null);notify(message);reload();};
  const title={dashboard:'Resumen general',transactions:'Movimientos',categories:'Categorías',reports:'Reportes y análisis'}[page];
  const subtitle={dashboard:'Un vistazo claro a tus finanzas.',transactions:'Controla tus ingresos y egresos en un solo lugar.',categories:'Organiza tus movimientos por categorías.',reports:'Comprende cómo se distribuye tu dinero.'}[page];
  return <div className="app-shell">
    {sidebar&&<button className="mobile-backdrop" onClick={()=>setSidebar(false)} aria-label="Cerrar menú"/>}
    <aside className={`sidebar ${sidebar?'opened':''}`}>
      <div className="brand"><span className="brand-mark"><Activity size={21} strokeWidth={3}/></span><span>finanza<span className="brand-dot">.</span></span><button className="mobile-close icon-btn" onClick={()=>setSidebar(false)}><X size={19}/></button></div>
      <div className="workspace"><span className="workspace-symbol"><Wallet size={18}/></span><span><strong>Mis finanzas</strong><small>Espacio personal</small></span><ChevronDown size={16} className="muted"/></div>
      <div className="sidebar-label">MENÚ PRINCIPAL</div>
      <nav>{NAV.map(item=><button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={()=>selectPage(item.id)}><item.icon size={19}/>{item.label}{page===item.id&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><CircleHelp size={19}/></span><strong>Tu dinero, bajo control</strong><p>Registra tus movimientos y mantén tus cuentas organizadas.</p><button onClick={()=>setTransactionForm('new')}>Nuevo movimiento <ArrowRight size={15}/></button></div><div className="powered"><span className="avatar">F</span><span><strong>Finanza</strong><small>Panel de administración</small></span><Settings2 size={16}/></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-btn" onClick={()=>setSidebar(true)} aria-label="Abrir menú"><Menu/></button><span>Panel de control</span><ChevronRight size={15}/><strong>{title}</strong></div><div className="topbar-right"><span className="online"><span/> API conectada</span><div className="top-avatar">F</div></div></header>
      <div className="page-content"><div className="page-hero"><div><div className="eyebrow"><span/> TU ESPACIO FINANCIERO</div><h1>{title}<span className="title-spark">✦</span></h1><p>{subtitle}</p></div><div className="hero-actions"><button className="btn secondary" onClick={reload}><RefreshCw size={17}/> Actualizar</button><button className="btn primary" onClick={()=>setTransactionForm('new')}><Plus size={18}/> Nuevo movimiento</button></div></div>
      {page==='dashboard'&&<>
        <div className="filter-strip"><div className="filter-title"><CalendarDays size={17}/> Período a consultar</div><div className="date-group"><label>Desde <input type="date" value={dashboardFrom} max={dashboardTo} onChange={e=>setDashboardFrom(e.target.value)}/></label><label>Hasta <input type="date" value={dashboardTo} min={dashboardFrom} onChange={e=>setDashboardTo(e.target.value)}/></label></div></div>
        {initialLoad?<Loading/>:error?<ErrorPanel message={error} onRetry={reload}/>:summary&&<DashboardPage summary={summary} recent={recent} categories={categoryMap} from={dashboardFrom} to={dashboardTo} onAdd={()=>setTransactionForm('new')} onMove={()=>selectPage('transactions')} onReports={()=>selectPage('reports')}/>}
      </>}
      {page==='transactions'&&<MovementsPage key={`${refreshKey}`} categories={categories} onEdit={setTransactionForm} notify={notify} onChange={reload} onAdd={()=>setTransactionForm('new')}/>}
      {page==='categories'&&<CategoriesPage key={`${refreshKey}`} categories={categories} onEdit={setCategoryForm} notify={notify} onChange={reload}/>}
      {page==='reports'&&<ReportsPage categories={categories} notify={notify}/>}
      <footer className="footer">© {new Date().getFullYear()} Finanza · Control de ingresos y egresos <span>Diseñado para tomar mejores decisiones</span></footer>
      </div>
    </main>
    {transactionForm!==null&&<MovementModal item={transactionForm==='new'?null:transactionForm} categories={categories} onClose={()=>setTransactionForm(null)} onSuccess={done} notify={notify}/>}
    {categoryForm!==null&&<CategoryModal item={categoryForm==='new'?null:categoryForm} onClose={()=>setCategoryForm(null)} onSuccess={done} notify={notify}/>}
    {notice&&<Toast message={notice.message} kind={notice.kind} onClose={()=>setNotice(null)}/>}
  </div>;
}

export default App;
