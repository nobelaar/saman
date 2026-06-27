export function comprimirImagen(
  file: File,
  maxBytes = 1_000_000,
  calidad = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen'))
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      const maxDim = 1280
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      let calidadActual = calidad
      const emit = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Fallo al convertir la imagen'))
              return
            }
            if (blob.size > maxBytes && calidadActual > 0.3) {
              calidadActual -= 0.1
              emit()
            } else {
              resolve(blob)
            }
          },
          'image/jpeg',
          calidadActual
        )
      }
      emit()
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen'))
    }
    img.src = url
  })
}

import { supabase } from '@/lib/supabase'

export async function subirFoto(
  bucket: 'centros-fotos',
  path: string,
  blob: Blob
): Promise<{ publicUrl: string; error: string | null }> {
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: false,
    contentType: blob.type || 'image/jpeg',
  })
  if (error) return { publicUrl: '', error: error.message }
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)
  return { publicUrl, error: null }
}