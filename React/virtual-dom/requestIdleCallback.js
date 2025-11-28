const ImmediatePriority = 1; // 立即执行的优先级, 级别最高 [点击事件，输入框，]
const UserBlockingPriority = 2; // 用户阻塞级别的优先级, [滚动，拖拽这些]
const NormalPriority = 3; // 正常的优先级 [redner 列表 动画 网络请求]
const LowPriority = 4; // 低优先级  [分析统计]
const IdlePriority = 5;// 最低阶的优先级, 可以被闲置的那种 [console.log]

function getCurrentTime() {
  return performance.now();
}

class SimpleScheduler {
  constructor() {
    /**
     * 存储任务队列
     * callback, priorityLevel, expirationTime
     */
    this.taskQueue = []
    this.isPerformingWork = false // 是否正在工作,防止重复调度
    const channel = new MessageChannel()
    this.port = channel.port2 // 发送消息
    channel.port1.onmessage = this.performWorkUntilDeadline.bind(this)
  }

  /**
   * 
   * @param {优先级} priorityLevel 
   * @param {回调函数} callback 
   */
  scheduleCallback(priorityLevel, callback) {
    const currentTime = getCurrentTime();
    let timeout;
    // 根据优先级设置超时时间
    // 超时时间越小,优先级越高
    switch (priorityLevel) {
      case ImmediatePriority:
        timeout = -1;
        break;
      case UserBlockingPriority:
        timeout = 250;
        break;
      case LowPriority:
        timeout = 10000;
        break;
      case IdlePriority:
        timeout = 1073741823;  // 32位操作系统v8引擎所对应的最大时间
        break;
      case NormalPriority:
      default:
        timeout = 5000;
        break;
    }


    const task = {
      callback,
      priorityLevel,
      expirationTime: currentTime + timeout
    }
    this.push(this.taskQueue, task)
    this.schedulePerformWorkUntilDeadline()
  }

  // 通过 MessageChannel 调度执行任务
  schedulePerformWorkUntilDeadline() {
    if (!this.isPerformingWork) {
      this.port.postMessage(null) // 触发 MessageChannel 调度
      this.isPerformingWork = true
    }
  }

  // 执行任务
  performWorkUntilDeadline() {
    this.isPerformingWork = true // 防止任务重复执行
    this.workLoop()
    this.isPerformingWork = false
  }

  workLoop() {
    // 执行任务
    let currentTask = this.peek(this.taskQueue)
    while (currentTask) {
      // 执行任务
      let cb = currentTask.callback
      cb && cb()
      // 删除
      this.pop(this.taskQueue)
      currentTask = this.peek(this.taskQueue)
    }
  }

  push(queue, task) {
    queue.push(task)
    // 从小到大,也就是按优先级排序
    queue.sort((a, b) => a.expirationTime - b.expirationTime)
  }

  peek(queue) {
    return queue[0] || null
  }

  pop(queue) {
    return queue.shift()
  }
}

const s = new SimpleScheduler();
// 可以调用多次,而且需要根据优先级排序IdlePriority
s.scheduleCallback(IdlePriority, () => {
  console.log(3);
  
})
s.scheduleCallback(ImmediatePriority, () => {
  console.log(1);
})
s.scheduleCallback(UserBlockingPriority, () => {
  console.log(2);
})
