import React, { useState, useEffect } from 'react';
import { 
  Globe, ShieldCheck, Zap, MapPin, Power, 
  Copy, Check, Settings, Share2, RefreshCw
} from 'lucide-react';

// --- 工具函数 ---
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- 主组件 ---
export default function App() {
  const [host, setHost] = useState('');
  const [uuid, setUuid] = useState('d342d11e-d424-4583-b36e-524ab1f0afa4'); // 默认 UUID
  const [isConnected, setIsConnected] = useState(false); // 仅做演示用
  const [copied, setCopied] = useState(false);
  const [region, setRegion] = useState('Auto (Anycast)');

  // 初始化时获取当前域名
  useEffect(() => {
    setHost(window.location.hostname);
    const params = new URLSearchParams(window.location.search);
    if (params.get('uuid')) setUuid(params.get('uuid'));
  }, []);

  // 生成 VLESS 链接
  const getVlessLink = () => {
    // 如果是本地开发环境，用 placeholder
    const currentHost = host || 'your-domain.pages.dev';
    return `vless://${uuid}@${currentHost}:443?encryption=none&security=tls&type=ws&host=${currentHost}&path=%2F#Cloudflare-Proxy`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getVlessLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#f97316_0%,transparent_25%)] opacity-10 blur-3xl animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* 头部 */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Zap className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">CF-Proxy Node</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Running on Cloudflare Edge
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Current Node</div>
            <div className="font-mono text-orange-400">{host || 'Localhost / Dev'}</div>
          </div>
        </header>

        {/* 核心卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 左侧：状态与控制 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10 mb-6">
              <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center shadow-2xl">
                <Globe className={`w-12 h-12 ${isConnected ? 'text-orange-500' : 'text-zinc-600'}`} />
              </div>
              {/* 装饰光环 */}
              <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Global Edge Network</h2>
            <p className="text-sm text-slate-400 mb-8 max-w-xs">
              流量将自动路由至距离您最近的 Cloudflare 数据中心 (Anycast)。
            </p>

            <div className="w-full bg-zinc-950 rounded-lg p-4 border border-zinc-800/50 text-left space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Region</span>
                 <span className="text-slate-200 flex items-center gap-1"><MapPin className="w-3 h-3"/> {region}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Protocol</span>
                 <span className="text-orange-400 font-mono">VLESS + WS + TLS</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Port</span>
                 <span className="text-slate-200 font-mono">443</span>
               </div>
            </div>
          </div>

          {/* 右侧：连接配置 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-white">客户端配置</h3>
            </div>

            <div className="space-y-6 flex-1">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">User ID (UUID)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={uuid}
                    onChange={(e) => setUuid(e.target.value)}
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                  <button 
                    onClick={() => setUuid(generateUUID())}
                    className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-slate-400"
                    title="Generate New UUID"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">
                  重要：此 UUID 必须与 public/_worker.js 中的配置一致。
                </p>
              </div>

              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <div className="text-xs text-orange-400 mb-2 font-bold flex items-center gap-1">
                  <Share2 className="w-3 h-3" /> 快速连接
                </div>
                <div className="text-[10px] text-slate-400 mb-3 break-all font-mono leading-relaxed opacity-70">
                  {getVlessLink().substring(0, 50)}...
                </div>
                <button 
                  onClick={handleCopy}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制链接' : '复制 VLESS 链接'}
                </button>
              </div>
              
              <div className="text-center">
                 <span className="text-[10px] text-zinc-600">
                    支持客户端: v2rayN, Shadowrocket, Clash, V2Box
                 </span>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center border-t border-zinc-800 pt-8">
          <p className="text-xs text-zinc-600">
            Deploy on Cloudflare Pages. Educational purpose only.
          </p>
        </footer>
      </div>
    </div>
  );
}