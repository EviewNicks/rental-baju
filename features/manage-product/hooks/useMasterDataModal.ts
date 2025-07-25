'use client'

import { useState } from 'react'

export function useMasterDataModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultTab, setDefaultTab] = useState<'categories' | 'colors'>('categories')

  const openModal = (tab: 'categories' | 'colors' = 'categories') => {
    setDefaultTab(tab)
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  return {
    isOpen,
    defaultTab,
    openModal,
    closeModal,
  }
}
