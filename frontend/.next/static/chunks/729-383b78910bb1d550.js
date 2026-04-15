"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[729],{399:(e,t,r)=>{r.d(t,{KU:()=>s,kC:()=>c});var n=r(3137);let a=null,i=null,o=null;async function s(){return a?.isConnected?a:(i||(i=(async()=>{try{let{GearApi:e}=await Promise.all([r.e(488),r.e(790)]).then(r.bind(r,7488)),t=await e.create({providerAddress:n.yy});return o&&t.setSigner(o),a=t,t}catch(e){throw a=null,Error(`Failed to connect to Vara testnet RPC: ${e instanceof Error?e.message:String(e)}`)}finally{i=null}})()),i)}async function c(e){o=e,(await s()).setSigner(e)}},897:(e,t,r)=>{r.d(t,{$q:()=>w,Yt:()=>h,ZD:()=>b,_r:()=>_,kv:()=>x,vT:()=>A});var n=r(2115),a=r(3137),i=r(399);let o="varasplit.selectedAccount",s={selectedAccount:null,injector:null,isConnected:!1,availableAccounts:[],status:"idle",error:null},c=s,l=new Set;function u(e){c={...c,...e},l.forEach(e=>e())}function d(e){return l.add(e),()=>l.delete(e)}function p(){return c}function f(){return s}function y(){return window.localStorage.getItem(o)}function m(e){e?window.localStorage.setItem(o,e.address):window.localStorage.removeItem(o)}function g(e,t){return e instanceof Error?/reject|denied|cancel/i.test(e.message)?"Wallet permission was rejected.":e.message:t}function w(){return c}async function h(){u({status:"connecting",error:null});try{let{web3Enable:e,web3Accounts:t}=await r.e(783).then(r.bind(r,2783));if(!(await e(a.C3)).length)return u({status:"missing",availableAccounts:[],selectedAccount:null,injector:null,isConnected:!1,error:"No wallet extension found. Install SubWallet, Polkadot.js, or Talisman."}),[];let n=await t();if(!n.length)return u({status:"error",availableAccounts:[],selectedAccount:null,injector:null,isConnected:!1,error:"Wallet extension is connected, but no account is available."}),[];return u({availableAccounts:n,status:"idle",error:null}),n}catch(t){let e=g(t,"Failed to connect wallet.");return u({status:/rejected/i.test(e)?"rejected":"error",availableAccounts:[],selectedAccount:null,injector:null,isConnected:!1,error:e}),[]}}async function b(e){try{let{web3FromSource:t}=await r.e(783).then(r.bind(r,2783)),n=await t(e.meta.source);if(!n?.signer)throw Error("Signer missing for selected account.");await (0,i.kC)(n.signer),m(e),u({selectedAccount:e,injector:n,isConnected:!0,status:"connected",error:null})}catch(e){u({selectedAccount:null,injector:null,isConnected:!1,status:"error",error:g(e,"Failed to select wallet account.")})}}async function x(e){let t=await h();if(!t.length)return;let r=e??y(),n=t.find(e=>e.address===r)??t[0];await b(n)}async function v(){let e=y();e&&!c.isConnected&&"connecting"!==c.status&&await x(e)}function _(){m(null),u({selectedAccount:null,injector:null,isConnected:!1,status:"idle",error:null})}function A(){let e=(0,n.useSyncExternalStore)(d,p,f);return(0,n.useEffect)(()=>{v().catch(()=>null)},[]),e}},2729:(e,t,r)=>{r.d(t,{l:()=>k});var n=r(5155),a=r(8500),i=r.n(a),o=r(4286),s=r(642),c=r(1767),l=r(1958),u=r(2651),d=r(2164),p=r(2115),f=r(6059),y=r(897);let m=["Pending","Proof Ready"];function g(){let e=(0,y.vT)(),[t,r]=(0,p.useState)(!1),{items:a,unreadCount:g,loading:w,error:h,refresh:b,markRead:x}=(0,f.F7)(e.selectedAccount),v=a.length;return e.isConnected?(0,n.jsxs)("div",{className:"relative",children:[(0,n.jsxs)(o.P.button,{type:"button",whileHover:{y:-2},whileTap:{scale:.96},onClick:()=>r(e=>!e),className:"relative grid h-11 w-11 place-items-center rounded-[18px] border border-[#70ffc4]/18 bg-[#142a1f]/60 text-[#d8fff0] shadow-[0_16px_44px_rgba(0,0,0,0.22)] transition hover:border-[#70ffc4]/42 hover:bg-[#69f5c7]/10","aria-label":"Open pending actions",children:[(0,n.jsx)(c.A,{className:"h-5 w-5"}),v>0?(0,n.jsx)(o.P.span,{initial:{scale:0},animate:{scale:1},className:"absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#69f5c7] px-1 text-[10px] font-black text-[#03100b] shadow-[0_0_24px_rgba(105,245,199,0.45)]",children:v}):null]}),(0,n.jsx)(s.N,{children:t?(0,n.jsxs)(o.P.div,{initial:{opacity:0,y:12,scale:.96},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:10,scale:.96},transition:{duration:.22},className:"absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,390px)] overflow-hidden rounded-[28px] border border-[#70ffc4]/18 bg-[#040807]/94 p-3 shadow-[0_28px_100px_rgba(0,0,0,0.55),0_0_54px_rgba(105,245,199,0.12)] backdrop-blur-2xl",children:[(0,n.jsxs)("div",{className:"flex items-start justify-between gap-3 p-3",children:[(0,n.jsxs)("div",{children:[(0,n.jsx)("p",{className:"text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]",children:"Action center"}),(0,n.jsx)("h3",{className:"mt-1 text-xl font-black text-[#ecfff7]",children:v>0?`${v} record${1===v?"":"s"} to review`:"You’re all caught up"}),g>0?(0,n.jsxs)("p",{className:"mt-1 text-xs text-[rgba(236,255,247,0.6)]",children:[g," new since you last opened them"]}):null]}),(0,n.jsx)("button",{type:"button",onClick:b,className:"rounded-full border border-[#70ffc4]/16 p-2 text-[#bcffe5] transition hover:border-[#70ffc4]/36",children:(0,n.jsx)(l.A,{className:`h-4 w-4 ${w?"animate-spin":""}`})})]}),(0,n.jsxs)("div",{className:"max-h-[420px] space-y-3 overflow-auto p-2",children:[h?(0,n.jsx)("div",{className:"rounded-[22px] border border-[#ff7a7a]/20 bg-[#3a1010]/35 p-3 text-sm leading-6 text-[#ffd6d6]",children:h}):null,m.map(e=>{let t=a.filter(t=>t.group===e);return t.length?(0,n.jsxs)("div",{children:[(0,n.jsx)("p",{className:"px-2 text-[10px] font-black uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]",children:e}),(0,n.jsx)("div",{className:"mt-2 space-y-2",children:t.map(e=>{var t;return(0,n.jsxs)(i(),{href:e.href,onClick:()=>{x(e.id),r(!1)},className:`group flex items-start gap-3 rounded-[20px] border p-3 transition hover:border-[#70ffc4]/30 hover:bg-[#69f5c7]/10 ${e.unread?"border-[#70ffc4]/22 bg-[#69f5c7]/10":"border-[#70ffc4]/12 bg-[#07110d]/72"}`,children:[(0,n.jsx)("span",{className:`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${(t=e.type).includes("proof")||t.includes("claim")?"bg-[#39d98a]/12 text-[#bcffe5]":"bg-[#7dffd4]/10 text-[#d8fff0]"}`,children:e.type.includes("proof")?(0,n.jsx)(u.A,{className:"h-4 w-4"}):(0,n.jsx)(c.A,{className:"h-4 w-4"})}),(0,n.jsxs)("span",{className:"min-w-0 flex-1",children:[(0,n.jsxs)("span",{className:"flex items-center gap-2 text-sm font-bold text-[#ecfff7]",children:[e.title,e.unread?(0,n.jsx)("span",{className:"h-2 w-2 rounded-full bg-[#69f5c7] shadow-[0_0_14px_rgba(105,245,199,0.8)]"}):null]}),(0,n.jsx)("span",{className:"mt-1 block text-xs leading-5 text-[rgba(236,255,247,0.68)]",children:e.description})]}),(0,n.jsx)(d.A,{className:"mt-1 h-4 w-4 shrink-0 text-[rgba(190,230,214,0.5)] transition group-hover:text-[#69f5c7]"})]},e.id)})})]},e):null}),a.length||h?null:(0,n.jsxs)("div",{className:"rounded-[22px] border border-[#70ffc4]/12 bg-[#07110d]/72 p-4 text-sm leading-6 text-[rgba(236,255,247,0.72)]",children:[(0,n.jsx)("span",{className:"block text-base font-black text-[#ecfff7]",children:"You’re all caught up"}),(0,n.jsx)("span",{className:"mt-1 block",children:"No pending actions right now. Proof-ready records appear here automatically."})]})]})]}):null})]}):null}var w=r(1313),h=r(1275),b=r(4111),x=r(3210),v=r(4478);function _({open:e,accounts:t,loading:r,error:a,onClose:i,onRefresh:c,onSelect:l}){return(0,n.jsx)(s.N,{children:e?(0,n.jsx)(o.P.div,{className:"fixed inset-0 z-50 grid place-items-end bg-[#040807]/82 px-4 pb-4 backdrop-blur-md sm:place-items-center sm:pb-0",initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},children:(0,n.jsxs)(o.P.div,{initial:{opacity:0,y:28,scale:.98},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:18,scale:.98},transition:{type:"spring",stiffness:260,damping:24},className:"glass-card w-full max-w-lg p-5",children:[(0,n.jsxs)("div",{className:"flex items-start justify-between gap-4",children:[(0,n.jsxs)("div",{children:[(0,n.jsx)("p",{className:"text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]",children:"Wallet access"}),(0,n.jsx)("h2",{className:"mt-2 text-2xl font-semibold text-[#ecfff7]",children:"Choose an account"}),(0,n.jsx)("p",{className:"mt-1 text-sm text-[rgba(236,255,247,0.72)]",children:"This wallet signs VaraSplit actions on Vara testnet."})]}),(0,n.jsxs)(o.P.button,{type:"button",whileTap:{scale:.96},onClick:i,className:"secondary-button px-3 py-2 text-sm",children:[(0,n.jsx)(x.A,{className:"h-4 w-4"}),"Close"]})]}),a?(0,n.jsx)("p",{className:"mt-4 rounded-[20px] border border-[#ff7f9b]/30 bg-[#ff7f9b]/10 p-3 text-sm text-[#ffd5de]",children:a}):null,(0,n.jsx)("div",{className:"mt-5 space-y-3",children:t.map((e,t)=>(0,n.jsx)(o.P.button,{type:"button",onClick:()=>l(e),initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{delay:.04*t},whileHover:{y:-2},whileTap:{scale:.98},className:"soft-card w-full p-4 text-left hover:border-[#69f5c7]/50",children:(0,n.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[(0,n.jsxs)("div",{children:[(0,n.jsx)("p",{className:"font-semibold text-[#ecfff7]",children:e.meta.name||"Unnamed account"}),(0,n.jsxs)("p",{className:"mt-1 text-xs text-[rgba(190,230,214,0.5)]",children:[(0,b.Dc)(e.address)," \xb7 ",e.meta.source]})]}),(0,n.jsx)(u.A,{className:"h-5 w-5 text-[#69f5c7]"})]})},`${e.meta.source}-${e.address}`))}),t.length?null:(0,n.jsxs)("div",{className:"mt-4 rounded-[22px] border border-[#70ffc4]/14 bg-[#142a1f]/45 p-4 text-sm text-[rgba(236,255,247,0.72)]",children:[(0,n.jsx)(v.A,{className:"mb-3 h-5 w-5 text-[#69f5c7]"}),"Approve access in SubWallet, Polkadot.js, or Talisman to continue."]}),(0,n.jsx)(o.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:c,disabled:r,className:"primary-button mt-4 w-full",children:r?"Checking wallets...":"Refresh Wallets"})]})}):null})}function A(){let e=(0,y.vT)(),[t,r]=(0,p.useState)(!1);async function a(){await (0,y.kv)(),r(!0)}let i="connecting"===e.status;return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{className:"flex flex-wrap items-center justify-end gap-2",children:e.isConnected&&e.selectedAccount?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(o.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:()=>r(!0),className:"inline-flex items-center gap-2 rounded-[20px] border border-[#70ffc4]/25 bg-[#69f5c7]/10 px-3 py-2 text-sm font-semibold text-[#ecfff7] shadow-[0_12px_34px_rgba(105,245,199,0.13)]",children:[(0,n.jsx)("span",{className:"h-2 w-2 rounded-full bg-[#69f5c7] shadow-[0_0_16px_rgba(125,255,212,0.9)]"}),e.selectedAccount.meta.name||(0,b.Dc)(e.selectedAccount.address)]}),(0,n.jsxs)(o.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:()=>r(!0),className:"secondary-button px-3 py-2 text-sm",children:[(0,n.jsx)(l.A,{className:"h-4 w-4"}),"Switch"]}),(0,n.jsxs)(o.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:y._r,className:"secondary-button px-3 py-2 text-sm",children:[(0,n.jsx)(w.A,{className:"h-4 w-4"}),"Disconnect"]})]}):(0,n.jsxs)(o.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:a,disabled:i,className:"primary-button px-4 py-2 text-sm",children:[(0,n.jsx)(h.A,{className:"h-4 w-4"}),i?"Connecting...":"Connect Wallet"]})}),(0,n.jsx)(_,{open:t,accounts:e.availableAccounts,loading:i,error:e.error,onClose:()=>r(!1),onRefresh:y.Yt,onSelect:e=>{(0,y.ZD)(e).then(()=>r(!1))}})]})}function k(){return(0,n.jsxs)("div",{className:"flex items-center gap-2",children:[(0,n.jsx)(g,{}),(0,n.jsx)(A,{})]})}},3137:(e,t,r)=>{r.d(t,{C3:()=>n,Nc:()=>l,PF:()=>a,lY:()=>u,sT:()=>i,sg:()=>c,v$:()=>s,yy:()=>o});let n="VaraSplit",a="0xbc80a0240c21d2cbcde676110d3b7b72be2aeade7e0d2c1c0f404b66f57efda0",i="0x183bfc9f25a1c5aac52402c5484c07bea5c32f01f1bb794a8d36d040b0d541d4",o="wss://testnet.vara.network",s=o,c=12,l="https://vara.subscan.io/extrinsic";function u(){return i?s?null:"Vara RPC endpoint is not configured.":"Work & Payouts program ID is not configured."}},4111:(e,t,r)=>{r.d(t,{$m:()=>d,AT:()=>w,Dc:()=>u,Ey:()=>x,LH:()=>m,Q:()=>b,S6:()=>y,TF:()=>h,a1:()=>p,iH:()=>g,y0:()=>f});var n=r(1827),a=r(7533),i=r(3112),o=r(558),s=r(8302),c=r(3137);let l=BigInt(10)**BigInt(c.sg);function u(e){return`${e.slice(0,6)}...${e.slice(-6)}`}function d(e){return!!e.trim()&&(0,n.P)(e.trim())}function p(e){let t=e.trim();if(/^0x[0-9a-fA-F]{64}$/.test(t))return(0,o.V)(t);if(!d(t))throw Error(`Invalid address: ${e}`);return(0,a.F)(t)}function f(e){if("string"==typeof e){let t=e.trim();if(!t)return t;if(t.startsWith("0x"))return t.toLowerCase();try{return(0,s.X)(p(t)).toLowerCase()}catch{return t}}if(e instanceof Uint8Array)return(0,s.X)(e).toLowerCase();if(Array.isArray(e)&&e.every(e=>"number"==typeof e))return(0,s.X)(new Uint8Array(e)).toLowerCase();if(e&&"object"==typeof e){if("function"==typeof e.toHex)return e.toHex().toLowerCase();if("function"==typeof e.toU8a)return(0,s.X)(e.toU8a()).toLowerCase()}return String(e)}function y(e){if(!e.startsWith("0x"))return e;try{return(0,i.j)(e)}catch{return e}}function m(e,t){try{return f(e)===f(t)}catch{return e.trim()===t.trim()}}function g(e){let t=e<BigInt(0),r=t?-e:e,n=r/l,a=(r%l).toString().padStart(c.sg,"0").replace(/0+$/,""),i=a?`${n.toString()}.${a}`:n.toString();return t?`-${i}`:i}function w(e){let t=e.trim();if(!t)throw Error("Amount is required.");if(!/^\d+(?:\.\d{0,12})?$/.test(t))throw Error("Enter a valid TVARA amount with up to 12 decimal places.");let[r,n=""]=t.split("."),a=BigInt(r)*l+BigInt((n||"").padEnd(c.sg,"0"));if(a<=BigInt(0))throw Error("Amount must be greater than 0 TVARA.");return a}function h(e){return""===e||/^\d*(?:\.\d{0,12})?$/.test(e)}function b(e,t="id"){if(!e||!/^\d+$/.test(e))throw Error(`Invalid ${t}.`);return BigInt(e)}function x(e){return e?new Date(e>1e10?e:1e3*e).toLocaleString():"Unknown"}},5053:(e,t,r)=>{r.d(t,{Sb:()=>o,at:()=>i,u0:()=>a});var n=r(4111);function a(e,t){return Object.values(t.reduce((t,r)=>{let a,i=(0,n.y0)(r.from),o=t[i]??{address:i,required:BigInt(0),deposited:(a=(0,n.y0)(i),e.escrow[a]??BigInt(0)),remaining:BigInt(0),paid:!1};return o.required+=r.amount,o.remaining=o.required>o.deposited?o.required-o.deposited:BigInt(0),o.paid=o.required>BigInt(0)&&o.deposited>=o.required,t[i]=o,t},{}))}function i(e,t){let r=a(e,t);return r.length>0&&r.every(e=>e.paid)}function o(e,t){return!!(e?.settled||t)}},6006:(e,t,r)=>{r.d(t,{k5:()=>A,xU:()=>C,$Z:()=>k,wj:()=>_,zz:()=>S,OA:()=>P,Wx:()=>E,Y4:()=>N,AJ:()=>I,lN:()=>j});var n=r(3137),a=r(4111),i=r(399);let o=`type Group = struct {
  id: u64,
  name: str,
  members: vec actor_id,
  balances: vec MemberBalance,
  expenses: vec Expense,
  escrow: map (actor_id, u128),
  settlement_plan: vec SettlementTransfer,
  settled: bool,
};

type MemberBalance = struct {
  member: actor_id,
  balance: i128,
};

type Expense = struct {
  payer: actor_id,
  amount: u128,
  share_per_member: u128,
  remainder: u128,
  description: str,
  created_at: u64,
};

type SettlementTransfer = struct {
  from: actor_id,
  to: actor_id,
  amount: u128,
};

type VaraSplitEscrowError = enum {
  AlreadySettled,
  AlreadyDeposited,
  BalanceOverflow,
  DuplicateMember,
  GroupNotFound,
  InvalidAmount,
  InvalidDepositAmount,
  InvalidDescription,
  InvalidGroupName,
  InvalidMemberCount,
  MemberNotFound,
  NotFullyFunded,
  NotGroupMember,
  SettlementAlreadyComputed,
  SettlementIncomplete,
  TokenIdOverflow,
  TransferFailed,
  PayoutAlreadyClaimed,
  PayoutNotFound,
};

type InvoiceNft = struct {
  token_id: u64,
  group_id: u64,
  transfers: vec SettlementTransfer,
  total_settled: u128,
  settled_at: u64,
  finalize_block: u32,
  finalize_extrinsic_index: u32,
  payouts: vec PayoutRecord,
};

type PayoutRecord = struct {
  creditor: actor_id,
  amount: u128,
  claimed: bool,
};

constructor {
  Create : ();
};

service VaraSplitEscrow {
  AddExpense : (group_id: u64, payer: actor_id, amount: u128, description: str) -> result (Group, VaraSplitEscrowError);
  ClaimPayout : (token_id: u64) -> result (InvoiceNft, VaraSplitEscrowError);
  ComputeSettlement : (group_id: u64) -> result (Group, VaraSplitEscrowError);
  CreateGroup : (name: str, members: vec actor_id) -> result (Group, VaraSplitEscrowError);
  Deposit : (group_id: u64) -> result (Group, VaraSplitEscrowError);
  FinalizeSettlement : (group_id: u64, finalize_block: u32, finalize_extrinsic_index: u32) -> result (InvoiceNft, VaraSplitEscrowError);
  RecordFinalizeReference : (token_id: u64, finalize_block: u32, finalize_extrinsic_index: u32) -> result (InvoiceNft, VaraSplitEscrowError);
  query GetGroup : (group_id: u64) -> result (Group, VaraSplitEscrowError);
  query GetInvoice : (group_id: u64) -> result (InvoiceNft, VaraSplitEscrowError);
  query GetInvoiceByToken : (token_id: u64) -> result (InvoiceNft, VaraSplitEscrowError);
  query GetSettlementPlan : (group_id: u64) -> result (vec SettlementTransfer, VaraSplitEscrowError);

  events {
    GroupCreated: struct {
      group_id: u64,
      name: str,
      members: vec actor_id,
    };
    ExpenseAdded: struct {
      group_id: u64,
      payer: actor_id,
      amount: u128,
      description: str,
    };
    SettlementComputed: struct {
      group_id: u64,
      transfers: vec SettlementTransfer,
      total_settled: u128,
    };
    DepositReceived: struct {
      group_id: u64,
      from: actor_id,
      amount: u128,
    };
    SettlementFinalized: struct {
      group_id: u64,
      total_settled: u128,
      token_id: u64,
    };
    InvoiceMinted: struct {
      token_id: u64,
      group_id: u64,
    };
    PayoutDispatched: struct {
      token_id: u64,
      creditor: actor_id,
      amount: u128,
    };
    PayoutClaimed: struct {
      token_id: u64,
      creditor: actor_id,
      amount: u128,
    };
  }
};
`;var s=r(897);let c=null;function l(e){return"bigint"==typeof e?e:"number"==typeof e||"string"==typeof e?BigInt(e):e&&"object"==typeof e&&"toString"in e?BigInt(String(e)):BigInt(0)}function u(e){return"string"==typeof e?e:e&&"object"==typeof e?JSON.stringify(e):String(e)}function d(e){if(!e||"object"!=typeof e)return e;if("Ok"in e)return e.Ok;if("ok"in e)return e.ok;if("Err"in e)throw Error(u(e.Err));if("err"in e)throw Error(u(e.err));return e}function p(e){return Array.isArray(e)?e.map(e=>({from:(0,a.y0)(e.from),to:(0,a.y0)(e.to),amount:l(e.amount)})):[]}function f(e){var t,r;return{id:l(e.id),name:String(e.name??""),members:Array.isArray(e.members)?e.members.map(a.y0):[],balances:Array.isArray(t=e.balances)?t.map(e=>({member:(0,a.y0)(e.member),balance:l(e.balance)})):[],expenses:Array.isArray(r=e.expenses)?r.map(e=>({payer:(0,a.y0)(e.payer),amount:l(e.amount),sharePerMember:l(e.share_per_member??e.sharePerMember),remainder:l(e.remainder),description:String(e.description??""),createdAt:Number(e.created_at??e.createdAt??0)})):[],escrow:function(e){let t={};if(!e)return t;if(e instanceof Map){for(let[r,n]of e.entries())t[(0,a.y0)(r)]=l(n);return t}if(Array.isArray(e)){for(let r of e)Array.isArray(r)&&2===r.length&&(t[(0,a.y0)(r[0])]=l(r[1]));return t}if("object"==typeof e)for(let[r,n]of Object.entries(e))t[(0,a.y0)(r)]=l(n);return t}(e.escrow),settlementPlan:p(e.settlement_plan??e.settlementPlan),settled:!!e.settled}}function y(e){var t;return{tokenId:l(e.token_id??e.tokenId),groupId:l(e.group_id??e.groupId),transfers:p(e.transfers),totalSettled:l(e.total_settled??e.totalSettled),settledAt:Number(e.settled_at??e.settledAt??0),finalizeBlock:Number(e.finalize_block??e.finalizeBlock??0),finalizeExtrinsicIndex:Number(e.finalize_extrinsic_index??e.finalizeExtrinsicIndex??0),payouts:Array.isArray(t=e.payouts)?t.map(e=>({creditor:(0,a.y0)(e.creditor),amount:l(e.amount),claimed:!!e.claimed})):[]}}function m(){let e=(0,s.$q)();if(!e.selectedAccount||!e.injector?.signer)throw Error("Connect a wallet before sending a transaction.");return e}async function g(e){return d(await w(e))}async function w(e){return(await h(e)).response}async function h(e){let t=m();e.withAccount(t.selectedAccount.address,{signer:t.injector.signer}),await e.calculateGas();try{let t=await e.signAndSend(),r=await t.response();return{blockHash:t.blockHash,txHash:t.txHash,response:r}}catch(e){if(e instanceof Error&&/cancel|reject/i.test(e.message))throw Error("Transaction was rejected by the user.");throw Error(e instanceof Error?e.message:"Transaction failed on chain.")}}async function b(e,t){let r=await (0,i.KU)(),[n,a]=await Promise.all([r.rpc.chain.getHeader(e),r.rpc.chain.getBlock(e)]),o=a.block.extrinsics.findIndex(e=>e.hash.toHex()===t);if(o<0)throw Error("Unable to locate finalized extrinsic index for explorer link.");return{block:n.number.toNumber(),index:o}}async function x(){return c||(c=(async()=>{try{let e=await (0,i.KU)(),{Sails:t}=await Promise.all([r.e(488),r.e(946)]).then(r.bind(r,4413)),{SailsIdlParser:a}=await r.e(288).then(r.bind(r,4288)),s=await a.new(),c=new t(s);return c.parseIdl(o),c.setApi(e).setProgramId(n.PF),c}catch(e){throw c=null,Error(`Failed to initialize VaraSplitEscrow: ${e instanceof Error?e.message:String(e)}`)}})()),c}async function v(e,t){let r=(0,s.$q)();return r.selectedAccount?.address&&e.withAddress(r.selectedAccount.address),t(d(await e.call()))}async function _(e,t){let r=(await x()).services.VaraSplitEscrow.functions.CreateGroup(e,t.map(a.a1)),n=await w(r);if(n&&"object"==typeof n&&"Ok"in n){let e=Number(f(n.Ok).id);return console.log("Created group:",e),e}if(n&&"object"==typeof n&&"Err"in n)throw Error(JSON.stringify(n.Err));if(n&&"object"==typeof n&&"ok"in n){let e=Number(f(n.ok).id);return console.log("Created group:",e),e}if(n&&"object"==typeof n&&"err"in n)throw Error(JSON.stringify(n.err));let i=Number(f(n).id);return console.log("Created group:",i),i}async function A(e,t,r,n){let i=(await x()).services.VaraSplitEscrow.functions.AddExpense(e,(0,a.a1)(t),r,n);return f(await g(i))}async function k(e){let t=(await x()).services.VaraSplitEscrow.functions.ComputeSettlement(e);return f(await g(t))}async function S(e,t){if(t<=BigInt(0))throw Error("Deposit value must be greater than zero.");let r=await x(),n=m(),a=r.services.VaraSplitEscrow.functions.Deposit(e);a.withAccount(n.selectedAccount.address,{signer:n.injector.signer}),a.withValue(t),await a.calculateGas();try{let e=await a.signAndSend();console.log("Deposit success");let t=await e.response();return f(d(t))}catch(e){if(e instanceof Error&&/cancel|reject/i.test(e.message))throw Error("Transaction was rejected by the user.");throw Error(e instanceof Error?e.message:"Deposit failed on chain.")}}async function P(e,t=0,r=0){let n=await x(),a=n.services.VaraSplitEscrow.functions.FinalizeSettlement(e,t,r),i=await h(a),o=y(d(i.response)),s=await b(i.blockHash,i.txHash),c=n.services.VaraSplitEscrow.functions.RecordFinalizeReference(o.tokenId,s.block,s.index);return y(await g(c))}async function E(e){let t=(await x()).services.VaraSplitEscrow.queries.GetGroup(e),r=(0,s.$q)();r.selectedAccount?.address&&t.withAddress(r.selectedAccount.address);let n=await t.call();if(console.log("Group fetch result:",n),n&&"object"==typeof n&&"Ok"in n)return f(n.Ok);if(n&&"object"==typeof n&&"Err"in n)throw Error(JSON.stringify(n.Err));return f(d(n))}async function j(e){return v((await x()).services.VaraSplitEscrow.queries.GetSettlementPlan(e),p)}async function N(e){return v((await x()).services.VaraSplitEscrow.queries.GetInvoice(e),y)}async function I(e){return v((await x()).services.VaraSplitEscrow.queries.GetInvoiceByToken(e),y)}async function C(e){let t=(await x()).services.VaraSplitEscrow.functions.ClaimPayout(e);return y(await g(t))}},6059:(e,t,r)=>{r.d(t,{F7:()=>h,MJ:()=>w});var n=r(2115),a=r(3321),i=r(6006),o=r(5053),s=r(4111),c=r(6653),l=r(897),u=r(7572);let d="varasplit:action-center-refresh",p="varasplit.action-center.read",f={pendingGroups:0,pendingWork:0,pending:0,proofReady:0};function y(){try{let e=JSON.parse(window.localStorage.getItem(p)||"[]");if(!Array.isArray(e))return new Set;return new Set(e.filter(e=>"string"==typeof e))}catch{return new Set}}function m(e,t){return!t.has(e)}async function g(e,t){let r=[],n=(0,c.aH)();await Promise.all(n.map(async n=>{try{let l=BigInt(n.id),[u,d]=await Promise.all([(0,i.Wx)(l),(0,i.lN)(l).catch(()=>[])]),p=null;try{p=await (0,i.Y4)(l)}catch{p=null}let f=u.name||n.name||`Group #${u.id.toString()}`,y=u.members.some(t=>(0,s.LH)(t,e.address));if(p){var a,c;if(!y&&(a=p,c=e.address,!(a.transfers.some(e=>(0,s.LH)(e.from,c)||(0,s.LH)(e.to,c))||a.payouts.some(e=>(0,s.LH)(e.creditor,c)))))return;let n=p.payouts.find(t=>(0,s.LH)(t.creditor,e.address)&&!t.claimed);if(n){let e=`group_claim:${p.tokenId.toString()}:${n.amount.toString()}`;r.push({id:e,type:"group_claim",group:"Pending",title:"Funds ready to claim",description:`You can claim ${(0,s.iH)(n.amount)} TVARA from ${f}.`,href:`/invoice/${p.tokenId.toString()}`,createdAt:p.settledAt,unread:m(e,t),priority:100})}let i=`group_proof:${p.tokenId.toString()}`;r.push({id:i,type:"group_proof",group:"Proof Ready",title:"Proof Ready",description:`${f} is ready to share.`,href:`/invoice/${p.tokenId.toString()}`,createdAt:p.settledAt,unread:m(i,t),priority:50});return}let g=(0,o.u0)(u,d).find(t=>(0,s.LH)(t.address,e.address));if(g&&g.remaining>BigInt(0)){let e=`group_pay:${u.id.toString()}:${g.remaining.toString()}`;r.push({id:e,type:"group_pay",group:"Pending",title:"Payment needed",description:`You still need to add ${(0,s.iH)(g.remaining)} TVARA for ${f}.`,href:`/group/${u.id.toString()}`,createdAt:u.expenses.at(-1)?.createdAt??0,unread:m(e,t),priority:90});return}let w=d.length>0&&(0,o.u0)(u,d).every(e=>e.remaining<=BigInt(0));if(y&&w){let e=`group_finish:${u.id.toString()}`;r.push({id:e,type:"group_proof",group:"Pending",title:"Finish record",description:`${f} is funded and waiting for completion.`,href:`/group/${u.id.toString()}`,createdAt:u.expenses.at(-1)?.createdAt??0,unread:m(e,t),priority:86});return}if(y&&u.expenses.length>0&&!u.settled){let e=`group_waiting:${u.id.toString()}:${u.expenses.length}`;r.push({id:e,type:"group_proof",group:"Pending",title:"Waiting for completion",description:`${f} has activity but no final proof yet.`,href:`/group/${u.id.toString()}`,createdAt:u.expenses.at(-1)?.createdAt??0,unread:m(e,t),priority:60})}}catch{return}}));let a=(0,c.uT)();return await Promise.all(a.map(async n=>{try{let a=BigInt(n.id),i=await (0,u.Dj)(a),o=null;try{o=await (0,u.ld)(a)}catch{o=null}let c=(0,s.LH)(i.payerWallet,e.address),l=i.recipients.some(t=>(0,s.LH)(t.wallet,e.address));if(!c&&!l)return;if(o){let n=o.payouts.find(t=>(0,s.LH)(t.recipient,e.address)&&!t.claimed);if(n){let e=`payout_claim:${o.tokenId.toString()}:${n.amount.toString()}`;r.push({id:e,type:"payout_claim",group:"Pending",title:"Funds ready to claim",description:`${(0,s.iH)(n.amount)} TVARA is ready from ${o.title}.`,href:`/work-payouts/proof/${o.tokenId.toString()}`,createdAt:o.paidAt,unread:m(e,t),priority:98})}let a=`payout_proof:${o.tokenId.toString()}`;r.push({id:a,type:"payout_proof",group:"Proof Ready",title:"Proof Ready",description:`${o.title} is ready to share.`,href:`/work-payouts/proof/${o.tokenId.toString()}`,createdAt:o.paidAt,unread:m(a,t),priority:48});return}if(!i.funded&&!i.completed){let e=`payout_fund:${i.id.toString()}:${i.totalAmount.toString()}`;r.push({id:e,type:"payout_fund",group:"Pending",title:c?"Fund this payout":"Waiting for funding",description:c?`${i.title} needs ${(0,s.iH)(i.totalAmount)} TVARA.`:`${i.title} is not funded yet.`,href:`/work-payouts/${i.id.toString()}`,createdAt:i.createdAt,unread:m(e,t),priority:88})}if(i.funded&&!i.completed){let e=`payout_record:${i.id.toString()}`;r.push({id:e,type:"payout_record",group:"Pending",title:c?"Finish record":"Waiting for completion",description:c?`${i.title} is funded and ready for proof.`:`${i.title} is funded and waiting for proof.`,href:`/work-payouts/${i.id.toString()}`,createdAt:i.createdAt,unread:m(e,t),priority:82})}}catch{return}})),r.sort((e,t)=>t.priority-e.priority||t.createdAt-e.createdAt).slice(0,30)}function w(){window.dispatchEvent(new Event(d))}function h(e){let t=(0,l.vT)(),r=(0,a.usePathname)(),i=void 0===e?t.selectedAccount:e,[o,s]=(0,n.useState)([]),[c,u]=(0,n.useState)(!1),[m,w]=(0,n.useState)(null),h=(0,n.useRef)(0),b=(0,n.useCallback)(async()=>{let e=h.current+1;if(h.current=e,!i){s([]),w(null);return}u(!0),w(null);try{let t=await g(i,y());h.current===e&&s(t)}catch(t){h.current===e&&w(t instanceof Error?t.message:"Unable to refresh actions.")}finally{h.current===e&&u(!1)}},[i]),x=(0,n.useCallback)(e=>{let t=y();t.add(e),window.localStorage.setItem(p,JSON.stringify([...t].slice(-300))),s(t=>t.map(t=>t.id===e?{...t,unread:!1}:t))},[]);(0,n.useEffect)(()=>{b()},[b,r]),(0,n.useEffect)(()=>{let e=()=>{b().catch(()=>null)},t=()=>{b().catch(()=>null)},r=e=>{(!e.key||e.key.startsWith("varasplit."))&&b().catch(()=>null)};window.addEventListener(d,e),window.addEventListener("focus",t),window.addEventListener("storage",r);let n=window.setInterval(e,2e4);return()=>{window.removeEventListener(d,e),window.removeEventListener("focus",t),window.removeEventListener("storage",r),window.clearInterval(n)}},[b]);let v=(0,n.useMemo)(()=>o.filter(e=>e.unread).length,[o]),_=(0,n.useMemo)(()=>o.reduce((e,t)=>("Pending"===t.group&&(e.pending+=1,t.type.startsWith("group_")&&(e.pendingGroups+=1),t.type.startsWith("payout_")&&(e.pendingWork+=1)),"Proof Ready"===t.group&&(e.proofReady+=1),e),{...f}),[o]);return{loading:c,error:m,unreadCount:v,items:o,counts:_,refresh:b,markRead:x}}},6653:(e,t,r)=>{r.d(t,{aH:()=>l,bD:()=>f,j3:()=>p,k_:()=>c,s7:()=>u,uT:()=>d,wA:()=>y});var n=r(4111);let a="varasplit.recent-groups",i="varasplit.recent-work-payouts",o="varasplit.member-names",s="varasplit:action-center-refresh";function c(e,t){let r=l(),n=[{id:e,name:t?.trim()||r.find(t=>t.id===e)?.name||`Group #${e}`},...r.filter(t=>t.id!==e)].slice(0,50);window.localStorage.setItem(a,JSON.stringify(n)),window.dispatchEvent(new Event(s))}function l(){try{let e=window.localStorage.getItem(a);if(!e)return[];let t=JSON.parse(e);if(!Array.isArray(t))return[];return t.flatMap(e=>"number"==typeof e?[{id:e,name:`Group #${e}`}]:"object"==typeof e&&null!==e&&"id"in e&&"number"==typeof e.id&&"name"in e&&"string"==typeof e.name?[{id:e.id,name:e.name}]:[])}catch{return[]}}function u(e,t){let r=d(),n=[{id:e,title:t?.trim()||r.find(t=>t.id===e)?.title||`Payout #${e}`},...r.filter(t=>t.id!==e)].slice(0,50);window.localStorage.setItem(i,JSON.stringify(n)),window.dispatchEvent(new Event(s))}function d(){try{let e=window.localStorage.getItem(i);if(!e)return[];let t=JSON.parse(e);if(!Array.isArray(t))return[];return t.flatMap(e=>"number"==typeof e?[{id:e,title:`Payout #${e}`}]:"object"==typeof e&&null!==e&&"id"in e&&"number"==typeof e.id&&"title"in e&&"string"==typeof e.title?[{id:e.id,title:e.title}]:[])}catch{return[]}}function p(e,t){let r=t.trim();if(!r)return;let n=f();n[m(e)]=r,window.localStorage.setItem(o,JSON.stringify(n))}function f(){try{let e=window.localStorage.getItem(o);if(!e)return{};let t=JSON.parse(e);if("object"!=typeof t||null===t)return{};return Object.entries(t).reduce((e,[t,r])=>("string"==typeof r&&r.trim()&&(e[m(t)]=r.trim()),e),{})}catch{return{}}}function y(e,t){return(t??f())[m(e)]??""}function m(e){try{return(0,n.y0)(e)}catch{return e.trim()}}},7572:(e,t,r)=>{r.d(t,{xU:()=>S,FB:()=>_,nL:()=>k,OI:()=>A,Dj:()=>P,ld:()=>E,v8:()=>j});var n=r(3137),a=r(4111),i=r(399),o=r(897);let s=`type PayoutCategory = enum {
  Freelance,
  Bounty,
  Salary,
  Custom,
};

type RecipientEntry = struct {
  name: str,
  wallet: actor_id,
  amount: u128,
};

type WorkPayout = struct {
  id: u64,
  payer_name: str,
  payer_wallet: actor_id,
  recipients: vec RecipientEntry,
  title: str,
  reason: str,
  category: PayoutCategory,
  total_amount: u128,
  funded: bool,
  completed: bool,
  proof_token_id: opt u64,
  created_at: u64,
  paid_at: opt u64,
};

type ProofInvoice = struct {
  token_id: u64,
  payout_id: u64,
  payer_name: str,
  payer_wallet: actor_id,
  recipients: vec RecipientEntry,
  title: str,
  reason: str,
  category: PayoutCategory,
  total_amount: u128,
  created_at: u64,
  paid_at: u64,
  finalize_block: u32,
  finalize_extrinsic_index: u32,
  payouts: vec PayoutRecord,
};

type PayoutRecord = struct {
  recipient: actor_id,
  amount: u128,
  claimed: bool,
};

type WorkPayoutProofError = enum {
  AlreadyCompleted,
  AlreadyFunded,
  InvalidAmount,
  InvalidCategory,
  InvalidDescription,
  InvalidPayerName,
  InvalidRecipient,
  InvalidRecipientCount,
  InvalidTitle,
  NotFunded,
  NotPayer,
  PayoutNotFound,
  ProofNotFound,
  TokenIdOverflow,
  TransferFailed,
  PayoutAlreadyClaimed,
  PayoutNotFoundForRecipient,
};

constructor {
  Create : ();
};

service WorkPayoutProof {
  CreatePayout : (payer_name: str, recipients: vec RecipientEntry, title: str, reason: str, category: PayoutCategory) -> result (WorkPayout, WorkPayoutProofError);
  FundPayout : (payout_id: u64) -> result (WorkPayout, WorkPayoutProofError);
  FinalizePayout : (payout_id: u64, finalize_block: u32, finalize_extrinsic_index: u32) -> result (ProofInvoice, WorkPayoutProofError);
  ClaimPayout : (token_id: u64) -> result (ProofInvoice, WorkPayoutProofError);
  query GetPayout : (payout_id: u64) -> result (WorkPayout, WorkPayoutProofError);
  query GetProof : (payout_id: u64) -> result (ProofInvoice, WorkPayoutProofError);
  query GetProofByToken : (token_id: u64) -> result (ProofInvoice, WorkPayoutProofError);

  events {
    PayoutCreated: struct {
      payout_id: u64,
      payer_wallet: actor_id,
      total_amount: u128,
    };
    PayoutFunded: struct {
      payout_id: u64,
      payer_wallet: actor_id,
      amount: u128,
    };
    PayoutFinalized: struct {
      payout_id: u64,
      token_id: u64,
      total_amount: u128,
    };
    ProofMinted: struct {
      token_id: u64,
      payout_id: u64,
    };
    RecipientPaid: struct {
      token_id: u64,
      recipient: actor_id,
      amount: u128,
    };
    PayoutClaimed: struct {
      token_id: u64,
      recipient: actor_id,
      amount: u128,
    };
  }
};
`,c=null;function l(e){return"bigint"==typeof e?e:"number"==typeof e||"string"==typeof e?BigInt(e):e&&"object"==typeof e&&"toString"in e?BigInt(String(e)):BigInt(0)}function u(e){if(null==e)return null;if("bigint"==typeof e||"number"==typeof e||"string"==typeof e)return l(e);if(e&&"object"==typeof e){if("Some"in e)return l(e.Some);if("some"in e)return l(e.some)}return null}function d(e){return"string"==typeof e?e:e&&"object"==typeof e?JSON.stringify(e):String(e)}function p(e){if(!e||"object"!=typeof e)return e;if("Ok"in e)return e.Ok;if("ok"in e)return e.ok;if("Err"in e)throw Error(d(e.Err));if("err"in e)throw Error(d(e.err));return e}function f(e){if("string"==typeof e)return e;if(e&&"object"==typeof e){let[t]=Object.keys(e);if(t)return t}return"Custom"}function y(e){return Array.isArray(e)?e.map(e=>({name:String(e.name??""),wallet:(0,a.y0)(e.wallet),amount:l(e.amount)})):[]}function m(e){let t;return{id:l(e.id),payerName:String(e.payer_name??e.payerName??""),payerWallet:(0,a.y0)(e.payer_wallet??e.payerWallet),recipients:y(e.recipients),title:String(e.title??""),reason:String(e.reason??""),category:f(e.category),totalAmount:l(e.total_amount??e.totalAmount),funded:!!e.funded,completed:!!e.completed,proofTokenId:u(e.proof_token_id??e.proofTokenId),createdAt:Number(e.created_at??e.createdAt??0),paidAt:null==(t=u(e.paid_at??e.paidAt))?null:Number(t)}}function g(e){var t;return{tokenId:l(e.token_id??e.tokenId),payoutId:l(e.payout_id??e.payoutId),payerName:String(e.payer_name??e.payerName??""),payerWallet:(0,a.y0)(e.payer_wallet??e.payerWallet),recipients:y(e.recipients),title:String(e.title??""),reason:String(e.reason??""),category:f(e.category),totalAmount:l(e.total_amount??e.totalAmount),createdAt:Number(e.created_at??e.createdAt??0),paidAt:Number(e.paid_at??e.paidAt??0),finalizeBlock:Number(e.finalize_block??e.finalizeBlock??0),finalizeExtrinsicIndex:Number(e.finalize_extrinsic_index??e.finalizeExtrinsicIndex??0),payouts:Array.isArray(t=e.payouts)?t.map(e=>({recipient:(0,a.y0)(e.recipient),amount:l(e.amount),claimed:!!e.claimed})):[]}}function w(){let e=(0,o.$q)();if(!e.selectedAccount||!e.injector?.signer)throw Error("Connect a wallet before sending a transaction.");return e}async function h(){let e=(0,n.lY)();if(e)throw Error(e);return c||(c=(async()=>{try{let e=await (0,i.KU)(),{Sails:t}=await Promise.all([r.e(488),r.e(946)]).then(r.bind(r,4413)),{SailsIdlParser:a}=await r.e(288).then(r.bind(r,4288)),o=await a.new(),c=new t(o);return c.parseIdl(s),c.setApi(e).setProgramId(n.sT),c}catch(e){throw c=null,Error(`Failed to initialize WorkPayoutProof: ${e instanceof Error?e.message:String(e)}`)}})()),c}async function b(e){let t=w();e.withAccount(t.selectedAccount.address,{signer:t.injector.signer}),await e.calculateGas();try{let t=await e.signAndSend(),r=await t.response();return{blockHash:t.blockHash,txHash:t.txHash,response:r}}catch(e){if(e instanceof Error&&/cancel|reject/i.test(e.message))throw Error("Transaction was rejected by the user.");throw Error(e instanceof Error?e.message:"Transaction failed on chain.")}}async function x(e){return p((await b(e)).response)}async function v(e,t){let r=(0,o.$q)();return r.selectedAccount?.address&&e.withAddress(r.selectedAccount.address),t(p(await e.call()))}async function _(e,t,r,n,i){let o=(await h()).services.WorkPayoutProof.functions.CreatePayout(e,t.map(e=>({name:e.name,wallet:(0,a.a1)(e.wallet),amount:e.amount})),r,n,i);return m(await x(o))}async function A(e,t){if(t<=BigInt(0))throw Error("Funding amount must be greater than zero.");let r=await h(),n=w(),a=r.services.WorkPayoutProof.functions.FundPayout(e);a.withAccount(n.selectedAccount.address,{signer:n.injector.signer}),a.withValue(t),await a.calculateGas();try{let e=await a.signAndSend(),t=await e.response();return m(p(t))}catch(e){if(e instanceof Error&&/cancel|reject/i.test(e.message))throw Error("Transaction was rejected by the user.");throw Error(e instanceof Error?e.message:"Funding failed on chain.")}}async function k(e,t=0,r=0){let n=(await h()).services.WorkPayoutProof.functions.FinalizePayout(e,t,r);return g(await x(n))}async function S(e){let t=(await h()).services.WorkPayoutProof.functions.ClaimPayout(e);return g(await x(t))}async function P(e){return v((await h()).services.WorkPayoutProof.queries.GetPayout(e),m)}async function E(e){return v((await h()).services.WorkPayoutProof.queries.GetProof(e),g)}async function j(e){return v((await h()).services.WorkPayoutProof.queries.GetProofByToken(e),g)}}}]);