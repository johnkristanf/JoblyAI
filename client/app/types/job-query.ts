export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'platform-picker';
    content: string;
    pendingQuery?: string;
}
