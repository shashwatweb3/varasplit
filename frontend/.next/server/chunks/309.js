exports.id=309,exports.ids=[309],exports.modules={6930:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,95547,23))},16655:(a,b,c)=>{"use strict";c.d(b,{xU:()=>z,FB:()=>w,nL:()=>y,OI:()=>x,Dj:()=>A,ld:()=>B,v8:()=>C});var d=c(27267),e=c(51395),f=c(28423),g=c(66409);let h=`type PayoutCategory = enum {
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
`,i=null;function j(a){return"bigint"==typeof a?a:"number"==typeof a||"string"==typeof a?BigInt(a):a&&"object"==typeof a&&"toString"in a?BigInt(String(a)):BigInt(0)}function k(a){if(null==a)return null;if("bigint"==typeof a||"number"==typeof a||"string"==typeof a)return j(a);if(a&&"object"==typeof a){if("Some"in a)return j(a.Some);if("some"in a)return j(a.some)}return null}function l(a){return"string"==typeof a?a:a&&"object"==typeof a?JSON.stringify(a):String(a)}function m(a){if(!a||"object"!=typeof a)return a;if("Ok"in a)return a.Ok;if("ok"in a)return a.ok;if("Err"in a)throw Error(l(a.Err));if("err"in a)throw Error(l(a.err));return a}function n(a){if("string"==typeof a)return a;if(a&&"object"==typeof a){let[b]=Object.keys(a);if(b)return b}return"Custom"}function o(a){return Array.isArray(a)?a.map(a=>({name:String(a.name??""),wallet:(0,e.y0)(a.wallet),amount:j(a.amount)})):[]}function p(a){let b;return{id:j(a.id),payerName:String(a.payer_name??a.payerName??""),payerWallet:(0,e.y0)(a.payer_wallet??a.payerWallet),recipients:o(a.recipients),title:String(a.title??""),reason:String(a.reason??""),category:n(a.category),totalAmount:j(a.total_amount??a.totalAmount),funded:!!a.funded,completed:!!a.completed,proofTokenId:k(a.proof_token_id??a.proofTokenId),createdAt:Number(a.created_at??a.createdAt??0),paidAt:null==(b=k(a.paid_at??a.paidAt))?null:Number(b)}}function q(a){var b;return{tokenId:j(a.token_id??a.tokenId),payoutId:j(a.payout_id??a.payoutId),payerName:String(a.payer_name??a.payerName??""),payerWallet:(0,e.y0)(a.payer_wallet??a.payerWallet),recipients:o(a.recipients),title:String(a.title??""),reason:String(a.reason??""),category:n(a.category),totalAmount:j(a.total_amount??a.totalAmount),createdAt:Number(a.created_at??a.createdAt??0),paidAt:Number(a.paid_at??a.paidAt??0),finalizeBlock:Number(a.finalize_block??a.finalizeBlock??0),finalizeExtrinsicIndex:Number(a.finalize_extrinsic_index??a.finalizeExtrinsicIndex??0),payouts:Array.isArray(b=a.payouts)?b.map(a=>({recipient:(0,e.y0)(a.recipient),amount:j(a.amount),claimed:!!a.claimed})):[]}}function r(){let a=(0,g.$q)();if(!a.selectedAccount||!a.injector?.signer)throw Error("Connect a wallet before sending a transaction.");return a}async function s(){let a=(0,d.lY)();if(a)throw Error(a);return i||(i=(async()=>{try{let a=await (0,f.KU)(),{Sails:b}=await Promise.all([c.e(104),c.e(537)]).then(c.bind(c,54648)),{SailsIdlParser:e}=await c.e(143).then(c.bind(c,77143)),g=await e.new(),i=new b(g);return i.parseIdl(h),i.setApi(a).setProgramId(d.sT),i}catch(a){throw i=null,Error(`Failed to initialize WorkPayoutProof: ${a instanceof Error?a.message:String(a)}`)}})()),i}async function t(a){let b=r();a.withAccount(b.selectedAccount.address,{signer:b.injector.signer}),await a.calculateGas();try{let b=await a.signAndSend(),c=await b.response();return{blockHash:b.blockHash,txHash:b.txHash,response:c}}catch(a){if(a instanceof Error&&/cancel|reject/i.test(a.message))throw Error("Transaction was rejected by the user.");throw Error(a instanceof Error?a.message:"Transaction failed on chain.")}}async function u(a){return m((await t(a)).response)}async function v(a,b){let c=(0,g.$q)();return c.selectedAccount?.address&&a.withAddress(c.selectedAccount.address),b(m(await a.call()))}async function w(a,b,c,d,f){let g=(await s()).services.WorkPayoutProof.functions.CreatePayout(a,b.map(a=>({name:a.name,wallet:(0,e.a1)(a.wallet),amount:a.amount})),c,d,f);return p(await u(g))}async function x(a,b){if(b<=BigInt(0))throw Error("Funding amount must be greater than zero.");let c=await s(),d=r(),e=c.services.WorkPayoutProof.functions.FundPayout(a);e.withAccount(d.selectedAccount.address,{signer:d.injector.signer}),e.withValue(b),await e.calculateGas();try{let a=await e.signAndSend(),b=await a.response();return p(m(b))}catch(a){if(a instanceof Error&&/cancel|reject/i.test(a.message))throw Error("Transaction was rejected by the user.");throw Error(a instanceof Error?a.message:"Funding failed on chain.")}}async function y(a,b=0,c=0){let d=(await s()).services.WorkPayoutProof.functions.FinalizePayout(a,b,c);return q(await u(d))}async function z(a){let b=(await s()).services.WorkPayoutProof.functions.ClaimPayout(a);return q(await u(b))}async function A(a){return v((await s()).services.WorkPayoutProof.queries.GetPayout(a),p)}async function B(a){return v((await s()).services.WorkPayoutProof.queries.GetProof(a),q)}async function C(a){return v((await s()).services.WorkPayoutProof.queries.GetProofByToken(a),q)}},27267:(a,b,c)=>{"use strict";c.d(b,{C3:()=>d,Nc:()=>j,PF:()=>e,lY:()=>k,sT:()=>f,sg:()=>i,v$:()=>h,yy:()=>g});let d="VaraSplit",e="0xbc80a0240c21d2cbcde676110d3b7b72be2aeade7e0d2c1c0f404b66f57efda0",f="0x183bfc9f25a1c5aac52402c5484c07bea5c32f01f1bb794a8d36d040b0d541d4",g="wss://testnet.vara.network",h=g,i=12,j="https://vara.subscan.io/extrinsic";function k(){return f?h?null:"Vara RPC endpoint is not configured.":"Work & Payouts program ID is not configured."}},28423:(a,b,c)=>{"use strict";c.d(b,{KU:()=>h,kC:()=>i});var d=c(27267);let e=null,f=null,g=null;async function h(){return e?.isConnected?e:(f||(f=(async()=>{try{let{GearApi:a}=await Promise.all([c.e(104),c.e(411)]).then(c.bind(c,98104)),b=await a.create({providerAddress:d.yy});return g&&b.setSigner(g),e=b,b}catch(a){throw e=null,Error(`Failed to connect to Vara testnet RPC: ${a instanceof Error?a.message:String(a)}`)}finally{f=null}})()),f)}async function i(a){g=a,(await h()).setSigner(a)}},29552:(a,b,c)=>{"use strict";c.d(b,{l:()=>y});var d=c(48249),e=c(2116),f=c.n(e),g=c(74817),h=c(36411),i=c(27073),j=c(69924),k=c(49681),l=c(86588),m=c(67484),n=c(63771),o=c(66409);let p=["Pending","Proof Ready"];function q(){let a=(0,o.vT)(),[b,c]=(0,m.useState)(!1),{items:e,unreadCount:q,loading:r,error:s,refresh:t,markRead:u}=(0,n.F7)(a.selectedAccount),v=e.length;return a.isConnected?(0,d.jsxs)("div",{className:"relative",children:[(0,d.jsxs)(g.P.button,{type:"button",whileHover:{y:-2},whileTap:{scale:.96},onClick:()=>c(a=>!a),className:"relative grid h-11 w-11 place-items-center rounded-[18px] border border-[#70ffc4]/18 bg-[#142a1f]/60 text-[#d8fff0] shadow-[0_16px_44px_rgba(0,0,0,0.22)] transition hover:border-[#70ffc4]/42 hover:bg-[#69f5c7]/10","aria-label":"Open pending actions",children:[(0,d.jsx)(i.A,{className:"h-5 w-5"}),v>0?(0,d.jsx)(g.P.span,{initial:{scale:0},animate:{scale:1},className:"absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#69f5c7] px-1 text-[10px] font-black text-[#03100b] shadow-[0_0_24px_rgba(105,245,199,0.45)]",children:v}):null]}),(0,d.jsx)(h.N,{children:b?(0,d.jsxs)(g.P.div,{initial:{opacity:0,y:12,scale:.96},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:10,scale:.96},transition:{duration:.22},className:"absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,390px)] overflow-hidden rounded-[28px] border border-[#70ffc4]/18 bg-[#040807]/94 p-3 shadow-[0_28px_100px_rgba(0,0,0,0.55),0_0_54px_rgba(105,245,199,0.12)] backdrop-blur-2xl",children:[(0,d.jsxs)("div",{className:"flex items-start justify-between gap-3 p-3",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("p",{className:"text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]",children:"Action center"}),(0,d.jsx)("h3",{className:"mt-1 text-xl font-black text-[#ecfff7]",children:v>0?`${v} record${1===v?"":"s"} to review`:"You’re all caught up"}),q>0?(0,d.jsxs)("p",{className:"mt-1 text-xs text-[rgba(236,255,247,0.6)]",children:[q," new since you last opened them"]}):null]}),(0,d.jsx)("button",{type:"button",onClick:t,className:"rounded-full border border-[#70ffc4]/16 p-2 text-[#bcffe5] transition hover:border-[#70ffc4]/36",children:(0,d.jsx)(j.A,{className:`h-4 w-4 ${r?"animate-spin":""}`})})]}),(0,d.jsxs)("div",{className:"max-h-[420px] space-y-3 overflow-auto p-2",children:[s?(0,d.jsx)("div",{className:"rounded-[22px] border border-[#ff7a7a]/20 bg-[#3a1010]/35 p-3 text-sm leading-6 text-[#ffd6d6]",children:s}):null,p.map(a=>{let b=e.filter(b=>b.group===a);return b.length?(0,d.jsxs)("div",{children:[(0,d.jsx)("p",{className:"px-2 text-[10px] font-black uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]",children:a}),(0,d.jsx)("div",{className:"mt-2 space-y-2",children:b.map(a=>{var b;return(0,d.jsxs)(f(),{href:a.href,onClick:()=>{u(a.id),c(!1)},className:`group flex items-start gap-3 rounded-[20px] border p-3 transition hover:border-[#70ffc4]/30 hover:bg-[#69f5c7]/10 ${a.unread?"border-[#70ffc4]/22 bg-[#69f5c7]/10":"border-[#70ffc4]/12 bg-[#07110d]/72"}`,children:[(0,d.jsx)("span",{className:`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${(b=a.type).includes("proof")||b.includes("claim")?"bg-[#39d98a]/12 text-[#bcffe5]":"bg-[#7dffd4]/10 text-[#d8fff0]"}`,children:a.type.includes("proof")?(0,d.jsx)(k.A,{className:"h-4 w-4"}):(0,d.jsx)(i.A,{className:"h-4 w-4"})}),(0,d.jsxs)("span",{className:"min-w-0 flex-1",children:[(0,d.jsxs)("span",{className:"flex items-center gap-2 text-sm font-bold text-[#ecfff7]",children:[a.title,a.unread?(0,d.jsx)("span",{className:"h-2 w-2 rounded-full bg-[#69f5c7] shadow-[0_0_14px_rgba(105,245,199,0.8)]"}):null]}),(0,d.jsx)("span",{className:"mt-1 block text-xs leading-5 text-[rgba(236,255,247,0.68)]",children:a.description})]}),(0,d.jsx)(l.A,{className:"mt-1 h-4 w-4 shrink-0 text-[rgba(190,230,214,0.5)] transition group-hover:text-[#69f5c7]"})]},a.id)})})]},a):null}),e.length||s?null:(0,d.jsxs)("div",{className:"rounded-[22px] border border-[#70ffc4]/12 bg-[#07110d]/72 p-4 text-sm leading-6 text-[rgba(236,255,247,0.72)]",children:[(0,d.jsx)("span",{className:"block text-base font-black text-[#ecfff7]",children:"You’re all caught up"}),(0,d.jsx)("span",{className:"mt-1 block",children:"No pending actions right now. Proof-ready records appear here automatically."})]})]})]}):null})]}):null}var r=c(96029),s=c(52181),t=c(51395),u=c(46674),v=c(17512);function w({open:a,accounts:b,loading:c,error:e,onClose:f,onRefresh:i,onSelect:j}){return(0,d.jsx)(h.N,{children:a?(0,d.jsx)(g.P.div,{className:"fixed inset-0 z-50 grid place-items-end bg-[#040807]/82 px-4 pb-4 backdrop-blur-md sm:place-items-center sm:pb-0",initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},children:(0,d.jsxs)(g.P.div,{initial:{opacity:0,y:28,scale:.98},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:18,scale:.98},transition:{type:"spring",stiffness:260,damping:24},className:"glass-card w-full max-w-lg p-5",children:[(0,d.jsxs)("div",{className:"flex items-start justify-between gap-4",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("p",{className:"text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]",children:"Wallet access"}),(0,d.jsx)("h2",{className:"mt-2 text-2xl font-semibold text-[#ecfff7]",children:"Choose an account"}),(0,d.jsx)("p",{className:"mt-1 text-sm text-[rgba(236,255,247,0.72)]",children:"This wallet signs VaraSplit actions on Vara testnet."})]}),(0,d.jsxs)(g.P.button,{type:"button",whileTap:{scale:.96},onClick:f,className:"secondary-button px-3 py-2 text-sm",children:[(0,d.jsx)(u.A,{className:"h-4 w-4"}),"Close"]})]}),e?(0,d.jsx)("p",{className:"mt-4 rounded-[20px] border border-[#ff7f9b]/30 bg-[#ff7f9b]/10 p-3 text-sm text-[#ffd5de]",children:e}):null,(0,d.jsx)("div",{className:"mt-5 space-y-3",children:b.map((a,b)=>(0,d.jsx)(g.P.button,{type:"button",onClick:()=>j(a),initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{delay:.04*b},whileHover:{y:-2},whileTap:{scale:.98},className:"soft-card w-full p-4 text-left hover:border-[#69f5c7]/50",children:(0,d.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("p",{className:"font-semibold text-[#ecfff7]",children:a.meta.name||"Unnamed account"}),(0,d.jsxs)("p",{className:"mt-1 text-xs text-[rgba(190,230,214,0.5)]",children:[(0,t.Dc)(a.address)," \xb7 ",a.meta.source]})]}),(0,d.jsx)(k.A,{className:"h-5 w-5 text-[#69f5c7]"})]})},`${a.meta.source}-${a.address}`))}),b.length?null:(0,d.jsxs)("div",{className:"mt-4 rounded-[22px] border border-[#70ffc4]/14 bg-[#142a1f]/45 p-4 text-sm text-[rgba(236,255,247,0.72)]",children:[(0,d.jsx)(v.A,{className:"mb-3 h-5 w-5 text-[#69f5c7]"}),"Approve access in SubWallet, Polkadot.js, or Talisman to continue."]}),(0,d.jsx)(g.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:i,disabled:c,className:"primary-button mt-4 w-full",children:c?"Checking wallets...":"Refresh Wallets"})]})}):null})}function x(){let a=(0,o.vT)(),[b,c]=(0,m.useState)(!1);async function e(){await (0,o.kv)(),c(!0)}let f="connecting"===a.status;return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("div",{className:"flex flex-wrap items-center justify-end gap-2",children:a.isConnected&&a.selectedAccount?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)(g.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:()=>c(!0),className:"inline-flex items-center gap-2 rounded-[20px] border border-[#70ffc4]/25 bg-[#69f5c7]/10 px-3 py-2 text-sm font-semibold text-[#ecfff7] shadow-[0_12px_34px_rgba(105,245,199,0.13)]",children:[(0,d.jsx)("span",{className:"h-2 w-2 rounded-full bg-[#69f5c7] shadow-[0_0_16px_rgba(125,255,212,0.9)]"}),a.selectedAccount.meta.name||(0,t.Dc)(a.selectedAccount.address)]}),(0,d.jsxs)(g.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:()=>c(!0),className:"secondary-button px-3 py-2 text-sm",children:[(0,d.jsx)(j.A,{className:"h-4 w-4"}),"Switch"]}),(0,d.jsxs)(g.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:o._r,className:"secondary-button px-3 py-2 text-sm",children:[(0,d.jsx)(r.A,{className:"h-4 w-4"}),"Disconnect"]})]}):(0,d.jsxs)(g.P.button,{type:"button",whileHover:{y:-1},whileTap:{scale:.98},onClick:e,disabled:f,className:"primary-button px-4 py-2 text-sm",children:[(0,d.jsx)(s.A,{className:"h-4 w-4"}),f?"Connecting...":"Connect Wallet"]})}),(0,d.jsx)(w,{open:b,accounts:a.availableAccounts,loading:f,error:a.error,onClose:()=>c(!1),onRefresh:o.Yt,onSelect:a=>{(0,o.ZD)(a).then(()=>c(!1))}})]})}function y(){return(0,d.jsxs)("div",{className:"flex items-center gap-2",children:[(0,d.jsx)(q,{}),(0,d.jsx)(x,{})]})}},30490:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,81921,23))},30599:(a,b,c)=>{"use strict";c.d(b,{aH:()=>f,bD:()=>j,j3:()=>i,k_:()=>e,s7:()=>g,uT:()=>h,wA:()=>k});var d=c(51395);function e(a,b){}function f(){return[]}function g(a,b){}function h(){return[]}function i(a,b){}function j(){return{}}function k(a,b){return(b??{})[function(a){try{return(0,d.y0)(a)}catch{return a.trim()}}(a)]??""}},32056:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>g,metadata:()=>f});var d=c(5735),e=c(46350);c(82704);let f={title:"VaraSplit | Split and payout proofs",description:"Split shared costs, pay work, claim funds, and share verified records on Vara."};function g({children:a}){return(0,d.jsx)("html",{lang:"en",children:(0,d.jsxs)("body",{children:[(0,d.jsx)(e.AppPreloader,{}),a]})})}},33804:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,81921,23)),Promise.resolve().then(c.t.bind(c,60440,23)),Promise.resolve().then(c.t.bind(c,84342,23)),Promise.resolve().then(c.t.bind(c,82265,23)),Promise.resolve().then(c.t.bind(c,35421,23)),Promise.resolve().then(c.t.bind(c,61335,23)),Promise.resolve().then(c.t.bind(c,70664,23)),Promise.resolve().then(c.bind(c,74661))},46212:(a,b,c)=>{"use strict";c.d(b,{AppPreloader:()=>i});var d=c(48249),e=c(67484),f=c(36411),g=c(74817);let h=["VARASPLIT","वारा स्प्लिट","ヴァラスプリット","바라스플릿","ВараСплит","فارا سبلِت","瓦拉分账","वारा विभाजन","VaraSplit"];function i(){let[a,b]=(0,e.useState)(!1),[c,i]=(0,e.useState)(0);return(0,d.jsx)(f.N,{children:a?(0,d.jsxs)(g.P.div,{className:"fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#040807]",initial:{opacity:1},exit:{opacity:0,y:"-12%",borderBottomLeftRadius:"48%",borderBottomRightRadius:"48%"},transition:{duration:.65,ease:[.22,1,.36,1]},children:[(0,d.jsx)(g.P.div,{className:"absolute h-[34rem] w-[34rem] rounded-full bg-[#69f5c7]/12 blur-3xl",animate:{scale:[.92,1.12,.96],opacity:[.25,.5,.28]},transition:{duration:1.2,repeat:1/0}}),(0,d.jsxs)("div",{className:"relative text-center",children:[(0,d.jsx)(g.P.p,{initial:{opacity:0,y:16,filter:"blur(10px)"},animate:{opacity:1,y:0,filter:"blur(0px)"},exit:{opacity:0,y:-12,filter:"blur(10px)"},className:"text-4xl font-black tracking-[-0.04em] text-[#ecfff7] sm:text-6xl",children:h[c]},c),(0,d.jsx)("div",{className:"mx-auto mt-6 h-1 w-44 overflow-hidden rounded-full bg-[#142a1f]",children:(0,d.jsx)(g.P.div,{className:"h-full rounded-full bg-[#69f5c7] shadow-[0_0_28px_rgba(105,245,199,0.7)]",initial:{width:"0%"},animate:{width:"100%"},transition:{duration:1.15,ease:"easeInOut"}})})]})]}):null})}},46350:(a,b,c)=>{"use strict";c.d(b,{AppPreloader:()=>d});let d=(0,c(77943).registerClientReference)(function(){throw Error("Attempted to call AppPreloader() from the server but AppPreloader is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/Users/shashwatchauhan/varasplit/frontend/components/AppPreloader.tsx","AppPreloader")},47002:(a,b,c)=>{Promise.resolve().then(c.bind(c,46350))},51395:(a,b,c)=>{"use strict";c.d(b,{$m:()=>l,AT:()=>r,Dc:()=>k,Ey:()=>u,LH:()=>p,Q:()=>t,S6:()=>o,TF:()=>s,a1:()=>m,iH:()=>q,y0:()=>n});var d=c(34564),e=c(86793),f=c(23778),g=c(45628),h=c(44748),i=c(27267);let j=BigInt(10)**BigInt(i.sg);function k(a){return`${a.slice(0,6)}...${a.slice(-6)}`}function l(a){return!!a.trim()&&(0,d.P)(a.trim())}function m(a){let b=a.trim();if(/^0x[0-9a-fA-F]{64}$/.test(b))return(0,g.V)(b);if(!l(b))throw Error(`Invalid address: ${a}`);return(0,e.F)(b)}function n(a){if("string"==typeof a){let b=a.trim();if(!b)return b;if(b.startsWith("0x"))return b.toLowerCase();try{return(0,h.X)(m(b)).toLowerCase()}catch{return b}}if(a instanceof Uint8Array)return(0,h.X)(a).toLowerCase();if(Array.isArray(a)&&a.every(a=>"number"==typeof a))return(0,h.X)(new Uint8Array(a)).toLowerCase();if(a&&"object"==typeof a){if("function"==typeof a.toHex)return a.toHex().toLowerCase();if("function"==typeof a.toU8a)return(0,h.X)(a.toU8a()).toLowerCase()}return String(a)}function o(a){if(!a.startsWith("0x"))return a;try{return(0,f.j)(a)}catch{return a}}function p(a,b){try{return n(a)===n(b)}catch{return a.trim()===b.trim()}}function q(a){let b=a<BigInt(0),c=b?-a:a,d=c/j,e=(c%j).toString().padStart(i.sg,"0").replace(/0+$/,""),f=e?`${d.toString()}.${e}`:d.toString();return b?`-${f}`:f}function r(a){let b=a.trim();if(!b)throw Error("Amount is required.");if(!/^\d+(?:\.\d{0,12})?$/.test(b))throw Error("Enter a valid TVARA amount with up to 12 decimal places.");let[c,d=""]=b.split("."),e=BigInt(c)*j+BigInt((d||"").padEnd(i.sg,"0"));if(e<=BigInt(0))throw Error("Amount must be greater than 0 TVARA.");return e}function s(a){return""===a||/^\d*(?:\.\d{0,12})?$/.test(a)}function t(a,b="id"){if(!a||!/^\d+$/.test(a))throw Error(`Invalid ${b}.`);return BigInt(a)}function u(a){return a?new Date(a>1e10?a:1e3*a).toLocaleString():"Unknown"}},57759:(a,b,c)=>{"use strict";c.d(b,{Sb:()=>g,at:()=>f,u0:()=>e});var d=c(51395);function e(a,b){return Object.values(b.reduce((b,c)=>{let e,f=(0,d.y0)(c.from),g=b[f]??{address:f,required:BigInt(0),deposited:(e=(0,d.y0)(f),a.escrow[e]??BigInt(0)),remaining:BigInt(0),paid:!1};return g.required+=c.amount,g.remaining=g.required>g.deposited?g.required-g.deposited:BigInt(0),g.paid=g.required>BigInt(0)&&g.deposited>=g.required,b[f]=g,b},{}))}function f(a,b){let c=e(a,b);return c.length>0&&c.every(a=>a.paid)}function g(a,b){return!!(a?.settled||b)}},63771:(a,b,c)=>{"use strict";c.d(b,{F7:()=>p,MJ:()=>o});var d=c(67484),e=c(19099),f=c(90612),g=c(57759),h=c(51395),i=c(30599),j=c(66409),k=c(16655);let l={pendingGroups:0,pendingWork:0,pending:0,proofReady:0};function m(a,b){return!b.has(a)}async function n(a,b){let c=[],d=(0,i.aH)();await Promise.all(d.map(async d=>{try{let j=BigInt(d.id),[k,l]=await Promise.all([(0,f.Wx)(j),(0,f.lN)(j).catch(()=>[])]),n=null;try{n=await (0,f.Y4)(j)}catch{n=null}let o=k.name||d.name||`Group #${k.id.toString()}`,p=k.members.some(b=>(0,h.LH)(b,a.address));if(n){var e,i;if(!p&&(e=n,i=a.address,!(e.transfers.some(a=>(0,h.LH)(a.from,i)||(0,h.LH)(a.to,i))||e.payouts.some(a=>(0,h.LH)(a.creditor,i)))))return;let d=n.payouts.find(b=>(0,h.LH)(b.creditor,a.address)&&!b.claimed);if(d){let a=`group_claim:${n.tokenId.toString()}:${d.amount.toString()}`;c.push({id:a,type:"group_claim",group:"Pending",title:"Funds ready to claim",description:`You can claim ${(0,h.iH)(d.amount)} TVARA from ${o}.`,href:`/invoice/${n.tokenId.toString()}`,createdAt:n.settledAt,unread:m(a,b),priority:100})}let f=`group_proof:${n.tokenId.toString()}`;c.push({id:f,type:"group_proof",group:"Proof Ready",title:"Proof Ready",description:`${o} is ready to share.`,href:`/invoice/${n.tokenId.toString()}`,createdAt:n.settledAt,unread:m(f,b),priority:50});return}let q=(0,g.u0)(k,l).find(b=>(0,h.LH)(b.address,a.address));if(q&&q.remaining>BigInt(0)){let a=`group_pay:${k.id.toString()}:${q.remaining.toString()}`;c.push({id:a,type:"group_pay",group:"Pending",title:"Payment needed",description:`You still need to add ${(0,h.iH)(q.remaining)} TVARA for ${o}.`,href:`/group/${k.id.toString()}`,createdAt:k.expenses.at(-1)?.createdAt??0,unread:m(a,b),priority:90});return}let r=l.length>0&&(0,g.u0)(k,l).every(a=>a.remaining<=BigInt(0));if(p&&r){let a=`group_finish:${k.id.toString()}`;c.push({id:a,type:"group_proof",group:"Pending",title:"Finish record",description:`${o} is funded and waiting for completion.`,href:`/group/${k.id.toString()}`,createdAt:k.expenses.at(-1)?.createdAt??0,unread:m(a,b),priority:86});return}if(p&&k.expenses.length>0&&!k.settled){let a=`group_waiting:${k.id.toString()}:${k.expenses.length}`;c.push({id:a,type:"group_proof",group:"Pending",title:"Waiting for completion",description:`${o} has activity but no final proof yet.`,href:`/group/${k.id.toString()}`,createdAt:k.expenses.at(-1)?.createdAt??0,unread:m(a,b),priority:60})}}catch{return}}));let e=(0,i.uT)();return await Promise.all(e.map(async d=>{try{let e=BigInt(d.id),f=await (0,k.Dj)(e),g=null;try{g=await (0,k.ld)(e)}catch{g=null}let i=(0,h.LH)(f.payerWallet,a.address),j=f.recipients.some(b=>(0,h.LH)(b.wallet,a.address));if(!i&&!j)return;if(g){let d=g.payouts.find(b=>(0,h.LH)(b.recipient,a.address)&&!b.claimed);if(d){let a=`payout_claim:${g.tokenId.toString()}:${d.amount.toString()}`;c.push({id:a,type:"payout_claim",group:"Pending",title:"Funds ready to claim",description:`${(0,h.iH)(d.amount)} TVARA is ready from ${g.title}.`,href:`/work-payouts/proof/${g.tokenId.toString()}`,createdAt:g.paidAt,unread:m(a,b),priority:98})}let e=`payout_proof:${g.tokenId.toString()}`;c.push({id:e,type:"payout_proof",group:"Proof Ready",title:"Proof Ready",description:`${g.title} is ready to share.`,href:`/work-payouts/proof/${g.tokenId.toString()}`,createdAt:g.paidAt,unread:m(e,b),priority:48});return}if(!f.funded&&!f.completed){let a=`payout_fund:${f.id.toString()}:${f.totalAmount.toString()}`;c.push({id:a,type:"payout_fund",group:"Pending",title:i?"Fund this payout":"Waiting for funding",description:i?`${f.title} needs ${(0,h.iH)(f.totalAmount)} TVARA.`:`${f.title} is not funded yet.`,href:`/work-payouts/${f.id.toString()}`,createdAt:f.createdAt,unread:m(a,b),priority:88})}if(f.funded&&!f.completed){let a=`payout_record:${f.id.toString()}`;c.push({id:a,type:"payout_record",group:"Pending",title:i?"Finish record":"Waiting for completion",description:i?`${f.title} is funded and ready for proof.`:`${f.title} is funded and waiting for proof.`,href:`/work-payouts/${f.id.toString()}`,createdAt:f.createdAt,unread:m(a,b),priority:82})}}catch{return}})),c.sort((a,b)=>b.priority-a.priority||b.createdAt-a.createdAt).slice(0,30)}function o(){}function p(a){let b=(0,j.vT)();(0,e.usePathname)();let c=void 0===a?b.selectedAccount:a,[f,g]=(0,d.useState)([]),[h,i]=(0,d.useState)(!1),[k,m]=(0,d.useState)(null),o=(0,d.useRef)(0),p=(0,d.useCallback)(async()=>{let a=o.current+1;if(o.current=a,!c){g([]),m(null);return}i(!0),m(null);try{let b=await n(c,new Set);o.current===a&&g(b)}catch(b){o.current===a&&m(b instanceof Error?b.message:"Unable to refresh actions.")}finally{o.current===a&&i(!1)}},[c]),q=(0,d.useCallback)(a=>{new Set().add(a),g(b=>b.map(b=>b.id===a?{...b,unread:!1}:b))},[]),r=(0,d.useMemo)(()=>f.filter(a=>a.unread).length,[f]),s=(0,d.useMemo)(()=>f.reduce((a,b)=>("Pending"===b.group&&(a.pending+=1,b.type.startsWith("group_")&&(a.pendingGroups+=1),b.type.startsWith("payout_")&&(a.pendingWork+=1)),"Proof Ready"===b.group&&(a.proofReady+=1),a),{...l}),[f]);return{loading:h,error:k,unreadCount:r,items:f,counts:s,refresh:p,markRead:q}}},66409:(a,b,c)=>{"use strict";c.d(b,{$q:()=>m,Yt:()=>n,ZD:()=>o,_r:()=>q,kv:()=>p,vT:()=>r});var d=c(67484),e=(c(27267),c(28423));let f={selectedAccount:null,injector:null,isConnected:!1,availableAccounts:[],status:"idle",error:null},g=f,h=new Set;function i(a){g={...g,...a},h.forEach(a=>a())}function j(a){return h.add(a),()=>h.delete(a)}function k(){return g}function l(){return f}function m(){return g}async function n(){return i({status:"missing",error:"Wallets are available only in the browser."}),[]}async function o(a){try{let{web3FromSource:b}=await c.e(554).then(c.bind(c,62554)),d=await b(a.meta.source);if(!d?.signer)throw Error("Signer missing for selected account.");await (0,e.kC)(d.signer),i({selectedAccount:a,injector:d,isConnected:!0,status:"connected",error:null})}catch(a){var b;i({selectedAccount:null,injector:null,isConnected:!1,status:"error",error:(b=a)instanceof Error?/reject|denied|cancel/i.test(b.message)?"Wallet permission was rejected.":b.message:"Failed to select wallet account."})}}async function p(a){let b=await n();if(!b.length)return;let c=a??null,d=b.find(a=>a.address===c)??b[0];await o(d)}function q(){i({selectedAccount:null,injector:null,isConnected:!1,status:"idle",error:null})}function r(){return(0,d.useSyncExternalStore)(j,k,l)}},70252:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,95547,23)),Promise.resolve().then(c.t.bind(c,15098,23)),Promise.resolve().then(c.t.bind(c,47644,23)),Promise.resolve().then(c.t.bind(c,33859,23)),Promise.resolve().then(c.t.bind(c,98099,23)),Promise.resolve().then(c.t.bind(c,16237,23)),Promise.resolve().then(c.t.bind(c,98562,23)),Promise.resolve().then(c.t.bind(c,36675,23))},78335:()=>{},81282:(a,b,c)=>{Promise.resolve().then(c.bind(c,46212))},82704:()=>{},90612:(a,b,c)=>{"use strict";c.d(b,{k5:()=>x,xU:()=>F,$Z:()=>y,wj:()=>w,zz:()=>z,OA:()=>A,Wx:()=>B,Y4:()=>D,AJ:()=>E,lN:()=>C});var d=c(27267),e=c(51395),f=c(28423);let g=`type Group = struct {
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
`;var h=c(66409);let i=null;function j(a){return"bigint"==typeof a?a:"number"==typeof a||"string"==typeof a?BigInt(a):a&&"object"==typeof a&&"toString"in a?BigInt(String(a)):BigInt(0)}function k(a){return"string"==typeof a?a:a&&"object"==typeof a?JSON.stringify(a):String(a)}function l(a){if(!a||"object"!=typeof a)return a;if("Ok"in a)return a.Ok;if("ok"in a)return a.ok;if("Err"in a)throw Error(k(a.Err));if("err"in a)throw Error(k(a.err));return a}function m(a){return Array.isArray(a)?a.map(a=>({from:(0,e.y0)(a.from),to:(0,e.y0)(a.to),amount:j(a.amount)})):[]}function n(a){var b,c;return{id:j(a.id),name:String(a.name??""),members:Array.isArray(a.members)?a.members.map(e.y0):[],balances:Array.isArray(b=a.balances)?b.map(a=>({member:(0,e.y0)(a.member),balance:j(a.balance)})):[],expenses:Array.isArray(c=a.expenses)?c.map(a=>({payer:(0,e.y0)(a.payer),amount:j(a.amount),sharePerMember:j(a.share_per_member??a.sharePerMember),remainder:j(a.remainder),description:String(a.description??""),createdAt:Number(a.created_at??a.createdAt??0)})):[],escrow:function(a){let b={};if(!a)return b;if(a instanceof Map){for(let[c,d]of a.entries())b[(0,e.y0)(c)]=j(d);return b}if(Array.isArray(a)){for(let c of a)Array.isArray(c)&&2===c.length&&(b[(0,e.y0)(c[0])]=j(c[1]));return b}if("object"==typeof a)for(let[c,d]of Object.entries(a))b[(0,e.y0)(c)]=j(d);return b}(a.escrow),settlementPlan:m(a.settlement_plan??a.settlementPlan),settled:!!a.settled}}function o(a){var b;return{tokenId:j(a.token_id??a.tokenId),groupId:j(a.group_id??a.groupId),transfers:m(a.transfers),totalSettled:j(a.total_settled??a.totalSettled),settledAt:Number(a.settled_at??a.settledAt??0),finalizeBlock:Number(a.finalize_block??a.finalizeBlock??0),finalizeExtrinsicIndex:Number(a.finalize_extrinsic_index??a.finalizeExtrinsicIndex??0),payouts:Array.isArray(b=a.payouts)?b.map(a=>({creditor:(0,e.y0)(a.creditor),amount:j(a.amount),claimed:!!a.claimed})):[]}}function p(){let a=(0,h.$q)();if(!a.selectedAccount||!a.injector?.signer)throw Error("Connect a wallet before sending a transaction.");return a}async function q(a){return l(await r(a))}async function r(a){return(await s(a)).response}async function s(a){let b=p();a.withAccount(b.selectedAccount.address,{signer:b.injector.signer}),await a.calculateGas();try{let b=await a.signAndSend(),c=await b.response();return{blockHash:b.blockHash,txHash:b.txHash,response:c}}catch(a){if(a instanceof Error&&/cancel|reject/i.test(a.message))throw Error("Transaction was rejected by the user.");throw Error(a instanceof Error?a.message:"Transaction failed on chain.")}}async function t(a,b){let c=await (0,f.KU)(),[d,e]=await Promise.all([c.rpc.chain.getHeader(a),c.rpc.chain.getBlock(a)]),g=e.block.extrinsics.findIndex(a=>a.hash.toHex()===b);if(g<0)throw Error("Unable to locate finalized extrinsic index for explorer link.");return{block:d.number.toNumber(),index:g}}async function u(){return i||(i=(async()=>{try{let a=await (0,f.KU)(),{Sails:b}=await Promise.all([c.e(104),c.e(537)]).then(c.bind(c,54648)),{SailsIdlParser:e}=await c.e(143).then(c.bind(c,77143)),h=await e.new(),i=new b(h);return i.parseIdl(g),i.setApi(a).setProgramId(d.PF),i}catch(a){throw i=null,Error(`Failed to initialize VaraSplitEscrow: ${a instanceof Error?a.message:String(a)}`)}})()),i}async function v(a,b){let c=(0,h.$q)();return c.selectedAccount?.address&&a.withAddress(c.selectedAccount.address),b(l(await a.call()))}async function w(a,b){let c=(await u()).services.VaraSplitEscrow.functions.CreateGroup(a,b.map(e.a1)),d=await r(c);if(d&&"object"==typeof d&&"Ok"in d){let a=Number(n(d.Ok).id);return console.log("Created group:",a),a}if(d&&"object"==typeof d&&"Err"in d)throw Error(JSON.stringify(d.Err));if(d&&"object"==typeof d&&"ok"in d){let a=Number(n(d.ok).id);return console.log("Created group:",a),a}if(d&&"object"==typeof d&&"err"in d)throw Error(JSON.stringify(d.err));let f=Number(n(d).id);return console.log("Created group:",f),f}async function x(a,b,c,d){let f=(await u()).services.VaraSplitEscrow.functions.AddExpense(a,(0,e.a1)(b),c,d);return n(await q(f))}async function y(a){let b=(await u()).services.VaraSplitEscrow.functions.ComputeSettlement(a);return n(await q(b))}async function z(a,b){if(b<=BigInt(0))throw Error("Deposit value must be greater than zero.");let c=await u(),d=p(),e=c.services.VaraSplitEscrow.functions.Deposit(a);e.withAccount(d.selectedAccount.address,{signer:d.injector.signer}),e.withValue(b),await e.calculateGas();try{let a=await e.signAndSend();console.log("Deposit success");let b=await a.response();return n(l(b))}catch(a){if(a instanceof Error&&/cancel|reject/i.test(a.message))throw Error("Transaction was rejected by the user.");throw Error(a instanceof Error?a.message:"Deposit failed on chain.")}}async function A(a,b=0,c=0){let d=await u(),e=d.services.VaraSplitEscrow.functions.FinalizeSettlement(a,b,c),f=await s(e),g=o(l(f.response)),h=await t(f.blockHash,f.txHash),i=d.services.VaraSplitEscrow.functions.RecordFinalizeReference(g.tokenId,h.block,h.index);return o(await q(i))}async function B(a){let b=(await u()).services.VaraSplitEscrow.queries.GetGroup(a),c=(0,h.$q)();c.selectedAccount?.address&&b.withAddress(c.selectedAccount.address);let d=await b.call();if(console.log("Group fetch result:",d),d&&"object"==typeof d&&"Ok"in d)return n(d.Ok);if(d&&"object"==typeof d&&"Err"in d)throw Error(JSON.stringify(d.Err));return n(l(d))}async function C(a){return v((await u()).services.VaraSplitEscrow.queries.GetSettlementPlan(a),m)}async function D(a){return v((await u()).services.VaraSplitEscrow.queries.GetInvoice(a),o)}async function E(a){return v((await u()).services.VaraSplitEscrow.queries.GetInvoiceByToken(a),o)}async function F(a){let b=(await u()).services.VaraSplitEscrow.functions.ClaimPayout(a);return o(await q(b))}},96487:()=>{}};