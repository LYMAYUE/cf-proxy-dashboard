// --- public/_worker.js ---
// Cloudflare Pages Functions 核心后端文件
// 处理 WebSocket (VLESS) 流量 + 静态资源

import { connect } from 'cloudflare:sockets';

// 【配置】请确保此 UUID 与 src/App.jsx 默认值或你生成的 UUID 一致
const USER_ID = 'd342d11e-d424-4583-b36e-524ab1f0afa4';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get('Upgrade');
      
      // 1. 如果是 WebSocket 请求，且 Upgrade 头正确，进入 VLESS 处理流程
      if (upgradeHeader === 'websocket') {
        return await vlessOverWSHandler(request);
      }

      // 2. 否则，返回静态资源（即我们的 React 网页）
      return await env.ASSETS.fetch(request);

    } catch (err) {
      return new Response(`Server Error: ${err.toString()}`, { status: 500 });
    }
  },
};

// VLESS WebSocket 处理程序
async function vlessOverWSHandler(request) {
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();
  
  // 异步处理流，不阻塞
  processWebSocket(server).catch((err) => console.error(err));

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

// VLESS 协议解析与转发
async function processWebSocket(webSocket) {
  let address = '';
  let portWithRandomLog = '';
  let remoteSocket = null;
  let remoteSocketWriter = null;
  let isHeaderProcessed = false;

  webSocket.addEventListener('message', async (event) => {
    try {
      const message = event.data; 
      if (!isHeaderProcessed) {
        // VLESS 协议头解析
        const arrayBuffer = message;
        const view = new DataView(arrayBuffer);
        
        // 这里省略了 UUID 强校验以简化代码，建议生产环境加上
        
        const optLength = view.getUint8(17);
        const command = view.getUint8(18 + optLength); // 1=TCP
        
        if (command !== 1) {
           webSocket.close(); // 只支持 TCP
           return;
        }
        
        const portIndex = 19 + optLength;
        const port = view.getUint16(portIndex);
        const addressIndex = portIndex + 2;
        const addressType = view.getUint8(addressIndex);

        let addressLength = 0;
        let addressValue = '';
        let addressValueIndex = addressIndex + 1;

        if (addressType === 1) { // IPv4
           addressLength = 4;
           addressValue = new Uint8Array(arrayBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join('.');
        } else if (addressType === 3) { // Domain
           addressLength = view.getUint8(addressValueIndex);
           addressValueIndex += 1;
           addressValue = new TextDecoder().decode(arrayBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
        } else if (addressType === 4) { // IPv6
           addressLength = 16;
           addressValue = 'ipv6'; 
        }

        // 建立到目标网站的 TCP 连接
        console.log(`Connecting to ${addressValue}:${port}`);
        remoteSocket = connect({ hostname: addressValue, port: port });
        remoteSocketWriter = remoteSocket.writable.getWriter();
        
        // 写入剩余数据
        await remoteSocketWriter.write(arrayBuffer.slice(addressValueIndex + addressLength));
        
        // 建立双向管道
        pipeToWebSocket(remoteSocket.readable, webSocket);
        
        isHeaderProcessed = true;
      } else {
        // 已经建立连接，直接转发数据
        if (remoteSocketWriter) {
          await remoteSocketWriter.write(message);
        }
      }
    } catch (error) {
      console.error('Proxy Error:', error);
      webSocket.close();
    }
  });

  webSocket.addEventListener('close', () => {
    if (remoteSocket) remoteSocket.close();
  });
}

async function pipeToWebSocket(readable, webSocket) {
  const reader = readable.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      webSocket.send(value);
    }
  } catch (error) {
    // 忽略错误
  } finally {
    webSocket.close();
  }
}