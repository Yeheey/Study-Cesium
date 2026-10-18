<template>
  <!--
    ==========================================
    CameraControl.vue - 相机控制详解
    ==========================================
    Cesium 的 Camera 类控制三维场景的观察视角。
    本组件演示各种相机操作方式：
    1. setView   - 瞬间设置视角（无动画）
    2. flyTo     - 平滑飞到目标位置（有动画）
    3. lookAt    - 围绕目标点旋转观察
    4. 相机位置获取与监听
    ==========================================
  -->
  <div class="demo-container">
    <div class="info-panel">
      <h3>2. 相机控制 Camera</h3>
      <p>Camera 定义了三维场景的观察视角，包含位置、方向、视锥体等属性。</p>

      <div class="btn-group">
        <h4>视角操作</h4>
        <button @click="flyToChina">flyTo - 飞到中国</button>
        <button @click="flyToBeijing">flyTo - 飞到北京</button>
        <button @click="setViewTopDown">setView - 俯视图</button>
        <button @click="setViewSide">setView - 侧视图</button>
        <button @click="lookAtDemo">lookAt - 环绕观察</button>
        <button @click="flyHome">flyHome - 回到默认</button>
      </div>

      <div class="btn-group">
        <h4>相机移动</h4>
        <button @click="zoomIn">zoomIn - 推近</button>
        <button @click="zoomOut">zoomOut - 拉远</button>
        <button @click="moveForward">moveForward - 前进</button>
        <button @click="moveBackward">moveBackward - 后退</button>
        <button @click="lookLeft">lookLeft - 左转</button>
        <button @click="lookRight">lookRight - 右转</button>
      </div>

      <div class="camera-info">
        <h4>实时相机信息</h4>
        <p>经度: {{ cameraInfo.longitude }}</p>
        <p>纬度: {{ cameraInfo.latitude }}</p>
        <p>高度: {{ cameraInfo.height }} m</p>
        <p>朝向: {{ cameraInfo.heading }}°</p>
        <p>俯仰: {{ cameraInfo.pitch }}°</p>
      </div>
    </div>
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<script setup>
/**
 * ==========================================
 * Camera 相机控制 - 核心 API
 * ==========================================
 *
 * Cesium.Camera 类
 * ------------------------------------------
 * 相机定义了场景的观察视角，由以下要素组成：
 * - position     : 相机在世界坐标中的位置（Cartesian3）
 * - direction    : 相机朝向的方向向量（单位向量）
 * - up           : 相机"上方"方向向量
 * - right        : 相机"右方"方向向量
 * - frustum      : 视锥体（定义可见范围，类似相机镜头）
 *
 * 坐标系说明：
 * Cesium 使用 WGS84 笛卡尔坐标系（ECEF），原点在地球质心
 * - X 轴指向本初子午线与赤道交点
 * - Y 轴指向东经 90° 与赤道交点
 * - Z 轴指向北极
 *
 * 常用坐标转换：
 * Cesium.Cartesian3.fromDegrees(lng, lat, alt)  → 经纬度转笛卡尔坐标
 * Cesium.Cartographic.fromCartesian(pos)         → 笛卡尔坐标转弧度制经纬高
 * Cesium.Math.toDegrees(radians)                 → 弧度转角度
 * Cesium.Math.toRadians(degrees)                 → 角度转弧度
 * ==========================================
 */
import { ref, reactive, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as Cesium from 'cesium'

const cesiumContainer = ref(null)
const viewer = shallowRef(null)

// 实时显示相机参数
const cameraInfo = reactive({
  longitude: '0.00',
  latitude: '0.00',
  height: '0',
  heading: '0.0',
  pitch: '0.0'
})

onMounted(() => {
  viewer.value = new Cesium.Viewer(cesiumContainer.value, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false
  })

  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 8000000),
    duration: 0
  })

  /**
   * 监听相机变化事件 - 获取实时位置
   *
   * camera.changed - 相机位置/方向发生显著变化时触发
   * ------------------------------------------
   * 默认变化阈值为 50%，可通过 camera.percentageChanged 调整
   * 如果需要每帧获取，使用 scene.postRender 事件
   */
  viewer.value.scene.postRender.addEventListener(() => {
    updateCameraInfo()
  })
})

/**
 * 更新相机信息到面板
 *
 * 相机位置获取 API：
 * ------------------------------------------
 * camera.position              - Cartesian3 世界坐标
 * camera.positionCartographic  - Cartographic 弧度制经纬高（内部缓存，性能更好）
 * camera.heading               - 朝向角（绕 Z 轴旋转，弧度）
 * camera.pitch                 - 俯仰角（绕 X 轴旋转，弧度）
 * camera.roll                  - 翻滚角（绕 Y 轴旋转，弧度）
 */
function updateCameraInfo() {
  if (!viewer.value || viewer.value.isDestroyed()) return

  const camera = viewer.value.camera

  // positionCartographic 返回 Cartographic 对象
  // longitude/latitude 是弧度制，需要转换为角度
  const cartographic = camera.positionCartographic
  if (!cartographic) return

  cameraInfo.longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)
  cameraInfo.latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)
  cameraInfo.height = cartographic.height.toFixed(0)
  cameraInfo.heading = Cesium.Math.toDegrees(camera.heading).toFixed(1)
  cameraInfo.pitch = Cesium.Math.toDegrees(camera.pitch).toFixed(1)
}

/**
 * ==========================================
 * flyTo - 平滑飞行到目标位置
 * ==========================================
 *
 * camera.flyTo(options)
 * ------------------------------------------
 * 以动画方式将相机飞到指定位置。
 *
 * options 参数：
 * - destination       : Cartesian3|Rectangle|Object  目标位置
 *                        可以是笛卡尔坐标、矩形区域、或 {position, direction, up} 对象
 * - orientation       : Object  相机姿态
 *   - heading         : number  朝向（弧度，0=正北，顺时针为正）
 *   - pitch           : number  俯仰（弧度，-π/2=正下方看，0=水平看）
 *   - roll            : number  翻滚（弧度，0=不翻滚）
 * - duration          : number  飞行持续时间（秒），默认根据距离自动计算
 * - complete          : Function  飞行完成回调
 * - cancel            : Function  飞行取消回调
 * - easingFunction    : Function  缓动函数（控制飞行速度曲线）
 *
 * destination 的几种写法：
 * ------------------------------------------
 * // 1. 经纬度 + 高度
 * Cesium.Cartesian3.fromDegrees(lng, lat, height)
 *
 * // 2. 矩形区域（会自动计算合适的视角）
 * Cesium.Rectangle.fromDegrees(west, south, east, north)
 *
 * // 3. 精确指定位置和方向
 * { position: Cartesian3, direction: Cartesian3, up: Cartesian3 }
 */
function flyToChina() {
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 8000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),    // 朝向正北
      pitch: Cesium.Math.toRadians(-90),     // 垂直向下看
      roll: 0                                 // 不翻滚
    },
    duration: 3,
    complete: () => console.log('飞行完成！')
  })
}

function flyToBeijing() {
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.39, 39.91, 15000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),     // 45° 斜向下看
      roll: 0
    },
    duration: 2
  })
}

/**
 * ==========================================
 * setView - 瞬间设置视角（无动画）
 * ==========================================
 *
 * camera.setView(options)
 * ------------------------------------------
 * 立即将相机设置到指定位置，没有过渡动画。
 * 参数与 flyTo 相同（destination + orientation），
 * 但没有 duration、complete 等动画相关参数。
 *
 * 适用场景：
 * - 初始化时需要立即定位到某个位置
 * - 不需要动画效果的视角切换
 * - 性能敏感场景（跳过动画计算）
 */
function setViewTopDown() {
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 10000000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),  // 垂直向下 = 俯视图
      roll: 0
    }
  })
}

function setViewSide() {
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 2000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(0),     // 水平看 = 侧视图
      roll: 0
    }
  })
}

/**
 * ==========================================
 * lookAt - 围绕目标点旋转观察
 * ==========================================
 *
 * camera.lookAt(target, offset)
 * ------------------------------------------
 * 将相机定位到目标点附近，从 offset 指定的偏移方向观察目标。
 *
 * @param target  : Cartesian3  目标点的世界坐标
 * @param offset  : Cartesian3|HeadingPitchRange  偏移量
 *
 * HeadingPitchRange 方式（推荐）：
 * - heading : 绕目标点的水平旋转角
 * - pitch   : 绕目标点的垂直旋转角
 * - range   : 相机到目标点的距离
 *
 * 适用场景：
 * - 围绕某个建筑物/地标旋转观察
 * - 固定观察某个目标
 */
function lookAtDemo() {
  // 目标点：北京的某个位置
  const target = Cesium.Cartesian3.fromDegrees(116.39, 39.91, 0)

  // 方式 1：使用 HeadingPitchRange（更直观）
  const offset = new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(45),   // 从东北方向看
    Cesium.Math.toRadians(-30),  // 从上方向下 30° 看
    50000                         // 距离 50km
  )

  viewer.value.camera.lookAt(target, offset)

  // 方式 2：使用 Cartesian3 偏移（更灵活但不够直观）
  // const offset = new Cesium.Cartesian3(30000, 30000, 50000)
  // viewer.value.camera.lookAt(target, offset)

  // 注意：lookAt 之后，鼠标操作会变成围绕目标点旋转
  // 如果要恢复自由视角，需要调用 lookAt 的逆操作或 flyTo
}

/**
 * flyHome - 回到默认视角
 *
 * camera.flyHome(duration)
 * ------------------------------------------
 * 飞回 Cesium 的默认初始视角
 * @param duration : number  飞行时间（秒）
 */
function flyHome() {
  // 先解除 lookAt 的约束
  viewer.value.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
  viewer.value.camera.flyHome(2)
}

/**
 * ==========================================
 * 相机移动 API
 * ==========================================
 *
 * 这些方法用于相对于相机当前位置进行微调：
 *
 * camera.move(direction, amount)    - 沿指定方向移动
 * camera.moveForward(amount)        - 沿相机朝向前进
 * camera.moveBackward(amount)       - 沿相机朝向后退
 * camera.moveUp(amount)             - 向上移动
 * camera.moveDown(amount)           - 向下移动
 * camera.moveLeft(amount)           - 向左移动
 * camera.moveRight(amount)          - 向右移动
 *
 * camera.look(axis, angle)          - 绕指定轴旋转相机朝向
 * camera.lookUp(angle)              - 向上看（增加 pitch）
 * camera.lookDown(angle)            - 向下看（减少 pitch）
 * camera.lookLeft(angle)            - 向左看（减少 heading）
 * camera.lookRight(angle)           - 向右看（增加 heading）
 *
 * camera.twistLeft(angle)           - 逆时针翻滚
 * camera.twistRight(angle)          - 顺时针翻滚
 *
 * camera.zoomIn(amount)             - 放大（推近）
 * camera.zoomOut(amount)            - 缩小（拉远）
 *
 * amount 单位是米（移动）或弧度（旋转）
 */
function zoomIn() {
  viewer.value.camera.zoomIn(viewer.value.camera.positionCartographic.height * 0.3)
}

function zoomOut() {
  viewer.value.camera.zoomOut(viewer.value.camera.positionCartographic.height * 0.5)
}

function moveForward() {
  viewer.value.camera.moveForward(100000)  // 前进 100km
}

function moveBackward() {
  viewer.value.camera.moveBackward(100000) // 后退 100km
}

function lookLeft() {
  viewer.value.camera.lookLeft(Cesium.Math.toRadians(10)) // 左转 10°
}

function lookRight() {
  viewer.value.camera.lookRight(Cesium.Math.toRadians(10)) // 右转 10°
}

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

.btn-group {
  margin-bottom: 12px;
}

.btn-group button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  color: #303133;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.btn-group button:hover {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.camera-info {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
}

.camera-info p {
  font-size: 12px;
  font-family: 'Consolas', monospace;
  margin-bottom: 4px;
}

.cesium-container {
  flex: 1;
  height: 100%;
}
</style>
