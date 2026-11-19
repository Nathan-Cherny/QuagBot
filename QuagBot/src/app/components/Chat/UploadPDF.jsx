"use client"

import { CloudUpload } from "lucide-react"
import { useState } from "react"

export default function UploadPDFButton({ setUserPDFOpen }) {
    return (
        <button onClick={() => setUserPDFOpen(true)} className="bg-linear-to-r border from-teal-500/50 to-blue-500/50 p-1 rounded-4xl m-auto h-full cursor-pointer hover:scale-105" title="Upload PDF To QuagBot">
            <CloudUpload size={22} />
        </button>
    )
}

export function UploadPDFDialog({ setUserPDFOpen, userPDFOpen }) {
    return (userPDFOpen &&
        <div aria-labelledby="share-chat-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[min(32rem,92vw)] overflow-y-auto rounded-card border border-border bg-surface p-space-5 text-text backdrop:bg-black/40">
            <input name="userPDF" type="file" accept=".pdf" />
            <button onClick={() => {setUserPDFOpen()}}>Close</button>
        </div>
    )
}