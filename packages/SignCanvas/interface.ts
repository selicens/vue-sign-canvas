export interface Data {
  value?: any
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  dpr: number
  config: Config
  resizeTimer?: any
}

export interface Config {
  isFullScreen?: boolean
  isFullCover?: boolean
  isDpr?: boolean
  isWrite?: boolean
  lastPoint?: Point
  lastWriteTime?: any
  lastWriteSpeed?: number
  lastWriteWidth?: number
  lineCap?: CanvasRenderingContext2D['lineCap']
  lineJoin?: CanvasRenderingContext2D['lineJoin']
  canvasWidth?: HTMLCanvasElement['width']
  canvasHeight?: HTMLCanvasElement['height']
  isShowBorder?: boolean
  bgColor?: string
  borderWidth?: number
  borderColor?: string
  writeWidth?: number
  maxWriteWidth?: number
  minWriteWidth?: number
  writeColor?: string
  isSign?: boolean
  imgType?: ImgType
  emptyCanvas?: string
  [key: string]: any
}

type ImgType = 'png' | 'jpeg' | 'webp'

export interface Point {
  x: number
  y: number
}
