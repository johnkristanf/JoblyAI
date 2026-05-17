import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useMutation } from '@tanstack/react-query'
import { jobQuery } from '~/lib/api/post'
import type { Message } from '~/types/job-query'

export default function JobQueryPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your JoblyAI assistant. How can I help you with your job search queries today?'
        }
    ])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const mutation = useMutation({
        mutationFn: jobQuery,
        onSuccess: (data) => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response
            }
            setMessages((prev) => [...prev, assistantMessage])
        },
        onError: () => {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'I apologize, but I encountered an error while processing your request. Please try again.'
            }
            setMessages((prev) => [...prev, errorMessage])
        }
    })

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px'
        }
    }, [input])

    const handleSend = () => {
        if (!input.trim() || mutation.isPending) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim()
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')

        mutation.mutate(userMessage.content)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="w-full h-screen max-h-screen flex flex-col p-6 md:p-10 bg-gray-50/50">
            {/* Header */}
            <div className="mb-6 shrink-0">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                    Job Search Query
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base max-w-3xl">
                    Ask our AI assistant about job market trends, specific roles, or to find jobs matching your exact requirements.
                </p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                    <Bot className="size-5 text-blue-600" />
                                </div>
                            )}
                            <div
                                className={`px-5 py-3.5 rounded-2xl max-w-[85%] md:max-w-[75%] ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                }`}
                            >
                                <div className="text-sm md:text-base leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    ) : (
                                        <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                            {msg.role === 'user' && (
                                <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                                    <User className="size-5 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {mutation.isPending && (
                        <div className="flex gap-4 justify-start">
                            <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="size-5 text-blue-600" />
                            </div>
                            <div className="px-5 py-4 rounded-2xl bg-gray-100 rounded-bl-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative flex items-end gap-2 bg-white border border-gray-300 rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message JoblyAI..."
                                className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 text-sm md:text-base text-gray-900 placeholder:text-gray-500"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || mutation.isPending}
                                className={`p-2.5 rounded-xl mb-1 transition-colors shrink-0 ${
                                    input.trim() && !mutation.isPending
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Send className="size-4" />
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-3">
                            JoblyAI can make mistakes. Check important info.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
