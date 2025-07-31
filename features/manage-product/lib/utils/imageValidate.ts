export const getValidImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '/products/image.png'
  }

  // Jika sudah absolute URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Jika relative path tanpa leading slash, tambahkan
  if (!imageUrl.startsWith('/')) {
    return `/${imageUrl}`
  }

  return imageUrl
}
