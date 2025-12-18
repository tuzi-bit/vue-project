import mitt from 'mitt'
// 定义事件类型
export type Events = {
//   'user:login': { id: string; name: string }
//   'toast': string
}

const emitter = mitt<Events>()

export default emitter