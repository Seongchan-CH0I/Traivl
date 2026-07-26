"use client";

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
    stream: MediaStream | null;
}

export default function AudioWaveform({ stream }: AudioWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (!stream) {
            cleanup();
            return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256; 

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let phase = 0; 

        const draw = () => {
            if (!analyserRef.current || !canvasRef.current) return;

            animationRef.current = requestAnimationFrame(draw);

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
            }

            const width = rect.width;
            const height = rect.height;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const averageVolume = sum / bufferLength; 
            const normalizedVolume = averageVolume / 255; 

            ctx.clearRect(0, 0, width, height);

            const waves = [
                { amplitude: 35, speed: 0.08, color: 'rgba(140, 82, 255, 0.6)', lineWidth: 3 }, 
                { amplitude: 22, speed: 0.12, color: 'rgba(239, 68, 68, 0.45)', lineWidth: 2 },  
                { amplitude: 15, speed: 0.05, color: 'rgba(59, 130, 246, 0.35)', lineWidth: 1.5 } 
            ];

            phase += 0.05; 

            waves.forEach((wave) => {
                ctx.beginPath();
                ctx.lineWidth = wave.lineWidth;
                ctx.strokeStyle = wave.color;
                ctx.lineCap = 'round';

                const currentAmp = 2 + normalizedVolume * wave.amplitude;

                for (let x = 0; x < width; x++) {
                    const centerY = height / 2;
                    const envelope = Math.sin((x / width) * Math.PI);
                    const y = centerY + Math.sin(x * 0.03 + phase * wave.speed) * currentAmp * envelope;

                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            });
        };

        draw();

        return () => {
            cleanup();
        };
    }, [stream]);

    const cleanup = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(err => console.error("Error closing audio context", err));
            }
            audioContextRef.current = null;
        }
        analyserRef.current = null;
    };

    return (
        <div className="audio-waveform-container" style={{ width: '100%', height: '80px', margin: '20px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
}
