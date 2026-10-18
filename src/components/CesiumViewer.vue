<template>
  <!--
    ==========================================
    CesiumViewer.vue - Viewer 初始化详解
    ==========================================
    这是 Cesium 最核心的组件，演示如何：
    1. 创建 Viewer 实例（Cesium 的入口对象）
    2. 配置基础参数
    3. 理解 Viewer 的组成结构
    ==========================================
  -->
  <div class="demo-container">
    <div class="info-panel">
      <h3>1. Viewer 初始化</h3>
      <p>Viewer 是 Cesium 的核心类，它封装了三维地球场景所需的一切：场景、相机、时钟、地形、图层等。</p>
      <div class="api-list">
        <div class="api-item">
          <code>new Cesium.Viewer(container, options)</code>
          <span>创建地球实例</span>
        </div>
        <div class="api-item">
          <code>viewer.scene</code>
          <span>场景对象，管理 3D 内容</span>
        </div>
        <div class="api-item">
          <code>viewer.camera</code>
          <span>相机对象，控制视角</span>
        </div>
        <div class="api-item">
          <code>viewer.clock</code>
          <span>时钟对象，控制时间动画</span>
        </div>
        <div class="api-item">
          <code>viewer.entities</code>
          <span>实体集合，管理标注/图形</span>
        </div>
        <div class="api-item">
          <code>viewer.imageryLayers</code>
          <span>影像图层集合</span>
        </div>
        <div class="api-item">
          <code>viewer.terrainProvider</code>
          <span>地形提供者</span>
        </div>
        <div class="api-item">
          <code>viewer.destroy()</code>
          <span>销毁实例，释放资源</span>
        </div>
      </div>
    </div>
    <!-- Cesium 容器：Viewer 会挂载到这个 div 上 -->
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<script setup>
/**
 * ==========================================
 * Viewer 初始化 - 核心代码
 * ==========================================
 *
 * Cesium 的 Viewer 类是整个引擎的入口点。
 * 一个 Viewer 实例包含了一个完整的三维地球应用所需的所有子系统。
 *
 * 关键概念：
 * - Scene（场景）：管理所有 3D 对象的渲染
 * - Camera（相机）：定义观察视角
 * - Clock（时钟）：驱动时间动态变化
 * - Entity（实体）：高层 API，用于添加标注、图形等
 * - Primitive（图元）：底层 API，性能更好但使用更复杂
 * - ImageryLayer（影像图层）：地球表面的卫星影像贴图
 * - TerrainProvider（地形提供者）：地球表面的高程数据
 * ==========================================
 */
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as Cesium from 'cesium'

// 模板引用：获取 DOM 容器元素
const cesiumContainer = ref(null)

// 使用 shallowRef 存储 Viewer 实例
// 原因：Viewer 是一个极其复杂的对象，包含大量内部状态
// 如果用 ref()，Vue 会尝试深度代理所有属性，导致严重性能问题
const viewer = shallowRef(null)

/**
 * 初始化 Cesium Viewer
 *
 * new Cesium.Viewer(container, options)
 * ------------------------------------------
 * @param {string|Element} container - DOM 容器，可以是元素 ID 或 DOM 元素本身
 * @param {Object} options - 配置选项
 *
 * 常用 options 参数详解：
 * ------------------------------------------
 * animation            : boolean  - 是否显示左下角动画控件（播放/暂停/速度控制）
 * baseLayerPicker      : boolean  - 是否显示右上角底图选择器
 * fullscreenButton     : boolean  - 是否显示全屏按钮
 * vrButton             : boolean  - 是否显示 VR 按钮
 * geocoder             : boolean  - 是否显示搜索栏（地名搜索定位）
 * homeButton           : boolean  - 是否显示首页按钮（回到默认视角）
 * infoBox              : boolean  - 是否显示信息框（点击实体后弹出的详情面板）
 * sceneModePicker      : boolean  - 是否显示场景模式切换器（2D/3D/哥伦布视图）
 * selectionIndicator   : boolean  - 是否显示选中指示器（选中实体时的高亮标记）
 * timeline             : boolean  - 是否显示底部时间轴
 * navigationHelpButton : boolean  - 是否显示导航帮助按钮（问号图标）
 * creditContainer      : string   - 版权信息的容器（可以隐藏底部 Cesium logo）
 * shouldAnimate        : boolean  - 是否自动播放动画
 * terrainProvider      : TerrainProvider - 地形数据提供者
 * imageryProvider      : ImageryProvider - 影像图层提供者（已废弃，推荐用 baseLayers）
 * requestRenderMode    : boolean  - 请求渲染模式（仅在需要时渲染，节省 GPU 资源）
 */
onMounted(() => {
  viewer.value = new Cesium.Viewer(cesiumContainer.value, {
    // ---- UI 控件配置 ----
    // 学习阶段可以全部设为 true 来了解各控件的作用
    // 生产环境通常只保留必要的控件
    animation: true,            // 左下角动画控件
    baseLayerPicker: true,      // 右上角底图选择器
    fullscreenButton: true,     // 全屏按钮
    vrButton: false,            // VR 按钮（一般不需要）
    geocoder: true,             // 搜索栏（支持地名搜索）
    homeButton: true,           // 首页按钮
    infoBox: true,              // 信息框
    sceneModePicker: true,      // 2D/3D 切换
    selectionIndicator: true,   // 选中指示器
    timeline: true,             // 底部时间轴
    navigationHelpButton: true, // 导航帮助

    // ---- 渲染配置 ----
    shouldAnimate: true,        // 自动播放时钟动画
    requestRenderMode: false,   // false = 持续渲染；true = 按需渲染（静态场景推荐 true）

    // ---- 地形配置 ----
    // Cesium Ion 默认地形：全球高程数据（需要默认 token）
    // 也可以替换为自定义地形服务
    // terrainProvider: await Cesium.CesiumTerrainProvider.fromUrl(...)

    // ---- 隐藏版权信息（可选）----
    // 如果不需要显示 Cesium 的 logo，可以隐藏
    // creditContainer: document.createElement('div')
  })

  /**
   * Viewer 创建后的常用操作
   */

  // 1. 设置初始视角 - 飞到中国上空
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 8000000),
    // fromDegrees(经度, 纬度, 高度) - 经度纬度是角度制，高度单位是米
    duration: 2 // 飞行时间（秒）
  })

  // 2. 访问 Scene 对象
  // scene 控制了整个三维场景的渲染
  const scene = viewer.value.scene
  console.log('Scene 对象:', scene)

  // 3. 场景常用属性
  // scene.globe           - 地球对象，控制地球外观
  // scene.skyBox          - 天空盒（星空背景）
  // scene.sun             - 太阳
  // scene.moon            - 月亮
  // scene.fog             - 雾效
  // scene.backgroundColor - 场景背景色

  // 4. 开启深度测试（防止地形上的对象被遮挡时仍然可见）
  scene.globe.depthTestAgainstTerrain = true

  // 5. 设置地球背景色（当没有影像时的颜色）
  scene.backgroundColor = Cesium.Color.BLACK

  // 6. 访问 Clock 时钟对象
  // clock 控制时间流逝，驱动动画和数据的时间动态变化
  const clock = viewer.value.clock
  console.log('Clock 对象:', clock)
  // clock.currentTime  - 当前时间（JulianDate 儒略日格式）
  // clock.startTime    - 起始时间
  // clock.stopTime     - 结束时间
  // clock.multiplier   - 时间倍率（1=实时，60=60倍速）
  // clock.clockStep    - 时钟步进模式

  // 7. 访问 Entities 实体集合
  // entities 是一个 EntityCollection，用于管理所有添加到地球上的实体
  const entities = viewer.value.entities
  console.log('Entities 集合:', entities)

  // 8. 访问 ImageryLayers 影像图层集合
  // imageryLayers 管理地球表面的所有影像图层（可以叠加多层）
  const imageryLayers = viewer.value.imageryLayers
  console.log('影像图层数量:', imageryLayers.length)

  // 9. Viewer 事件监听
  // viewer 提供了多种事件，用于响应用户交互和渲染状态变化

  // selectedEntityChanged - 选中实体变化时触发
  viewer.value.selectedEntityChanged.addEventListener((entity) => {
    if (entity) {
      console.log('选中了实体:', entity.name || entity.id)
    }
  })

  // clock.onTick - 每帧时钟更新时触发（类似 requestAnimationFrame）
  viewer.value.clock.onTick.addEventListener(() => {
    // 这里可以更新随时间变化的数据
    // 注意：此回调每帧都会执行，避免在其中做耗时操作
  })

  // scene.postRender - 场景每帧渲染完成后触发
  viewer.value.scene.postRender.addEventListener(() => {
    // 可以在这里做逐帧更新
  })
})

/**
 * 组件卸载时销毁 Viewer
 *
 * viewer.destroy()
 * ------------------------------------------
 * 必须手动调用 destroy() 来释放 WebGL 资源、
 * 移除事件监听、清理 DOM。
 * 否则会导致内存泄漏。
 *
 * 在 Vue 中，通常在 onBeforeUnmount 或 onUnmounted 中调用
 */
onBeforeUnmount(() => {
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
  margin-bottom: 12px;
}

.info-panel p {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.api-item code {
  font-size: 12px;
  color: #409eff;
  font-family: 'Consolas', 'Monaco', monospace;
}

.api-item span {
  font-size: 12px;
  color: #909399;
}

.cesium-container {
  flex: 1;
  height: 100%;
}
</style>
