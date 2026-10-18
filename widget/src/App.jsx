import { useState, useRef, useEffect } from 'react'
import {
  X, Send, Settings, ChevronLeft, Trash2, User, Sliders,
  Palette, LogOut, CheckCircle, Plus, BookOpen,
  FileText, Loader2, UploadCloud, Folder, FolderPlus
} from 'lucide-react'
import Draggable from 'react-draggable'

const SUPPORTED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'csv',
  'json', 'xml', 'html', 'htm', 'rtf', 'png', 'jpg', 'jpeg', 'gif', 'webp',
  'bmp', 'tiff', 'tif', 'py', 'js', 'ts', 'java', 'cpp', 'c', 'cs', 'go',
  'rs', 'rb', 'php', 'yaml', 'yml', 'toml', 'ini', 'cfg'
])

const RobotLogo = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="3" />
    <path d="M 22 22 L 38 38 M 78 22 L 62 38 M 22 78 L 38 62 M 78 78 L 62 62" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
    <rect x="30" y="33" width="40" height="34" rx="14" fill="currentColor" />
    <circle cx="27" cy="50" r="7" fill="currentColor" />
    <circle cx="73" cy="50" r="7" fill="currentColor" />
    <rect x="35" y="38" width="30" height="24" rx="10" fill="#0f172a" />
    <circle cx="44" cy="48" r="3" fill="#22d3ee" style={{ filter: 'drop-shadow(0px 0px 3px #22d3ee)' }} />
    <circle cx="56" cy="48" r="3" fill="#22d3ee" style={{ filter: 'drop-shadow(0px 0px 3px #22d3ee)' }} />
    <path d="M 45 56 Q 50 60 55 56" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" fill="none" style={{ filter: 'drop-shadow(0px 0px 2px #22d3ee)' }} />
  </svg>
)

/* ─── Inline styles object ─── */
const S = {
  root: { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },

  /* Launcher */
  launcher: (hdrBg) => ({
    width: 64, height: 64, borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.25)', padding: 0,
    background: hdrBg, cursor: 'pointer',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(79,110,247,0.45), 0 2px 8px rgba(0,0,0,0.18)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    animation: 'cwGlow 3s ease-in-out infinite',
  }),

  /* Chat window */
  window: {
    width: 420, height: 640,
    display: 'flex', flexDirection: 'column',
    borderRadius: 28, overflow: 'hidden',
    background: 'rgba(15, 17, 23, 0.50)',
    backdropFilter: 'blur(24px) saturate(190%)',
    WebkitBackdropFilter: 'blur(24px) saturate(190%)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.18)',
    animation: 'cwFadeUp 0.32s cubic-bezier(.4,0,.2,1) both',
  },

  /* Header */
  header: (hdrBg) => ({
    padding: '18px 20px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: hdrBg, cursor: 'move', userSelect: 'none', flexShrink: 0,
    position: 'relative',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  }),
  avatar: {
    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
  },
  headerName: { fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0, lineHeight: 1.2 },
  headerSub: { fontSize: 11.5, color: 'rgba(148,163,184,0.9)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5 },
  onlineDot: {
    width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0,
    boxShadow: '0 0 0 0 rgba(74,222,128,0.7)',
    animation: 'cwPulse 1.5s infinite',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 11, border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background 0.15s, transform 0.15s',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 11, border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background 0.15s, transform 0.15s',
  },

  /* Messages */
  messages: {
    flex: 1, overflowY: 'auto', padding: '18px 16px 10px',
    display: 'flex', flexDirection: 'column', gap: 14,
    background: 'transparent',
  },
  bubbleRowUser: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '82%', alignSelf: 'flex-end', gap: 6 },
  bubbleRowBot:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '82%', alignSelf: 'flex-start', gap: 6 },
  bubbleUser: (userBg) => ({
    padding: '12px 16px', borderRadius: 18, borderBottomRightRadius: 5,
    fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word',
    background: userBg, color: '#fff',
    border: '1px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    animation: 'cwFadeUp 0.22s ease both',
  }),
  bubbleBot: {
    padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 5,
    fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word',
    background: 'rgba(255,255,255,0.07)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.10)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
    animation: 'cwFadeUp 0.22s ease both',
  },
  chip: {
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#cbd5e1', cursor: 'pointer', backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 },

  /* Typing */
  typing: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 18, borderBottomLeftRadius: 5,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    width: 'fit-content',
  },
  typingDot: (delay) => ({
    width: 7, height: 7, borderRadius: '50%', background: '#64748b',
    animation: `cwTyping 1.2s ${delay}s infinite ease-in-out`,
  }),

  /* Knowledge Base Strip */
  kbStrip: {
    padding: '8px 16px',
    background: 'rgba(15, 23, 42, 0.50)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    flexShrink: 0,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  kbHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 11, color: '#94a3b8', fontWeight: 600,
  },
  kbLabel: { display: 'flex', alignItems: 'center', gap: 5 },
  kbUploading: { display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8', fontSize: 10.5 },
  kbFileList: {
    display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
  },
  kbBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 8px 3px 9px', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#cbd5e1', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  kbFileName: { maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  kbDeleteBtn: {
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: 3, transition: 'color 0.15s',
  },
  ragTag: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10.5, color: '#38bdf8', marginTop: 4,
    padding: '2px 8px', borderRadius: 8,
    background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
  },

  /* Input area */
  inputArea: {
    padding: '12px 16px 16px',
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(15, 17, 23, 0.50)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 13, flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  inputPill: {
    flex: 1, display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16, padding: '0 14px', height: 46,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'border-color 0.2s, background 0.2s',
  },
  input: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit',
  },
  sendBtn: (hdrBg, accent) => ({
    width: 46, height: 46, borderRadius: 14, border: 'none', flexShrink: 0,
    background: hdrBg, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'transform 0.15s, opacity 0.15s, box-shadow 0.15s',
    boxShadow: `0 4px 16px ${accent}66`,
  }),

  uploadMenu: {
    position: 'absolute', bottom: 58, left: 0,
    background: 'rgba(22, 25, 34, 0.75)', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 14, padding: '5px', minWidth: 165,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', gap: 3,
    zIndex: 60, animation: 'cwFadeUp 0.16s ease-out both',
  },
  uploadMenuItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '9px 12px', borderRadius: 9, border: 'none',
    background: 'transparent', color: '#e2e8f0',
    fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
    textAlign: 'left', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
  },
  dragOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '2px dashed #4f6ef7', borderRadius: 28,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 12, zIndex: 100, pointerEvents: 'none',
    color: '#fff', animation: 'cwFadeUp 0.15s ease-out both',
  },

  /* Settings */
  settingsWrap: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    background: 'rgba(15, 17, 23, 0.50)',
    backdropFilter: 'blur(24px) saturate(190%)',
    WebkitBackdropFilter: 'blur(24px) saturate(190%)',
  },
  settingsHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '18px 20px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 10,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  },
  settingsTitle: { fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  tabBar: {
    display: 'flex', gap: 4, margin: '16px 16px 0',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 4,
  },
  tabBtn: (active) => ({
    flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
    background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
    color: active ? '#e2e8f0' : '#64748b',
    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    cursor: 'pointer', transition: 'all 0.15s',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
  }),
  settingsBody: { flex: 1, overflowY: 'auto', padding: '18px 16px 20px' },
  fieldLabel: {
    fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
  },
  fieldInput: {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#e2e8f0', fontSize: 13.5, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s, background 0.2s', marginBottom: 16,
    boxSizing: 'border-box',
  },
  dangerBtn: {
    width: '100%', padding: '12px 16px',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 12, color: '#f87171', fontSize: 13.5, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', marginTop: 8, cursor: 'pointer', transition: 'background 0.15s',
  },
  primaryBtn: (hdrBg) => ({
    width: '100%', padding: '12px 16px',
    background: hdrBg, border: 'none',
    borderRadius: 12, color: '#fff', fontSize: 13.5, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', marginTop: 8, cursor: 'pointer', transition: 'opacity 0.15s',
  }),
  accountCard: {
    display: 'flex', alignItems: 'center', gap: 13,
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, marginBottom: 16,
  },
  accountAvatar: (hdrBg) => ({
    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    background: hdrBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 14,
  }),
  accountName: { fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 3px' },
  accountEmail: { fontSize: 12, color: '#64748b', margin: 0 },
  secondaryBtn: {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#94a3b8', fontSize: 13.5, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', cursor: 'pointer', transition: 'background 0.15s',
  },
  themeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 },
  themeSwatch: (bg, selected) => ({
    height: 54, borderRadius: 14,
    border: selected ? '2.5px solid rgba(255,255,255,0.75)' : '2px solid transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 12, fontWeight: 600,
    background: bg,
    transform: selected ? 'scale(1.04)' : 'scale(1)',
    boxShadow: selected ? '0 4px 18px rgba(0,0,0,0.3)' : 'none',
    cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
    overflow: 'hidden',
  }),
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [botName, setBotName] = useState('Shri')

  // RAG & File Upload States
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)

  const getDefaultApiUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
      try {
        const saved = localStorage.getItem('chatbot_api_url')
        if (saved) return saved
      } catch {}
      if (window.location.port === '8000') return window.location.origin
    }
    return 'http://localhost:8000'
  }
  const [apiUrl, setApiUrl] = useState(getDefaultApiUrl())

  const handleApiUrlChange = (newUrl) => {
    setApiUrl(newUrl)
    try {
      localStorage.setItem('chatbot_api_url', newUrl)
    } catch {}
  }

  const [activeTab, setActiveTab] = useState('chatbot')
  const [themeColor, setThemeColor] = useState('blue')

  const themeMap = {
    blue:    { hdrBg: 'linear-gradient(135deg, rgba(59,91,250,0.50) 0%, rgba(109,40,217,0.50) 100%)', userBg: 'linear-gradient(135deg, rgba(79,110,247,0.85) 0%, rgba(109,40,217,0.85) 100%)', accent: '#4f6ef7', label: 'Ocean' },
    purple:  { hdrBg: 'linear-gradient(135deg, rgba(124,58,237,0.50) 0%, rgba(192,38,211,0.50) 100%)', userBg: 'linear-gradient(135deg, rgba(147,51,234,0.85) 0%, rgba(219,39,119,0.85) 100%)', accent: '#9333ea', label: 'Galaxy' },
    emerald: { hdrBg: 'linear-gradient(135deg, rgba(5,150,105,0.50) 0%, rgba(13,148,136,0.50) 100%)', userBg: 'linear-gradient(135deg, rgba(5,150,105,0.85) 0%, rgba(13,148,136,0.85) 100%)', accent: '#10b981', label: 'Forest' },
    rose:    { hdrBg: 'linear-gradient(135deg, rgba(225,29,72,0.50) 0%, rgba(219,39,119,0.50) 100%)', userBg: 'linear-gradient(135deg, rgba(244,63,94,0.85) 0%, rgba(219,39,119,0.85) 100%)', accent: '#f43f5e', label: 'Sunset' },
  }
  const { hdrBg, userBg, accent } = themeMap[themeColor]

  const messagesEndRef = useRef(null)
  const nodeRef = useRef(null)
  const isDragging = useRef(false)

  // Fetch list of documents in RAG knowledge base
  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/upload/files`)
      if (response.ok) {
        const data = await response.json()
        setUploadedFiles(data.documents || [])
      }
    } catch {
      // Backend not reached or offline
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isUploading])

  useEffect(() => {
    if (isOpen) {
      fetchUploadedFiles()
    }
  }, [isOpen, apiUrl])

  // Close upload menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showUploadMenu && !e.target.closest('.cw-add-wrap')) {
        setShowUploadMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showUploadMenu])

  // Upload single file to backend API
  const uploadSingleFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${apiUrl}/api/v1/upload/`, {
        method: 'POST',
        body: formData,
      })
      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (res.ok && data?.status === 'success') {
        return { success: true, file, data }
      } else {
        const detail = data?.detail || data?.message || (res.statusText ? `HTTP ${res.status}: ${res.statusText}` : 'Processing failed')
        return { success: false, file, error: detail }
      }
    } catch (err) {
      return {
        success: false,
        file,
        error: `Server connection failed. Could not reach backend at ${apiUrl}. Please make sure the backend server is running.`
      }
    }
  }

  // Core file and folder upload processor
  const processFiles = async (files, isFolder = false, folderName = '') => {
    if (!files || !files.length) return

    // Filter out Office lock files (~$doc.docx), hidden system files (.DS_Store, desktop.ini), etc.
    const validFiles = files.filter(file => {
      const name = file.name || ''
      if (name.startsWith('~$') || name.startsWith('.') || name === 'Thumbs.db' || name === 'desktop.ini') {
        return false
      }
      const ext = name.split('.').pop()?.toLowerCase() || ''
      return SUPPORTED_EXTENSIONS.has(ext)
    })

    if (validFiles.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isFolder
            ? `⚠️ No supported documents (PDF, DOCX, XLSX, PPTX, TXT, CSV, images, code) were found in folder "${folderName || 'selected'}".`
            : `⚠️ Unsupported file format. Please upload PDF, Word (DOCX), Excel, PPT, TXT, CSV, images, or code files.`
        }
      ])
      return
    }

    setIsUploading(true)
    let successCount = 0
    let totalChunks = 0
    const errors = []

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      setUploadStatus(validFiles.length > 1
        ? `Indexing [${i + 1}/${validFiles.length}]: ${file.name}...`
        : `Indexing ${file.name}...`
      )

      const res = await uploadSingleFile(file)
      if (res.success) {
        successCount++
        totalChunks += (res.data?.chunks_count || 0)
      } else {
        errors.push({ name: file.name, error: res.error })
      }
    }

    setIsUploading(false)
    setUploadStatus('')
    await fetchUploadedFiles()

    if (validFiles.length === 1) {
      if (successCount === 1) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `📄 Added "${validFiles[0].name}" to Knowledge Base (${totalChunks} chunks indexed). You can now ask questions about this document!`,
            rag_applied: true,
          }
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Upload error for "${validFiles[0].name}": ${errors[0]?.error || 'Failed to index file.'}`
          }
        ])
      }
    } else {
      if (successCount > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `📁 ${isFolder ? `Folder "${folderName || 'Selected Folder'}"` : 'Batch upload'} processed: Successfully indexed ${successCount} of ${validFiles.length} documents (${totalChunks} chunks) into Knowledge Base!${
              errors.length > 0 ? `\n\n⚠️ ${errors.length} file(s) failed:\n` + errors.map(e => `• ${e.name}: ${e.error}`).join('\n') : ''
            }`,
            rag_applied: true,
          }
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Could not index files from ${isFolder ? `folder "${folderName}"` : 'batch'}:\n` + errors.map(e => `• ${e.name}: ${e.error}`).join('\n')
          }
        ])
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  // Handle file picker selection
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      setShowUploadMenu(false)
      await processFiles(files, false)
    }
  }

  // Handle folder picker selection
  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      setShowUploadMenu(false)
      const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Selected Folder'
      await processFiles(files, true, folderName)
    }
  }

  // Recursively scan dropped folders and subdirectories
  const scanEntry = async (entry) => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file) => resolve([file]), () => resolve([]))
      })
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader()
      const entries = await new Promise((resolve) => {
        const all = []
        const readBatch = () => {
          dirReader.readEntries((batch) => {
            if (!batch.length) {
              resolve(all)
            } else {
              all.push(...batch)
              readBatch()
            }
          }, () => resolve(all))
        }
        readBatch()
      })
      const nested = await Promise.all(entries.map(e => scanEntry(e)))
      return nested.flat()
    }
    return []
  }

  // Handle Drag & Drop of files or folders
  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDraggingFile(false)
    setShowUploadMenu(false)

    const items = e.dataTransfer.items
    if (!items || !items.length) return

    const files = []
    let detectedFolderName = ''

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          if (entry.isDirectory && !detectedFolderName) {
            detectedFolderName = entry.name
          }
          const scanned = await scanEntry(entry)
          files.push(...scanned)
        }
      } else if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length) {
      await processFiles(files, !!detectedFolderName, detectedFolderName)
    }
  }

  // Delete a document from the RAG knowledge base
  const handleDeleteFile = async (fileId, fileName) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/upload/${fileId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchUploadedFiles()
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `🗑️ Removed "${fileName}" from the knowledge base.`
          }
        ])
      }
    } catch {
      // ignore
    }
  }

  const sendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/v1/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          use_rag: true
        }),
      })
      const data = await response.json()
      if (response.ok && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            rag_applied: data.rag_applied,
            sources: data.sources,
          }
        ])
      } else {
        const errorDetail = data.detail || data.error || 'Server error occurred'
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorDetail}` }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection failed. Please ensure the backend server is running on http://localhost:8000.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const sendQuickReply = (text) => {
    setInput(text)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes cwGlow {
          0%,100% { box-shadow: 0 8px 32px rgba(79,110,247,0.4); }
          50%      { box-shadow: 0 8px 40px rgba(109,40,217,0.55); }
        }
        @keyframes cwFadeUp {
          from { opacity:0; transform:translateY(18px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes cwPulse {
          0%   { box-shadow:0 0 0 0 rgba(74,222,128,0.7); }
          70%  { box-shadow:0 0 0 7px rgba(74,222,128,0); }
          100% { box-shadow:0 0 0 0 rgba(74,222,128,0); }
        }
        @keyframes cwTyping {
          0%,80%,100% { transform:scale(0.6); opacity:0.35; }
          40%          { transform:scale(1);   opacity:1; }
        }
        @keyframes cwSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .cw-spin { animation: cwSpin 1s linear infinite; }
        .cw-messages::-webkit-scrollbar { width:4px; }
        .cw-messages::-webkit-scrollbar-track { background:transparent; }
        .cw-messages::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
        .cw-kb-list::-webkit-scrollbar { height:3px; }
        .cw-kb-list::-webkit-scrollbar-track { background:transparent; }
        .cw-kb-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
        .cw-settings-body::-webkit-scrollbar { width:4px; }
        .cw-settings-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
        .cw-chip:hover { background:rgba(255,255,255,0.1) !important; color:#e2e8f0 !important; transform:translateY(-1px); }
        .cw-send-btn:hover:not(:disabled) { transform:scale(1.07) !important; }
        .cw-send-btn:active:not(:disabled) { transform:scale(0.95) !important; }
        .cw-send-btn:disabled { opacity:0.4 !important; cursor:not-allowed !important; }
        .cw-icon-btn:hover, .cw-close-btn:hover { transform:scale(1.08); }
        .cw-add-btn:hover { background:rgba(255,255,255,0.12) !important; color:#f1f5f9 !important; border-color:rgba(255,255,255,0.2) !important; }
        .cw-kb-del:hover { color:#f87171 !important; }
        .cw-input-pill:focus-within { border-color:rgba(79,110,247,0.5) !important; background:rgba(79,110,247,0.06) !important; box-shadow:0 0 0 3px rgba(79,110,247,0.08); }
        .cw-danger-btn:hover { background:rgba(239,68,68,0.18) !important; }
        .cw-secondary-btn:hover { background:rgba(255,255,255,0.09) !important; color:#e2e8f0 !important; }
        .cw-back-btn:hover { background:rgba(255,255,255,0.1) !important; color:#f1f5f9 !important; }
        .cw-theme-swatch:not(.selected):hover { transform:scale(1.04) !important; border-color:rgba(255,255,255,0.25) !important; }
        .cw-field-input:focus { border-color:rgba(79,110,247,0.5) !important; background:rgba(79,110,247,0.05) !important; }
        .cw-upload-menu-item:hover { background:rgba(255,255,255,0.08) !important; color:#fff !important; }
        @keyframes cwBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* Hidden File Picker Input for PDF, PPT, Word, Excel, Text, Images */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.json,.xml,.html,.rtf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff,.tif,.py,.js,.ts,.java,.cpp,.c,.cs"
        onChange={handleFileUpload}
      />

      {/* Hidden Folder Picker Input for whole directories */}
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFolderUpload}
      />

      <Draggable
        nodeRef={nodeRef}
        handle=".drag-handle"
        onDrag={() => { isDragging.current = true }}
        onStop={() => { setTimeout(() => { isDragging.current = false }, 50) }}
      >
        <div ref={nodeRef} style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ...S.root }}>

          {/* Floating Launcher Button */}
          {!isOpen && (
            <button
              className="drag-handle"
              style={S.launcher(hdrBg)}
              onClick={() => { if (!isDragging.current) setIsOpen(true) }}
              title="Drag to move, Click to open"
            >
              <RobotLogo size={30} className="pointer-events-none" />
            </button>
          )}

          {/* Chat Window */}
          {isOpen && (
            <div
              style={{ ...S.window, position: 'relative' }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingFile(true)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsDraggingFile(false)
                }
              }}
              onDrop={handleDrop}
            >
              {isDraggingFile && (
                <div style={S.dragOverlay}>
                  <FolderPlus size={44} style={{ color: accent, animation: 'cwBounce 1s infinite' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Drop Folder or Files Here</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                    Documents will be indexed into Knowledge Base
                  </p>
                </div>
              )}

              {/* Header */}
              <div className="drag-handle" style={S.header(hdrBg)}>
                <div style={{ position: 'absolute', bottom: 0, left: 20, right: 20, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', pointerEvents: 'none' }} />
                <div style={S.avatar}><RobotLogo size={26} /></div>
                <div style={{ flex: 1, padding: '0 12px' }}>
                  <p style={S.headerName}>{botName}</p>
                  <p style={S.headerSub}>
                    <span style={S.onlineDot} />
                    Domain RAG AI Assistant
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="cw-icon-btn" style={S.iconBtn} onClick={() => setShowSettings(!showSettings)} title="Settings & Knowledge Base">
                    <Settings size={16} />
                  </button>
                  <button className="cw-close-btn" style={S.closeBtn} onClick={() => setIsOpen(false)} title="Close">
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings ? (
                <div style={S.settingsWrap}>
                  <div style={S.settingsHeader}>
                    <button className="cw-back-btn" style={S.backBtn} onClick={() => setShowSettings(false)}>
                      <ChevronLeft size={18} />
                    </button>
                    <p style={S.settingsTitle}>Settings & Knowledge Base</p>
                  </div>

                  <div style={S.tabBar}>
                    {['chatbot','knowledge','personalize','account'].map(tab => (
                      <button
                        key={tab}
                        style={S.tabBtn(activeTab === tab)}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === 'chatbot'     && <><Sliders size={13} /> Chatbot</>}
                        {tab === 'knowledge'   && <><BookOpen size={13} /> Docs ({uploadedFiles.length})</>}
                        {tab === 'personalize' && <><Palette size={13} /> Theme</>}
                        {tab === 'account'     && <><User size={13} /> Account</>}
                      </button>
                    ))}
                  </div>

                  <div className="cw-settings-body" style={S.settingsBody}>
                    {activeTab === 'chatbot' && (
                      <>
                        <p style={S.fieldLabel}>Bot Name</p>
                        <input className="cw-field-input" style={S.fieldInput} type="text" value={botName} onChange={(e) => setBotName(e.target.value)} />
                        <p style={S.fieldLabel}>API URL</p>
                        <input className="cw-field-input" style={S.fieldInput} type="text" value={apiUrl} onChange={(e) => handleApiUrlChange(e.target.value)} />
                        <button className="cw-danger-btn" style={S.dangerBtn} onClick={() => { setMessages([]); setShowSettings(false); }}>
                          <Trash2 size={15} /> Clear Conversation
                        </button>
                      </>
                    )}

                    {activeTab === 'knowledge' && (
                      <>
                        <p style={S.fieldLabel}>Indexed Domain Files</p>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
                          Upload files or entire folders (PDF, Word, Excel, PPT, Text, Code, Images). Shri searches them with RAG embeddings to provide exact answers.
                        </p>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            style={{ ...S.primaryBtn(hdrBg), marginTop: 0, flex: 1 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? <Loader2 size={15} className="cw-spin" /> : <FileText size={15} />}
                            {isUploading ? 'Indexing...' : 'Upload Files'}
                          </button>

                          <button
                            type="button"
                            style={{ ...S.primaryBtn(hdrBg), marginTop: 0, flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                            onClick={() => folderInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <FolderPlus size={15} style={{ color: '#38bdf8' }} />
                            Upload Folder
                          </button>
                        </div>

                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {uploadedFiles.length === 0 ? (
                            <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                              No files uploaded yet. Click above or use the + button at the bottom of the chat.
                            </p>
                          ) : (
                            uploadedFiles.map((doc) => (
                              <div
                                key={doc.file_id}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '10px 12px', borderRadius: 12,
                                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                  <FileText size={15} style={{ color: accent, flexShrink: 0 }} />
                                  <div style={{ overflow: 'hidden' }}>
                                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                      {doc.file_name}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#64748b' }}>
                                      {doc.file_type.toUpperCase()} · {doc.chunks_count || 'Indexed'} chunks
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="cw-danger-btn"
                                  style={{
                                    background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8,
                                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#f87171', cursor: 'pointer', flexShrink: 0,
                                  }}
                                  onClick={() => handleDeleteFile(doc.file_id, doc.file_name)}
                                  title="Delete document from knowledge base"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}

                    {activeTab === 'personalize' && (
                      <>
                        <p style={S.fieldLabel}>Theme Color</p>
                        <div style={S.themeGrid}>
                          {Object.entries(themeMap).map(([key, { hdrBg: bg, label }]) => (
                            <button
                              key={key}
                              className={themeColor === key ? 'selected cw-theme-swatch' : 'cw-theme-swatch'}
                              style={S.themeSwatch(bg, themeColor === key)}
                              onClick={() => setThemeColor(key)}
                            >
                              {themeColor === key
                                ? <CheckCircle size={18} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                                : <span style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{label}</span>
                              }
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {activeTab === 'account' && (
                      <>
                        <div style={S.accountCard}>
                          <div style={S.accountAvatar(hdrBg)}>JD</div>
                          <div>
                            <p style={S.accountName}>John Doe</p>
                            <p style={S.accountEmail}>john.doe@example.com</p>
                          </div>
                        </div>
                        <button className="cw-secondary-btn" style={S.secondaryBtn}>
                          <LogOut size={15} /> Sign Out
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Message Thread */
                <div className="cw-messages" style={S.messages}>
                  {messages.length === 0 && (
                    <div style={S.bubbleRowBot}>
                      <div style={S.bubbleBot}>
                        Hello! I am Shri, your domain-specific AI assistant. You can upload documents using the <strong>+</strong> button below, and I will answer questions directly from them.
                      </div>
                      <div style={S.chips}>
                        {['What files are loaded?', 'Summarize documents', 'Help me get started'].map((chip, cIdx) => (
                          <button key={cIdx} type="button" className="cw-chip" style={S.chip} onClick={() => sendQuickReply(chip)}>{chip}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <div key={idx} style={msg.role === 'user' ? S.bubbleRowUser : S.bubbleRowBot}>
                      <div style={msg.role === 'user' ? S.bubbleUser(userBg) : S.bubbleBot}>
                        {msg.content}
                      </div>
                      {msg.rag_applied && (
                        <div style={S.ragTag}>
                          <BookOpen size={11} /> Grounded in knowledge base
                        </div>
                      )}
                      {msg.role === 'assistant' && idx === messages.length - 1 && (
                        <div style={S.chips}>
                          {['Thanks!', 'Tell me more', 'Explain in detail'].map((chip, cIdx) => (
                            <button key={cIdx} type="button" className="cw-chip" style={S.chip} onClick={() => sendQuickReply(chip)}>{chip}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div style={S.bubbleRowBot}>
                      <div style={S.typing}>
                        <div style={S.typingDot(0)} />
                        <div style={S.typingDot(0.2)} />
                        <div style={S.typingDot(0.4)} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Knowledge Base Strip (shows loaded files above input) */}
              {!showSettings && (uploadedFiles.length > 0 || isUploading) && (
                <div style={S.kbStrip}>
                  <div style={S.kbHeader}>
                    <span style={S.kbLabel}>
                      <BookOpen size={12} style={{ color: accent }} />
                      <span>Knowledge Base ({uploadedFiles.length} {uploadedFiles.length === 1 ? 'doc' : 'docs'})</span>
                    </span>
                    {isUploading && (
                      <span style={S.kbUploading}>
                        <Loader2 size={12} className="cw-spin" /> {uploadStatus || 'Processing...'}
                      </span>
                    )}
                  </div>
                  <div style={S.kbFileList} className="cw-kb-list">
                    {uploadedFiles.map(doc => (
                      <div key={doc.file_id} style={S.kbBadge} title={`${doc.file_name} (${doc.chunks_count} chunks)`}>
                        <FileText size={11} style={{ opacity: 0.8 }} />
                        <span style={S.kbFileName}>{doc.file_name}</span>
                        <button
                          type="button"
                          className="cw-kb-del"
                          style={S.kbDeleteBtn}
                          onClick={() => handleDeleteFile(doc.file_id, doc.file_name)}
                          title={`Remove ${doc.file_name} from knowledge base`}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar with Bottom File Add (+) Option */}
              {!showSettings && (
                <form onSubmit={sendMessage} style={{ ...S.inputArea, margin: 0 }}>
                  <div className="cw-add-wrap" style={{ position: 'relative' }}>
                    {showUploadMenu && (
                      <div className="cw-upload-menu" style={S.uploadMenu}>
                        <button
                          type="button"
                          className="cw-upload-menu-item"
                          style={S.uploadMenuItem}
                          onClick={() => {
                            setShowUploadMenu(false)
                            fileInputRef.current?.click()
                          }}
                        >
                          <FileText size={15} style={{ color: accent }} />
                          <span>Upload Files</span>
                        </button>
                        <button
                          type="button"
                          className="cw-upload-menu-item"
                          style={S.uploadMenuItem}
                          onClick={() => {
                            setShowUploadMenu(false)
                            folderInputRef.current?.click()
                          }}
                        >
                          <FolderPlus size={15} style={{ color: '#38bdf8' }} />
                          <span>Upload Folder</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      className="cw-add-btn"
                      style={S.addBtn}
                      onClick={() => setShowUploadMenu(!showUploadMenu)}
                      title="Upload files or folders (PDF, Word, Excel, PPT, Images)"
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 size={18} className="cw-spin" /> : <Plus size={19} />}
                    </button>
                  </div>

                  <div className="cw-input-pill" style={S.inputPill}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isUploading ? "Uploading file..." : "Chat here or ask about your files..."}
                      style={S.input}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="cw-send-btn"
                    style={S.sendBtn(hdrBg, accent)}
                    title="Send"
                  >
                    <Send size={16} style={{ transform: 'translateX(1px)' }} />
                  </button>
                </form>
              )}

            </div>
          )}

        </div>
      </Draggable>
    </>
  )
}