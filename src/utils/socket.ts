interface SocketOptions {
    url: string;
    heartbeatInterval?: number; // 心跳间隔时间(ms)
    reconnectInterval?: number; // 重连间隔时间(ms)
    reconnectAttempts?: number; // 最大重连次数
    protocols?: string | string[];
}

interface MessageHandler {
    (data: any): void;
}

export class SocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private protocols?: string | string[];
    private heartbeatInterval: number;
    private reconnectInterval: number;
    private reconnectAttempts: number;
    private currentReconnectAttempts: number = 0;
    private heartbeatTimer: number | null = null;
    private reconnectTimer: number | null = null;
    private isManualClose: boolean = false;
    private messageHandlers: Set<MessageHandler> = new Set();
    private openHandlers: Set<() => void> = new Set();
    private closeHandlers: Set<() => void> = new Set();
    private errorHandlers: Set<(error: Event) => void> = new Set();

    constructor(options: SocketOptions) {
        this.url = options.url;
        this.protocols = options.protocols;
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.reconnectAttempts = options.reconnectAttempts || 5;
    }

    // 连接WebSocket
    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.warn('WebSocket已连接');
            return;
        }

        try {
            this.ws = new WebSocket(this.url, this.protocols);
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
            this.ws.onerror = this.handleError.bind(this);
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            this.reconnect();
        }
    }

    // 发送消息
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        } else {
            console.warn('WebSocket未连接');
        }
    }

    // 关闭连接
    close(): void {
        this.isManualClose = true;
        this.stopHeartbeat();
        this.stopReconnect();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // 监听消息
    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    // 监听连接打开
    onOpen(handler: () => void): () => void {
        this.openHandlers.add(handler);
        return () => this.openHandlers.delete(handler);
    }

    // 监听连接关闭
    onClose(handler: () => void): () => void {
        this.closeHandlers.add(handler);
        return () => this.closeHandlers.delete(handler);
    }

    // 监听错误
    onError(handler: (error: Event) => void): () => void {
        this.errorHandlers.add(handler);
        return () => this.errorHandlers.delete(handler);
    }

    // 获取连接状态
    getReadyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }

    // 处理连接打开
    private handleOpen(): void {
        console.log('WebSocket连接成功');
        this.currentReconnectAttempts = 0;
        this.startHeartbeat();
        this.openHandlers.forEach(handler => handler());
    }

    // 处理接收消息
    private handleMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
            this.messageHandlers.forEach(handler => handler(event.data));
        }
    }

    // 处理连接关闭
    private handleClose(): void {
        console.log('WebSocket连接关闭');
        this.stopHeartbeat();
        this.closeHandlers.forEach(handler => handler());

        if (!this.isManualClose) {
            this.reconnect();
        }
    }

    // 处理错误
    private handleError(error: Event): void {
        console.error('WebSocket错误:', error);
        this.errorHandlers.forEach(handler => handler(error));
    }

    // 启动心跳
    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatTimer = window.setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send(JSON.stringify({ type: 'ping' }));
            }
        }, this.heartbeatInterval);
    }

    // 停止心跳
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // 重连
    private reconnect(): void {
        if (this.currentReconnectAttempts >= this.reconnectAttempts) {
            console.error('WebSocket重连次数已达上限');
            return;
        }

        this.currentReconnectAttempts++;
        console.log(`WebSocket重连中...第${this.currentReconnectAttempts}次`);

        this.reconnectTimer = window.setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    // 停止重连
    private stopReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

export const socket = new SocketClient({
    url: import.meta.env.VITE_WS_URL,
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    reconnectAttempts: 5
});

// socket.connect();
// socket.onMessage((data) => console.log('收到消息:', data));
// socket.send(JSON.stringify({ type: 'message', content: 'Hello' }));