/**
 * useImageUpload Hook - Handle image upload with validation and preview
 * Provides drag & drop functionality, file validation, and preview generation
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UseImageUploadOptions {
  onFileChange?: (file: File | null) => void
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  multiple?: boolean
}

interface ImageUploadState {
  file: File | null
  preview: string | null
  isUploading: boolean
  error: string | null
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    onFileChange,
    maxSize = 5 * 1024 * 1024, // 5MB default
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    multiple = false,
  } = options

  const [state, setState] = useState<ImageUploadState>({
    file: null,
    preview: null,
    isUploading: false,
    error: null,
  })

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `Ukuran file maksimal ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
    }

    if (!acceptedTypes.includes(file.type)) {
      const acceptedExtensions = acceptedTypes.map(type => type.split('/')[1]).join(', ')
      return `Format file harus ${acceptedExtensions.toUpperCase()}`
    }

    return null
  }, [maxSize, acceptedTypes])

  // Handle file selection
  const handleFileSelect = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      setState(prev => ({ ...prev, error, file: null, preview: null }))
      onFileChange?.(null)
      return
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    
    setState(prev => ({ 
      ...prev, 
      file, 
      preview, 
      error: null 
    }))
    
    onFileChange?.(file)
  }, [validateFile, onFileChange])

  // Handle file rejection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFileReject = useCallback((rejectedFiles: any[]) => {
    const rejection = rejectedFiles[0]
    let error = 'File tidak valid'
    
    if (rejection?.errors?.[0]) {
      const errorCode = rejection.errors[0].code
      switch (errorCode) {
        case 'file-too-large':
          error = `Ukuran file maksimal ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
          break
        case 'file-invalid-type':
          const acceptedExtensions = acceptedTypes.map(type => type.split('/')[1]).join(', ')
          error = `Format file harus ${acceptedExtensions.toUpperCase()}`
          break
        default:
          error = rejection.errors[0].message || 'File tidak valid'
      }
    }
    
    setState(prev => ({ ...prev, error }))
  }, [maxSize, acceptedTypes])

  // Setup dropzone
  const dropzone = useDropzone({
    onDrop: handleFileSelect,
    onDropRejected: handleFileReject,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple,
    disabled: state.isUploading,
  })

  // Remove selected file
  const removeFile = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview)
    }
    setState(prev => ({ 
      ...prev, 
      file: null, 
      preview: null, 
      error: null 
    }))
    onFileChange?.(null)
  }, [state.preview, onFileChange])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Set uploading state (useful when integrating with form submission)
  const setIsUploading = useCallback((isUploading: boolean) => {
    setState(prev => ({ ...prev, isUploading }))
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview)
    }
    setState({
      file: null,
      preview: null,
      isUploading: false,
      error: null,
    })
    onFileChange?.(null)
  }, [state.preview, onFileChange])

  // Cleanup preview URL on unmount
  const cleanup = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview)
    }
  }, [state.preview])

  return {
    // State
    file: state.file,
    preview: state.preview,
    isUploading: state.isUploading,
    error: state.error,
    
    // Dropzone props
    dropzone,
    
    // Actions
    removeFile,
    clearError,
    setUploading: setIsUploading,
    reset,
    cleanup,
    
    // Utilities
    isDragActive: dropzone.isDragActive,
    isDragAccept: dropzone.isDragAccept,
    isDragReject: dropzone.isDragReject,
    hasFile: !!state.file,
    hasError: !!state.error,
  }
}

/**
 * Hook for handling multiple image uploads
 */
interface UseMultipleImageUploadOptions {
  onFileChange?: (files: File[]) => void
  maxSize?: number
  acceptedTypes?: string[]
}

export function useMultipleImageUpload(options: UseMultipleImageUploadOptions = {}) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const {
    onFileChange,
    maxSize = 5 * 1024 * 1024,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  } = options

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `Ukuran file maksimal ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
    }

    if (!acceptedTypes.includes(file.type)) {
      const acceptedExtensions = acceptedTypes.map(type => type.split('/')[1]).join(', ')
      return `Format file harus ${acceptedExtensions.toUpperCase()}`
    }

    return null
  }, [maxSize, acceptedTypes])

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = []
    const newPreviews: string[] = []
    const newErrors: string[] = []

    newFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
      } else {
        validFiles.push(file)
        newPreviews.push(URL.createObjectURL(file))
      }
    })

    setFiles(prev => [...prev, ...validFiles])
    setPreviews(prev => [...prev, ...newPreviews])
    setErrors(prev => [...prev, ...newErrors])

    onFileChange?.([...files, ...validFiles])
  }, [files, validateFile, onFileChange])

  const removeFile = useCallback((index: number) => {
    // Revoke preview URL
    if (previews[index]) {
      URL.revokeObjectURL(previews[index])
    }

    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)

    setFiles(newFiles)
    setPreviews(newPreviews)
    onFileChange?.(newFiles)
  }, [files, previews, onFileChange])

  const clearAll = useCallback(() => {
    previews.forEach(preview => URL.revokeObjectURL(preview))
    setFiles([])
    setPreviews([])
    setErrors([])
    onFileChange?.([])
  }, [previews, onFileChange])

  return {
    files,
    previews,
    errors,
    isUploading,
    addFiles,
    removeFile,
    clearAll,
    setUploading: setIsUploading,
    hasFiles: files.length > 0,
    hasErrors: errors.length > 0,
  }
}