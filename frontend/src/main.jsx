import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application rendering failed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center text-slate-100">
          <div
            role="alert"
            className="w-full rounded-2xl border border-red-400/30 bg-slate-900 p-8"
          >
            <h1 className="text-2xl font-bold">We couldn’t display this page</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Something went wrong while loading CareerPilot. Reload the page to
              try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400"
            >
              Reload page
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
