<template>
  <!--
    ==========================================
    EventDemo.vue - 事件系统详解
    ==========================================
    Cesium 提供了丰富的事件系统，用于响应用户交互和场景变化。
    本组件演示：
    1. 鼠标事件（点击、移动、滚轮）
    2. 实体拾取（Pick）
    3. 场景事件
    4. 键盘事件
    ==========================================
  -->
  <div class="demo-container">
    <div class="info-panel">
      <h3>6. 事件系统</h3>
      <p>Cesium 提供了完整的事件系统来处理用户交互。鼠标操作通过 ScreenSpaceEventHandler 来管理。</p>

      <div class="event-log">
        <h4>事件日志</h4>
        <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
          {{ log }}
        </div>
        <button class="clear-btn" @click="eventLogs = []">清空日志</button>
      </div>

      <div class="api-info">
        <h4>拾取类型说明</h4>
        <p><strong>pick：</strong>拾取最上层的对象（Entity/Primitive）</p>
        <p><strong>drillPick：</strong>拾取某位置的所有对象（穿透拾取）</p>
        <p><strong>pickPosition：</strong>拾取精确的世界坐标（含地形）</p>
      </div>
    </div>
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<script setup>
/**
 * ==========================================
 * 事件系统 - 核心 API
 * ==========================================
 *
 * ScreenSpaceEventHandler - 屏幕空间事件处理器
 * ------------------------------------------
 * 这是 Cesium 处理用户输入的核心类。
 * 它将鼠标/触摸操作映射为语义事件。
 *
 * 创建方式：
 * const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
 *
 * 事件类型（MouseEventType / KeyboardEventType）：
 * ------------------------------------------
 * LEFT_CLICK        左键单击
 * LEFT_DOUBLE_CLICK 左键双击
 * LEFT_DOWN         左键按下
 * LEFT_UP           左键抬起
 * RIGHT_CLICK       右键单击
 * RIGHT_DOWN        右键按下
 * RIGHT_UP          右键抬起
 * MIDDLE_CLICK      中键单击
 * MIDDLE_DOWN       中键按下
 * MIDDLE_UP         中键抬起
 * MOUSE_MOVE        鼠标移动
 * WHEEL             滚轮滚动
 * PINCH_START       双指捏合开始（触摸）
 * PINCH_END         双指捏合结束
 * PINCH_MOVE        双指捏合移动
 *
 * 注册事件：
 * handler.setInputAction(action, type, modifier)
 * - action   : Function  回调函数，接收事件数据
 * - type     : MouseEventType  事件类型
 * - modifier : KeyModifier  修饰键（Ctrl/Shift/Alt，可选）
 *
 * 移除事件：
 * handler.removeInputAction(type, modifier)
 *
 * 销毁：
 * handler.destroy()
 *
 * 拾取（Picking）API：
 * ------------------------------------------
 * scene.pick(windowPosition)
 *   拾取指定窗口坐标处的对象
 *   返回：Entity | Primitive | undefined
 *
 * scene.drillPick(windowPosition)
 *   穿透拾取，返回该位置处的所有对象数组
 *
 * scene.pickPosition(windowPosition)
 *   拾取精确的 WGS84 世界坐标（考虑地形）
 *   返回：Cartesian3 | undefined
 *
 * Cesium.defined(picked)
 *   判断拾取结果是否有效（替代 picked !== undefined）
 *
 * 坐标转换：
 * ------------------------------------------
 * scene.globe.pick(ray, scene)
 *   从屏幕坐标发射射线，与地形/模型求交
 *
 * Cesium.Ray 射线
 * Cesium.IntersectionTests.raySphere / rayEllipsoid 等
 */
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as Cesium from 'cesium'

const cesiumContainer = ref(null)
const viewer = shallowRef(null)
const eventLogs = ref([])
let handler = null

/**
 * 添加日志
 */
function addLog(msg) {
  eventLogs.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`)
  if (eventLogs.value.length > 50) {
    eventLogs.value.pop()
  }
}

onMounted(() => {
  viewer.value = new Cesium.Viewer(cesiumContainer.value, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: true,
    timeline: false,
    navigationHelpButton: false
  })

  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 8000000),
    duration: 0
  })

  // 添加一些实体用于拾取测试
  addTestEntities()

  // 初始化事件处理器
  initEvents()
})

/**
 * 添加测试实体
 */
function addTestEntities() {
  viewer.value.entities.add({
    name: '北京',
    position: Cesium.Cartesian3.fromDegrees(116.39, 39.91, 0),
    point: {
      pixelSize: 15,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    },
    label: {
      text: '北京',
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      pixelOffset: new Cesium.Cartesian2(0, -25),
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  })

  viewer.value.entities.add({
    name: '上海',
    position: Cesium.Cartesian3.fromDegrees(121.47, 31.23, 0),
    point: {
      pixelSize: 15,
      color: Cesium.Color.CYAN,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    },
    label: {
      text: '上海',
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      pixelOffset: new Cesium.Cartesian2(0, -25),
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  })
}

/**
 * 初始化所有事件监听
 */
function initEvents() {
  const scene = viewer.value.scene

  /**
   * ==========================================
   * ScreenSpaceEventHandler - 事件处理器
   * ==========================================
   */
  handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)

  /**
   * 左键单击 - 拾取实体
   *
   * scene.pick(position)
   * ------------------------------------------
   * 从窗口坐标（像素坐标，原点在左上角）拾取最上层的对象。
   * 返回 Entity 或 Primitive 或 undefined。
   *
   * 注意：
   * - 窗口坐标 ≠ 地理坐标
   * - 事件回调中的 position 就是窗口坐标
   */
  handler.setInputAction((movement) => {
    const picked = scene.pick(movement.position)

    if (Cesium.defined(picked)) {
      // 判断拾取到的是 Entity 还是 Primitive
      if (picked.id instanceof Cesium.Entity) {
        addLog(`左键点击 Entity: "${picked.id.name}"`)
      } else if (picked.primitive) {
        addLog(`左键点击 Primitive: ${picked.primitive.id || 'unnamed'}`)
      } else {
        addLog(`左键点击对象: ${picked.id || 'unnamed'}`)
      }
    } else {
      addLog('左键点击空白处')
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  /**
   * 右键单击 - 获取地理坐标
   *
   * scene.pickPosition(position)
   * ------------------------------------------
   * 获取窗口坐标处精确的世界坐标（考虑地形高程）。
   * 如果没有命中任何对象，返回 undefined。
   *
   * globe.pick(ray, scene)
   * ------------------------------------------
   * 从相机发射射线与地形求交，获取地形上的坐标。
   * 适用于"获取鼠标在地形上的位置"这种场景。
   */
  handler.setInputAction((movement) => {
    // 方式 1：pickPosition（精确拾取，需要命中对象）
    const cartesian = scene.pickPosition(movement.position)

    if (Cesium.defined(cartesian)) {
      // 笛卡尔坐标 → 弧度制经纬高
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      const lng = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)
      const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)
      const alt = cartographic.height.toFixed(2)
      addLog(`右键位置: ${lng}°, ${lat}°, ${alt}m`)
    } else {
      // 方式 2：globe.pick（射线与地形求交）
      const ray = viewer.value.camera.getPickRay(movement.position)
      const globePosition = scene.globe.pick(ray, scene)

      if (Cesium.defined(globePosition)) {
        const cartographic = Cesium.Cartographic.fromCartesian(globePosition)
        const lng = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)
        const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)
        const alt = cartographic.height.toFixed(2)
        addLog(`右键地形: ${lng}°, ${lat}°, ${alt}m`)
      } else {
        addLog('右键点击: 未命中地形')
      }
    }
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

  /**
   * 左键双击 - 穿透拾取
   *
   * scene.drillPick(position)
   * ------------------------------------------
   * 穿透拾取：返回窗口坐标处所有层级的对象。
   * 当多个对象重叠时，可以获取所有被遮挡的对象。
   * 返回数组：[Entity | Primitive, ...]
   */
  handler.setInputAction((movement) => {
    const pickedObjects = scene.drillPick(movement.position)
    const names = pickedObjects.map(obj => {
      if (obj.id instanceof Cesium.Entity) return obj.id.name || 'Entity'
      return obj.id || 'Primitive'
    })
    addLog(`双击穿透拾取: [${names.join(', ')}]`)
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

  /**
   * 鼠标移动 - 悬停高亮
   *
   * MOUSE_MOVE 事件的回调参数：
   * { startPosition: Cartesian2, endPosition: Cartesian2 }
   * - startPosition: 移动起始位置
   * - endPosition: 移动结束位置（当前位置）
   */
  handler.setInputAction((movement) => {
    const picked = scene.pick(movement.endPosition)
    if (Cesium.defined(picked)) {
      // 改变鼠标样式
      scene.canvas.style.cursor = 'pointer'
    } else {
      scene.canvas.style.cursor = 'default'
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  /**
   * 滚轮事件
   *
   * WHEEL 事件的回调参数：
   * { delta: number }
   * - delta > 0: 向上滚动（放大）
   * - delta < 0: 向下滚动（缩小）
   */
  handler.setInputAction((wheelMovement) => {
    const direction = wheelMovement.delta > 0 ? '放大 ↑' : '缩小 ↓'
    addLog(`滚轮: ${direction}`)
  }, Cesium.ScreenSpaceEventType.WHEEL)

  /**
   * ==========================================
   * 场景事件（Scene Events）
   * ==========================================
   *
   * scene.mousedown     - 鼠标按下
   * scene.mouseUp       - 鼠标抬起
   * scene.mouseMove     - 鼠标移动
   * scene.preRender     - 渲染前
   * scene.postRender    - 渲染后
   * scene.preUpdate     - 更新前
   * scene.postUpdate    - 更新后
   *
   * 这些事件使用 addEventListener / removeEventListener 模式
   */

  // 监听场景渲染事件
  scene.postRender.addEventListener(() => {
    // 每帧渲染后执行，可用于逐帧更新
    // 注意性能：此回调每帧都会触发
  })

  /**
   * ==========================================
   * Viewer 事件
   * ==========================================
   *
   * viewer.selectedEntityChanged       - 选中实体变化
   * viewer.trackedEntityChanged        - 跟踪实体变化
   * viewer.clock.tick                  - 时钟每帧更新
   * viewer.dataSources.dataSourceAdded - 数据源添加
   * viewer.dataSources.dataSourceRemoved - 数据源移除
   * viewer.imageryLayers.layerAdded    - 影像图层添加
   * viewer.imageryLayers.layerRemoved  - 影像图层移除
   */

  viewer.value.selectedEntityChanged.addEventListener((entity) => {
    if (entity) {
      addLog(`选中实体: "${entity.name}"`)
    } else {
      addLog('取消选中')
    }
  })

  /**
   * ==========================================
   * Entity 鼠标事件（通过 Entity 属性）
   * ==========================================
   *
   * 除了 ScreenSpaceEventHandler，还可以直接在 Entity 上设置鼠标事件：
   *
   * entity.point.color = new Cesium.CallbackProperty(...)
   *
   * 但更常见的方式是在 handler 中判断 pick 结果：
   * 在 LEFT_CLICK 中判断 picked.id 是否是目标 Entity
   */
}

onBeforeUnmount(() => {
  // 销毁事件处理器
  if (handler && !handler.isDestroyed()) {
    handler.destroy()
    handler = null
  }

  if (viewer.value && !viewer.value.isDestroyed()) {
    viewer.value.destroy()
    viewer.value = null
  }
})
</script>

<style scoped>
.demo-container {
  width: 100%;
  height: 100%;
  display: flex;
}

.info-panel {
  width: 340px;
  min-width: 340px;
  padding: 20px;
  background: #f5f7fa;
  overflow-y: auto;
  border-right: 1px solid #e4e7ed;
}

.info-panel h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.info-panel h4 {
  font-size: 13px;
  color: #606266;
  margin: 12px 0 8px;
}

.info-panel p {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
}

.event-log {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  font-size: 11px;
  font-family: 'Consolas', monospace;
  color: #a8e6cf;
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.clear-btn {
  margin-top: 8px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.api-info {
  margin-top: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
}

.cesium-container {
  flex: 1;
  height: 100%;
}
</style>
