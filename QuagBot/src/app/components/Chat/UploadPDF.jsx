"use client"

import { CloudUpload, FileText, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { uploadPDF } from "../../../lib/api/documents"
import { DocumentDetails, DocumentStatus } from "../Documents/DocumentList"

// Pill buttons match the "Chat Settings" dialog (see ChatSettings.jsx).
const PILL = 'cursor-pointer rounded-full border border-black px-space-4 py-space-2 w-full hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
const PILL_SECONDARY = `${PILL} bg-surface text-black`
const PILL_PRIMARY = `${PILL} bg-accent text-accent-contrast`

function isPDF(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadPDFDialog({ setUserPDFOpen, userPDFOpen, onUploaded }) {
    const inputRef = useRef(null)
    const urlRef = useRef(null)
    const uploadRef = useRef(null)
    // The File and its preview URL are stored together so they can't drift apart.
    const [selection, setSelection] = useState(null)
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)

    function revokePreview() {
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current)
            urlRef.current = null
        }
    }

    useEffect(() => () => {
        revokePreview()
        uploadRef.current?.abort()
    }, [])

    function clearSelection() {
        revokePreview()
        setSelection(null)
        setError('')
        setResult(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    function close() {
        if (uploadRef.current) return
        clearSelection()
        setUserPDFOpen(false)
    }

    // Close on Escape while the dialog is open.
    useEffect(() => {
        if (!userPDFOpen) return
        function onKeyDown(event) {
            if (event.key !== 'Escape' || uploadRef.current) return
            revokePreview()
            setSelection(null)
            setError('')
            setResult(null)
            setUserPDFOpen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [userPDFOpen, setUserPDFOpen])

    function handleFileChange(event) {
        const file = event.target.files?.[0]
        // Clearing the input lets the same file be picked again after removing it.
        event.target.value = ''
        if (!file) return
        if (!isPDF(file)) {
            clearSelection()
            setError('Please choose a PDF file.')
            return
        }
        revokePreview()
        urlRef.current = URL.createObjectURL(file)
        setSelection({ file, url: urlRef.current })
        setError('')
        setResult(null)
    }

    async function handleSubmit() {
        if (!selection || uploadRef.current || result) return
        const controller = new AbortController()
        uploadRef.current = controller
        setUploading(true)
        setError('')
        try {
            const document = await uploadPDF(selection.file, { signal: controller.signal })
            if (!controller.signal.aborted) {
                setResult(document)
                onUploaded?.(document)
            }
        } catch (error) {
            if (!controller.signal.aborted) setError(error.message)
        } finally {
            if (!controller.signal.aborted) {
                uploadRef.current = null
                setUploading(false)
            }
        }
    }

    if (!userPDFOpen) return null

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/30"
            onClick={(event) => { if (event.target === event.currentTarget) close() }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-pdf-title"
                className="max-h-[90vh] w-[680px] max-w-[92%] overflow-y-auto rounded-[12px] bg-surface p-space-5 text-left text-black"
            >
                <h2 id="upload-pdf-title" className="mb-space-2 pb-2 text-[24px] leading-[118%] font-medium tracking-[-0.24px] text-black max-[1024px]:text-[20px]">Upload PDF</h2>

                <div className="flex flex-col gap-space-4 md:flex-row">
                    {/* Controls */}
                    <div className="flex min-w-0 flex-1 flex-col gap-space-3">
                        {/* <p>Choose a PDF to share with QuagBot.</p> */}

                        <input
                            ref={inputRef}
                            name="userPDF"
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            disabled={uploading}
                            onChange={handleFileChange}
                        />

                        {selection ? (
                            <>
                                <p className="[overflow-wrap:anywhere]">
                                    <span className="block font-medium">{selection.file.name}</span>
                                    <span className="text-text-muted">{formatSize(selection.file.size)}</span>
                                </p>
                                <button type="button" className={`${PILL_SECONDARY} flex items-center justify-center gap-space-2`} disabled={uploading} onClick={() => inputRef.current?.click()}>
                                    <RefreshCw size={16} aria-hidden="true" /> Change PDF
                                </button>
                                <button type="button" className={`${PILL_SECONDARY} flex items-center justify-center gap-space-2`} disabled={uploading} onClick={clearSelection}>
                                    <Trash2 size={16} aria-hidden="true" /> Remove PDF
                                </button>
                            </>
                        ) : (
                            <button type="button" className={`${PILL_SECONDARY} flex items-center justify-center gap-space-2`} disabled={uploading} onClick={() => inputRef.current?.click()}>
                                <CloudUpload size={16} aria-hidden="true" /> Choose PDF
                            </button>
                        )}

                        {error && <p role="alert" className="text-error">{error}</p>}
                    </div>

                    {/* Preview box */}
                    <div className="flex h-[320px] w-full shrink-0 items-center justify-center overflow-hidden rounded-card border border-border bg-main-chat-bg md:w-[280px]">
                        {selection ? (
                            <object data={selection.url} type="application/pdf" aria-label={`Preview of ${selection.file.name}`} className="h-full w-full">
                                <div className="flex h-full flex-col items-center justify-center gap-space-2 p-space-3 text-center">
                                    <FileText size={40} aria-hidden="true" />
                                    <p className="[overflow-wrap:anywhere]">{selection.file.name}</p>
                                    <p className="text-text-muted">Preview isn&apos;t available in this browser.</p>
                                </div>
                            </object>
                        ) : (
                            <button type="button" className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-space-2 p-space-3 text-center text-text-muted hover:text-text" disabled={uploading} onClick={() => inputRef.current?.click()}>
                                <FileText size={40} aria-hidden="true" />
                                <span>No PDF selected</span>
                            </button>
                        )}
                    </div>
                </div>

                {uploading && <p role="status" className="mt-space-3">Uploading and checking processing status…</p>}
                {result && (
                    <div className="mt-space-3 rounded-card border border-border p-space-3">
                        <p role="status" className="font-medium">PDF uploaded.</p>
                        <div className="mt-space-2"><DocumentStatus document={result} /></div>
                        <DocumentDetails document={result} />
                        {!onUploaded && <Link href="/documents" className="mt-space-2 inline-block underline">View Documents</Link>}
                    </div>
                )}
                <div className="mt-space-5 flex flex-col gap-space-2">
                    {!result && (
                        <button type="button" className={PILL_PRIMARY} disabled={!selection || uploading} onClick={handleSubmit}>
                            {uploading ? 'Uploading…' : 'Submit'}
                        </button>
                    )}
                    <button type="button" className={PILL_SECONDARY} disabled={uploading} onClick={close}>
                        {result ? 'Done' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    )
}
