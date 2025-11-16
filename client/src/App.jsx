import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatSessions, setChatSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load all chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'
        const response = await axios.get(`${apiUrl}/api/chatbot/sessions`)
        if (response.data.sessions) {
          setChatSessions(response.data.sessions)
        }
      } catch (err) {
        console.error('Failed to load sessions:', err)
      }
    }
    loadSessions()
  }, [])

  // Load chat history when component mounts or session changes
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'
        const response = await axios.get(`${apiUrl}/api/chatbot/history/${currentSessionId}`)
        if (response.data.messages && response.data.messages.length > 0) {
          setMessages(response.data.messages)
        } else {
          setMessages([])
        }
      } catch (err) {
        console.error('Failed to load chat history:', err)
      }
    }
    loadChatHistory()
  }, [currentSessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const formatMessage = (text) => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-opacity-20 bg-gray-500 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
      .replace(/\n/g, '<br />')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) {
      setError('Please enter a message')
      return
    }

    const userMessage = input.trim()
    setInput('')
    setError('')
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'
      const response = await axios.post(`${apiUrl}/api/chatbot`, {
        queries: userMessage,
        sessionId: currentSessionId
      })
      
      // Add bot response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }])
      
      // Reload sessions to update sidebar
      const sessionsResponse = await axios.get(`${apiUrl}/api/chatbot/sessions`)
      if (sessionsResponse.data.sessions) {
        setChatSessions(sessionsResponse.data.sessions)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get response. Please try again.')
      console.error('Error:', err)
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setInput('')
    setError('')
  }

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCurrentSessionId(newSessionId)
    setMessages([])
    setInput('')
    setError('')
  }

  const loadSession = (sessionId) => {
    setCurrentSessionId(sessionId)
  }

  const getSessionTitle = (session) => {
    if (session.messages && session.messages.length > 0) {
      const firstUserMessage = session.messages.find(m => m.role === 'user')
      return firstUserMessage?.content.substring(0, 30) + '...' || 'New Chat'
    }
    return 'New Chat'
  }

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation() // Prevent loading the session when clicking delete
    if (!confirm('Are you sure you want to delete this chat?')) return

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'
      await axios.delete(`${apiUrl}/api/chatbot/history/${sessionId}`) // Call delete endpoint
      
      // Remove from chat list in sidebar
      setChatSessions(prev => prev.filter(s => s.sessionId !== sessionId))
      
      // If deleted session is current, create new chat
      if (sessionId === currentSessionId) {
        handleNewChat()
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
      alert('Failed to delete chat. Please try again.')
    }
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} transition-all duration-300 overflow-hidden flex flex-col border-r ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-800 border'} transition-all`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className={`text-xs uppercase tracking-wide px-3 py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Recent Chats
          </p>
          {chatSessions.map((session) => (
            <div
              key={session.sessionId}
              className={`group relative flex items-center w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${
                currentSessionId === session.sessionId
                  ? darkMode ? 'bg-gray-800 text-white' : 'bg-indigo-50 text-indigo-700'
                  : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => loadSession(session.sessionId)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                <span className="text-sm truncate">{getSessionTitle(session)}</span>
              </button>
              
              {/* Delete Button - Shows on Hover */}
              <button
                onClick={(e) => deleteSession(session.sessionId, e)}
                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-200 text-gray-500 hover:text-red-600'
                }`}
                title="Delete chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} transition-all`}
          >
            {darkMode ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <span className="text-sm">Light Mode</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
                <span className="text-sm">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Noob Chatbot
            </h1>
          </div>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className={`text-7xl mb-6 ${darkMode ? 'opacity-20' : 'opacity-30'}`}>💬</div>
              <h2 className={`text-3xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                How can I help you today?
              </h2>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Ask me anything and I'll do my best to assist you
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`py-6 px-4 ${message.role === 'assistant' ? (darkMode ? 'bg-gray-800/50' : 'bg-white') : ''}`}
                >
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                        : darkMode ? 'bg-green-600' : 'bg-green-500'
                    }`}>
                      {message.role === 'user' ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </p>
                      <div 
                        className={`text-base leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(message.content)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className={`py-6 px-4 ${darkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-600' : 'bg-green-500'}`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        AI Assistant
                      </p>
                      <div className="flex gap-1">
                        <div className={`w-2 h-2 ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                        <div className={`w-2 h-2 ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                        <div className={`w-2 h-2 ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mx-4 mb-2 ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-500'} border-l-4 p-3 rounded`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className={`border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} p-4`}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI Chatbot..."
                className={`flex-1 px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  loading || !input.trim()
                    ? darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                } disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
