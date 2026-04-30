import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Video } from 'lucide-react';
import type { JobMatch } from '~/types/job_search';

interface MockInterviewModalProps {
    job: JobMatch;
}

export function MockInterviewModal({ job }: MockInterviewModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Setup and cleanup when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            startMedia();
        } else {
            stopMedia();
        }

        return () => {
            stopMedia();
        };
    }, [isOpen]);

    const startMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Initialize WebSocket
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Use environment variable for API URL in a real app, hardcoding to localhost:8000 for this implementation
            const wsUrl = `ws://localhost:8000/api/v1/interview/ws`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsStreaming(true);

                // Initialize MediaRecorder
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8,opus'
                });
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                        ws.send(e.data);
                    }
                };

                // Send a chunk every 100ms
                mediaRecorder.start(100);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsStreaming(false);
            };

        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Failed to access camera and microphone. Please check your permissions.');
            setIsOpen(false);
        }
    };

    const stopMedia = () => {
        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        // Close WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }

        // Stop all media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        setIsStreaming(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 hover:cursor-pointer border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Video className="w-4 h-4" />
                    AI Mock Behavioral Interview
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Mock Interview: {job.job_title}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* User Local Video */}
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-slate-700">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">
                            You
                        </div>
                        {isStreaming && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded text-xs">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Live
                            </div>
                        )}
                    </div>

                    {/* AI Placeholder Video */}
                    <div className="relative rounded-lg overflow-hidden bg-slate-800 aspect-video flex flex-col items-center justify-center border border-slate-700">
                        <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mb-2 shadow-inner">
                            <span className="text-3xl font-bold text-slate-400">AI</span>
                        </div>
                        <p className="text-slate-400 font-medium">Interviewer</p>
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">
                            AI Interviewer
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="destructive" onClick={() => setIsOpen(false)}>
                        End Interview
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
