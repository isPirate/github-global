'use client'

import { useState } from 'react'

export default function SignOutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignOut = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      })

      if (response.redirected) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isSubmitting}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? '退出中...' : '退出登录'}
    </button>
  )
}
