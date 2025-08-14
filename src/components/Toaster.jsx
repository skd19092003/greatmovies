import { useEffect, useRef } from 'react'

export default function Toaster() {
  const containerRef = useRef(null)

  useEffect(() => {
    function onToast(e) {
      const { text = '', variant = 'success', delay = 2000 } = e.detail || {}
      const container = containerRef.current
      if (!container) return

      const wrapper = document.createElement('div')
      wrapper.className = 'toast align-items-center text-bg-' + variant
      wrapper.setAttribute('role', 'status')
      wrapper.setAttribute('aria-live', 'polite')
      wrapper.setAttribute('aria-atomic', 'true')

      wrapper.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${text}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `

      container.appendChild(wrapper)
      if (window.bootstrap?.Toast) {
        const toast = new window.bootstrap.Toast(wrapper, { delay, autohide: true })
        toast.show()
        wrapper.addEventListener('hidden.bs.toast', () => {
          wrapper.remove()
        })
      }
    }
    window.addEventListener('toast', onToast)
    return () => window.removeEventListener('toast', onToast)
  }, [])

  return (
    <div
      ref={containerRef}
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1080 }}
    />
  )
}
