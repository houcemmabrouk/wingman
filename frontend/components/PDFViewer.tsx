'use client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PDFViewerProps {
  assetId: number
  title: string
  onClose: () => void
}

export default function PDFViewer({ assetId, title, onClose }: PDFViewerProps) {
  const url = `${API_URL}/api/content/asset/${assetId}`

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="card-header mb-0">{title}</h2>
        <div className="flex gap-2">
          <a href={url} download className="btn-ghost text-xs">Download</a>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">Close</button>
        </div>
      </div>

      <div className="bg-surface-700 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={title}
        />
      </div>
    </div>
  )
}
