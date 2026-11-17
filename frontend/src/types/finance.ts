export type MoneyType = 'INCOME' | 'EXPENSE';
export interface Category { id:string; name:string; type:MoneyType; createdAt?:string; updatedAt?:string }
export interface Transaction {id:string; type:MoneyType; amount:number; description?:string; categoryId:string; date:string; createdAt?:string; updatedAt?:string}
export interface TransactionPage { items:Transaction[];total:number;page:number;limit:number }
export interface CategorySummary {categoryId:string;categoryName:string;type:MoneyType;total:number;count:number}
export interface Summary {from:string|null;to:string|null;totalIncome:number;totalExpense:number;balance:number;byCategory:CategorySummary[]}
export interface Filters {type?:MoneyType;categoryId?:string;from?:string;to?:string;page?:number;limit?:number}
export type TransactionInput = {amount:number;categoryId:string;description?:string;date?:string};