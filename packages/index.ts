import type { App } from 'vue'
// 导入单个组件
import SignCanvas from './SignCanvas/index.vue'
import type { Data } from './SignCanvas/interface'
SignCanvas.install = function (app: App) {
  app.component(SignCanvas.name!, SignCanvas)
  return app
}
// 导出的对象必须具备一个 install 方法
export default SignCanvas
export type { Data }
