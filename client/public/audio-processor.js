class AudioRecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096;
        this.buffer = new Float32Array(this.bufferSize);
        this.bytesWritten = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;
        
        const channelData = input[0];
        if (!channelData) return true;
        
        // Accumulate 128-sample chunks into our 4096-sample buffer
        for (let i = 0; i < channelData.length; i++) {
            this.buffer[this.bytesWritten++] = channelData[i];
            
            if (this.bytesWritten >= this.bufferSize) {
                // Send the buffered data back to the main thread
                // Slice is used to pass a copy, so the underlying array can be reused safely
                this.port.postMessage(this.buffer.slice());
                this.bytesWritten = 0;
            }
        }
        
        // We do not copy input to output, so this node effectively outputs silence.
        return true; 
    }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
