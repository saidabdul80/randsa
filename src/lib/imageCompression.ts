export interface ImageCompressionOptions {
  maxBytes: number
  maxDimension: number
  initialQuality?: number
  minQuality?: number
  qualityStep?: number
  outputType?: string
  outputExtension?: string
  targetBytes?: number
  genericErrorMessage?: string
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Could not read ${file.name}.`))
    }

    image.src = objectUrl
  })
}

export async function compressImageFile(file: File, options: ImageCompressionOptions) {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(
      options.genericErrorMessage || 'Your browser could not prepare the selected image for upload.'
    )
  }

  const scale = Math.min(1, options.maxDimension / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  let quality = options.initialQuality ?? 0.86
  const minQuality = options.minQuality ?? 0.5
  const qualityStep = options.qualityStep ?? 0.08
  const outputType = options.outputType ?? 'image/jpeg'
  const outputExtension = options.outputExtension ?? 'jpg'
  const targetBytes = options.targetBytes ?? options.maxBytes
  let blob: Blob | null = null

  while (quality >= minQuality) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality)
    })

    if (!blob) {
      break
    }

    if (blob.size <= targetBytes || quality <= minQuality + 0.01) {
      break
    }

    quality -= qualityStep
  }

  if (!blob) {
    throw new Error(`Could not compress ${file.name}.`)
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
  const compressedFile = new File([blob], `${baseName}.${outputExtension}`, {
    type: outputType,
    lastModified: Date.now(),
  })

  if (compressedFile.size > options.maxBytes) {
    throw new Error(
      `${file.name} is still too large after compression. Please choose a smaller image.`
    )
  }

  return compressedFile
}
