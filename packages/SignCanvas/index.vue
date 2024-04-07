<script setup lang="ts">
import { reactive, ref, watch, withDefaults, onMounted, toRefs } from 'vue'
import type { Data, Point } from './interface'

declare global {
  interface Window {
    webkitDevicePixelRatio: number
    mozDevicePixelRatio: number
    msDevicePixelRatio: number
  }
}

defineOptions({ name: 'SignCanvas' })
const props = withDefaults(
  defineProps<{
    value?: null,
    options?: Data['config'] | null
  }>(),
  {
    options: () => ({
      isFullScreen: false, // 是否全屏手写
      isFullCover: false, // 是否全屏模式下覆盖所有的元素
      isDpr: false, // 是否使用dpr兼容高分屏
      lastWriteSpeed: 1, // 笔迹速度
      lastWriteWidth: 2, // 笔迹宽度
      lineCap: 'round', // 笔迹端点样式
      lineJoin: 'round', // 笔迹连接样式
      canvasWidth: 600, // canvas宽度
      canvasHeight: 600, // canvas高度
      isShowBorder: true, // 是否显示边框 [可选]
      bgColor: '#fcc', // 背景色 [String] 可选 注:这背景色仅仅只是canvas背景,保存的图片仍然是透明的
      borderWidth: 1, // 网格线宽度  [Number] 可选
      borderColor: '#ff787f', // 网格颜色  [String] 可选
      writeWidth: 5, // 基础轨迹宽度  [Number] 可选
      maxWriteWidth: 30, // 写字模式最大线宽  [Number] 可选
      minWriteWidth: 5, // 写字模式最小线宽  [Number] 可选
      writeColor: '#101010', // 轨迹颜色  [String] 可选
      isSign: false, // 签名模式 [Boolean] 默认为非签名模式,有线框, 当设置为true的时候没有任何线框
      imgType: 'png' //下载的图片格式  [String] 可选为 jpeg  canvas本是透明背景的
    })
  }
)
const valueModel = defineModel('value')

const canvasRef = ref<HTMLCanvasElement | null>(null)

const data = reactive<Data>({
  value: null, // base64
  canvas: null as unknown as HTMLCanvasElement, // canvas dom对象
  context: null as unknown as CanvasRenderingContext2D, // canvas 画布对象
  dpr: 1, // 设备屏幕分辨率比
  config: {
    isFullScreen: false, // 是否全屏手写 [Boolean] 可选
    isFullCover: false, // 是否全屏模式下覆盖所有的元素 [Boolean] 可选
    isDpr: false, // 是否使用dpr兼容高分屏 [Boolean] 可选
    lastWriteSpeed: 1, // 书写速度 [Number] 可选
    lastWriteWidth: 2, // 下笔的宽度 [Number] 可选
    lineCap: 'round', // 线条的边缘类型 [butt]平直的边缘 [round]圆形线帽 [square]	正方形线帽
    lineJoin: 'round', // 线条交汇时边角的类型  [bevel]创建斜角 [round]创建圆角 [miter]创建尖角。
    canvasWidth: 600, // canvas宽高 [Number] 可选
    canvasHeight: 600, // 高度  [Number] 可选
    isShowBorder: true, // 是否显示边框 [可选]
    bgColor: '#fcc', // 背景色 [String] 可选 注:这背景色仅仅只是canvas背景,保存的图片仍然是透明的
    borderWidth: 1, // 网格线宽度  [Number] 可选
    borderColor: '#ff787f', // 网格颜色  [String] 可选
    writeWidth: 5, // 基础轨迹宽度  [Number] 可选
    maxWriteWidth: 30, // 写字模式最大线宽  [Number] 可选
    minWriteWidth: 5, // 写字模式最小线宽  [Number] 可选
    writeColor: '#101010', // 轨迹颜色  [String] 可选
    isSign: false, // 签名模式 [Boolean] 默认为非签名模式,有线框, 当设置为true的时候没有任何线框
    imgType: 'png' //下载的图片格式  [String] 可选为 jpeg  canvas本是透明背景的
  },
  resizeTimer: null
})

const init = () => {
  const options = props.options
  if (options) {
    for (const key in options) {
      data.config[key] = options[key]
    }
  }
  data.dpr =
    typeof window !== 'undefined' && data.config.isDpr
      ? window.devicePixelRatio || window.webkitDevicePixelRatio || window.mozDevicePixelRatio || 1
      : 1
  data.canvas = canvasRef.value!
  data.context = data.canvas.getContext('2d') as CanvasRenderingContext2D
  data.canvas.style.background = data.config.bgColor!
  if (data.config.isFullScreen) {
    data.config.canvasWidth = window.innerWidth || document.body.clientWidth
    data.config.canvasHeight = window.innerHeight || document.body.clientHeight
    if (data.config.isFullCover) {
      //开启全屏覆盖
      data.canvas.style.position = 'fixed'
      data.canvas.style.top = '0'
      data.canvas.style.left = '0'
      data.canvas.style.margin = '0'
      data.canvas.style.zIndex = '20001'
    }
  }
  data.canvas.height = data.config.canvasHeight!
  data.canvas.width = data.config.canvasWidth!
  canvasInit()
  canvasClear()
}

const { options } = toRefs(props)

watch(
  () => options.value,
  () => {
    init()
  },
  { deep: true }
)

/**
 * 轨迹宽度
 */
const setLineWidth = () => {
  const nowTime = new Date().getTime()
  const diffTime = nowTime - data.config.lastWriteTime
  data.config.lastWriteTime = nowTime
  let returnNum =
    data.config.minWriteWidth! +
    ((data.config.maxWriteWidth! - data.config!.minWriteWidth!) * diffTime) / 30
  if (returnNum < data.config.minWriteWidth!) {
    returnNum = data.config.minWriteWidth!
  } else if (returnNum > data.config.maxWriteWidth!) {
    returnNum = data.config.maxWriteWidth!
  }
  returnNum = Number.parseFloat(returnNum.toFixed(2))
  //写字模式和签名模式
  if (data.config.isSign) {
    data.context.lineWidth = data.config.writeWidth! * data.dpr
  } else {
    const lineWidth = (data.config.lastWriteWidth =
      (data.config.lastWriteWidth! / 4) * 3 + returnNum / 4)
    data.context.lineWidth = lineWidth * data.dpr
  }
}

/**
 * 写开始
 */
const writeBegin = (point: Point) => {
  data.config.isWrite = true
  data.config.lastWriteTime = new Date().getTime()
  data.config.lastPoint = point
  writeContextStyle()
}

/**
 * 绘制轨迹
 */
const writing = (point: Point) => {
  data.context.beginPath()
  data.context.moveTo(data.config.lastPoint!.x * data.dpr, data.config.lastPoint!.y * data.dpr)
  data.context.lineTo(point.x * data.dpr, point.y * data.dpr)
  setLineWidth()
  data.context.stroke()
  data.config.lastPoint = point
  data.context.closePath()
}

/**
 * 写结束
 */
const writeEnd = (point: Point) => {
  data.config.isWrite = false
  data.config.lastPoint = point
  saveAsImg()
}

/**
 * 轨迹样式
 */
const writeContextStyle = () => {
  data.context.beginPath()
  data.context.strokeStyle = data.config.writeColor!
  data.context.lineCap = data.config.lineCap as CanvasLineCap
  data.context.lineJoin = data.config.lineJoin as CanvasLineJoin
}

/**
 * 清空画板
 */
const canvasClear = () => {
  data.context.save()
  data.context.strokeStyle! = data.config.writeColor!
  data.context.clearRect(0, 0, data.canvas.width, data.canvas.height)
  data.context.beginPath()
  data.context.lineWidth = data.config.borderWidth! * data.dpr
  data.context.strokeStyle = data.config.borderColor!
  let size = (data.config.borderWidth! / 2) * data.dpr
  if (data.config.isShowBorder) {
    //画外面的框
    data.context.moveTo(size, size)
    data.context.lineTo(data.canvas.width - size, size)
    data.context.lineTo(data.canvas.width - size, data.canvas.height - size)
    data.context.lineTo(size, data.canvas.height - size)
    data.context.closePath()
    data.context.stroke()
  }
  if (data.config.isShowBorder && !data.config.isSign) {
    //画里面的框
    data.context.moveTo(0, 0)
    data.context.lineTo(data.canvas.width, data.canvas.height)
    data.context.lineTo(data.canvas.width, data.canvas.height / 2)
    data.context.lineTo(0, data.canvas.height / 2)
    data.context.lineTo(0, data.canvas.height)
    data.context.lineTo(data.canvas.width, 0)
    data.context.lineTo(data.canvas.width / 2, 0)
    data.context.lineTo(data.canvas.width / 2, data.canvas.height)
    data.context.stroke()
  }
  valueModel.value = null
  data.context.restore()
}

/**
 *  保存图片 格式base64
 */
const saveAsImg = () => {
  const image = new Image()
  image.src = data.canvas.toDataURL(`image/${data.config.imgType}`)
  valueModel.value = image.src
  return image.src
}

/**
 * 初始化画板
 */
const canvasInit = () => {
  data.canvas.width = data.config.canvasWidth! * data.dpr
  data.canvas.height = data.config.canvasHeight! * data.dpr
  data.canvas.style.width = `${data.config.canvasWidth}px`
  data.canvas.style.height = `${data.config.canvasHeight}px`
  data.config.emptyCanvas = data.canvas.toDataURL(`image/${data.config.imgType}`)
}

/**
 * 鼠标按下 => 下笔
 */
const handleMousedown = (e: MouseEvent) => {
  writeBegin({ x: e.offsetX || e.clientX, y: e.offsetY || e.clientY })
}

/**
 * 书写过程 => 下笔书写
 */
const handleMousemove = (e: MouseEvent) => {
  data.config.isWrite && writing({ x: e.offsetX, y: e.offsetY })
}

/**
 * 鼠标松开 => 提笔
 */
const handleMouseup = (e: MouseEvent) => {
  writeEnd({ x: e.offsetX, y: e.offsetY })
}

/**
 * 离开书写区域 => 提笔离开
 */
const handleMouseleave = (e: MouseEvent) => {
  data.config.isWrite = false
  data.config.lastPoint = { x: e.offsetX, y: e.offsetY }
}

/* ==========================移动端兼容=Start================================ */

/**
 * 手指按下 => 下笔
 */
const handleTouchstart = (e: TouchEvent) => {
  const touch = e.targetTouches[0]
  const x = touch.clientX
    ? touch.clientX - getRect().left
    : touch.pageX - offset(touch.target, 'left')
  const y = touch.clientY
    ? touch.clientY - getRect().top
    : touch.pageY - offset(touch.target, 'top')
  writeBegin({ x, y })
}

/**
 * 手指移动 => 下笔书写
 */
const handleTouchmove = (e: TouchEvent) => {
  const touch = e.targetTouches[0]
  const x = touch.clientX
    ? touch.clientX - getRect().left
    : touch.pageX - offset(touch.target, 'left')
  const y = touch.clientY
    ? touch.clientY - getRect().top
    : touch.pageY - offset(touch.target, 'top')
  data.config.isWrite && writing({ x, y })
}

/**
 * 手指移动结束 => 提笔离开
 */
const handleTouchend = (e: TouchEvent) => {
  const tcs = e.targetTouches
  const ccs = e.changedTouches
  const touch = (tcs && tcs.length && tcs[0]) || (ccs && ccs.length && ccs[0]) as Touch
  const x = touch.clientX
    ? touch.clientX - getRect().left
    : touch.pageX - offset(touch.target, 'left')
  const y = touch.clientY
    ? touch.clientY - getRect().top
    : touch.pageY - offset(touch.target, 'top')
  writeEnd({ x, y })
}

/* ==========================移动端兼容=End================================== */

/**
 * 下载二维码到本地
 */
const downloadSignImg = (name: string) => {
  const c = canvasRef.value
  const dataURL = c!.toDataURL('image/png')
  saveFile(
    dataURL,
    name ? `${name}.${data.config.imgType}` : `${new Date().getTime()}.${data.config.imgType}`
  )
}

/**
 * 保存文件
 */
const saveFile = (data: any, filename: any) => {
  const saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a') as HTMLAnchorElement
  saveLink.href = data
  saveLink.download = filename
  const event = document.createEvent('MouseEvents')
  event.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  )
  saveLink.dispatchEvent(event)
}

/**
 * 获取画布的元素的大小及其相对于视口的位置
 * @return {}
 */
const getRect = () => {
  return canvasRef.value!.getBoundingClientRect()
}

/**
 * 获取dom对象的偏移量 可以获取解决position定位的问题
 * @returns number
 */
const offset = (obj: any, direction: any) => {
  //将top,left首字母大写,并拼接成offsetTop,offsetLeft
  const offsetDir = 'offset' + direction[0].toUpperCase() + direction.substring(1)
  let realNum = obj[offsetDir]
  let positionParent = obj.offsetParent //获取上一级定位元素对象
  while (positionParent != null) {
    realNum += positionParent[offsetDir]
    positionParent = positionParent.offsetParent
  }
  return realNum
}

/**
 * 图片压缩
 */
const dealImage = () => {
  //压缩系数0-1之间
  const quality = 0.6
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dealWidth = 300 //目标尺寸
  const dealHeight = 200
  canvas.width = dealWidth
  canvas.width = dealHeight

  // if (Math.max(imgWidth, imgHeight) > w) {
  //     if (imgWidth > imgHeight) {
  //         canvas.width = w
  //         canvas.height = w * imgHeight / imgWidth
  //     } else {
  //         canvas.height = w
  //         canvas.width = w * imgWidth / imgHeight
  //     }
  // } else {
  //     canvas.width = imgWidth
  //     canvas.height = imgHeight
  //     quality = 0.6
  // }
  const c = canvasRef.value
  const image = new Image()
  image.src = c!.toDataURL('image/png')
  ctx!.clearRect(0, 0, canvas.width, canvas.height)
  ctx!.drawImage(image, 0, 0, canvas.width, canvas.height)
  const ba = canvas.toDataURL('image/jpeg', quality) //压缩语句
  console.log(ba)
}

onMounted(() => {
  init()
  window.addEventListener('resize', () => {
    if (data.resizeTimer) clearTimeout(data.resizeTimer)
    data.resizeTimer = setTimeout(() => {
      init()
    }, 100)
  })
})

defineExpose({
  downloadSignImg,
  dealImage,
  canvasClear,
  saveAsImg
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="app-sign-canvas"
    @mousedown.prevent.stop="handleMousedown"
    @mousemove.prevent.stop="handleMousemove"
    @mouseup.prevent.stop="handleMouseup"
    @mouseleave.prevent.stop="handleMouseleave"
    @touchstart.prevent.stop="handleTouchstart"
    @touchmove.prevent.stop="handleTouchmove"
    @touchend.prevent.stop="handleTouchend"
  >
    您的浏览器不支持canvas技术,请升级浏览器!
  </canvas>
</template>
