<template>
  <!--
    ==========================================
    EntityDemo.vue - Entity 实体系统详解
    ==========================================
    Entity 是 Cesium 的高层 API，用于在地球上添加可视化对象。
    相比 Primitive（底层 API），Entity 更易用，但性能稍差。

    本组件演示：
    1. Point   - 点实体
    2. Label   - 文字标签
    3. Billboard - 图标标注
    4. Polyline  - 线实体
    5. Polygon   - 面实体
    6. Model     - 3D 模型
    ==========================================
  -->
  <div class="demo-container">
    <div class="info-panel">
      <h3>3. Entity 实体系统</h3>
      <p>Entity 是 Cesium 的高层数据驱动可视化 API。每个 Entity 代表地球上的一个可视化对象。</p>

      <div class="btn-group">
        <h4>添加实体</h4>
        <button @click="addPoint">添加 Point 点</button>
        <button @click="addLabel">添加 Label 标签</button>
        <button @click="addBillboard">添加 Billboard 图标</button>
        <button @click="addPolyline">添加 Polyline 线</button>
        <button @click="addPolygon">添加 Polygon 面</button>
        <button @click="addModel">添加 3D 模型</button>
      </div>

      <div class="btn-group">
        <h4>实体操作</h4>
        <button @click="removeAll">清除所有实体</button>
        <button @click="toggleVisibility">切换显示/隐藏</button>
      </div>

      <div class="entity-list">
        <h4>当前实体列表 ({{ entityCount }})</h4>
        <div v-for="name in entityNames" :key="name" class="entity-tag">
          {{ name }}
        </div>
      </div>
    </div>
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<script setup>
/**
 * ==========================================
 * Entity 实体系统 - 核心 API
 * ==========================================
 *
 * Entity vs Primitive：
 * ------------------------------------------
 * | 特性       | Entity（高层）        | Primitive（底层）       |
 * |-----------|----------------------|----------------------|
 * | 易用性     | 简单，声明式          | 复杂，需要手动管理      |
 * | 性能       | 较低（自动管理）       | 较高（批量渲染）        |
 * | 数据绑定   | 支持 Property 动态绑定 | 不支持                |
 * | 适用场景   | 少量动态对象          | 大量静态对象           |
 * | 样式       | 丰富、灵活            | 需要自定义着色器        |
 *
 * Entity 的创建方式：
 * ------------------------------------------
 * // 方式 1：viewer.entities.add(options)
 * viewer.entities.add({ name: 'xxx', position: ..., point: { ... } })
 *
 * // 方式 2：new Cesium.Entity(options) 然后手动添加
 * const entity = new Cesium.Entity({ ... })
 * viewer.entities.add(entity)
 *
 * Entity 通用属性：
 * ------------------------------------------
 * id          : string     唯一标识符
 * name        : string     显示名称（信息框标题）
 * show        : boolean    是否显示
 * position    : Cartesian3 位置
 * orientation : Quaternion 朝向
 * description : string     描述信息（信息框内容，支持 HTML）
 * properties  : PropertyBag 自定义属性
 * ==========================================
 */
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as Cesium from 'cesium'

const cesiumContainer = ref(null)
const viewer = shallowRef(null)
const entities = ref([])  // 记录已创建的实体，方便管理
const visible = ref(true)

const entityCount = computed(() => entities.value.length)
const entityNames = computed(() => entities.value.map(e => e.name || e.id))

onMounted(() => {
  viewer.value = new Cesium.Viewer(cesiumContainer.value, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: true,
    sceneModePicker: false,
    selectionIndicator: true,
    timeline: false,
    navigationHelpButton: false
  })

  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 8000000),
    duration: 0
  })
})

/**
 * ==========================================
 * Point 点实体
 * ==========================================
 *
 * viewer.entities.add({
 *   position: Cartesian3,     // 位置（必须）
 *   point: {
 *     pixelSize        : number   点的大小（像素）
 *     color            : Color    点的颜色
 *     outlineColor     : Color    边框颜色
 *     outlineWidth     : number   边框宽度（像素）
 *     disableDepthTestDistance : number  禁用深度测试的距离
 *   }
 * })
 *
 * 注意：
 * - pixelSize 是屏幕空间大小，不会因缩放而改变
 * - disableDepthTestDistance = Number.POSITIVE_INFINITY 可以让点始终在地形上方可见
 */
function addPoint() {
  const entity = viewer.value.entities.add({
    name: 'Point 点',
    position: Cesium.Cartesian3.fromDegrees(116.39, 39.91, 100),
    description: '这是一个点实体 (Point)',
    point: {
      pixelSize: 12,                    // 像素大小
      color: Cesium.Color.RED,          // 填充颜色
      outlineColor: Cesium.Color.WHITE, // 边框颜色
      outlineWidth: 2,                  // 边框宽度
      // 禁用深度测试：点始终可见，不会被地形遮挡
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  })
  entities.value.push(entity)
}

/**
 * ==========================================
 * Label 文字标签
 * ==========================================
 *
 * viewer.entities.add({
 *   position: Cartesian3,
 *   label: {
 *     text              : string    显示文字
 *     font              : string    字体（CSS 格式）
 *     fillColor         : Color     文字颜色
 *     outlineColor      : Color     描边颜色
 *     outlineWidth      : number    描边宽度
 *     style             : LabelStyle 文字样式（填充/描边/填充+描边）
 *     pixelOffset       : Cartesian2 像素偏移量
 *     horizontalOrigin  : HorizontalOrigin 水平对齐
 *     verticalOrigin    : VerticalOrigin   垂直对齐
 *     scale             : number    缩放比例
 *     showBackground    : boolean   是否显示背景框
 *     distanceDisplayCondition : DistanceDisplayCondition 按距离显示/隐藏
 *   }
 * })
 */
function addLabel() {
  const entity = viewer.value.entities.add({
    name: 'Label 标签',
    position: Cesium.Cartesian3.fromDegrees(121.47, 31.23, 0),
    label: {
      text: '上海',
      font: '20px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,  // 同时填充和描边
      pixelOffset: new Cesium.Cartesian2(0, -30), // 向上偏移 30px
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  })
  entities.value.push(entity)
}

/**
 * ==========================================
 * Billboard 图标标注
 * ==========================================
 *
 * viewer.entities.add({
 *   position: Cartesian3,
 *   billboard: {
 *     image             : string|Canvas  图片路径或 Canvas 元素
 *     scale             : number         缩放比例
 *     pixelOffset       : Cartesian2     像素偏移
 *     color             : Color          颜色叠加（可以调色）
 *     rotation          : number         旋转角度（弧度）
 *     alignedAxis       : Cartesian3     旋转轴
 *     horizontalOrigin  : HorizontalOrigin
 *     verticalOrigin    : VerticalOrigin
 *     width             : number         宽度（像素）
 *     height            : number         高度（像素）
 *     sizeInMeters      : boolean        是否以米为单位（而非像素）
 *   }
 * })
 */
function addBillboard() {
  const entity = viewer.value.entities.add({
    name: 'Billboard 图标',
    position: Cesium.Cartesian3.fromDegrees(113.26, 23.13, 0),
    description: '广州 - 图标标注',
    billboard: {
      // 使用 Cesium 内置的图标（也可以用自己的图片 URL）
      image: '../images/facility.png',  // 如果图片不存在会显示默认图标
      scale: 1.5,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  })
  entities.value.push(entity)
}

/**
 * ==========================================
 * Polyline 线实体
 * ==========================================
 *
 * viewer.entities.add({
 *   polyline: {
 *     positions   : Cartesian3[]   顶点坐标数组（必须）
 *     width       : number         线宽（像素）
 *     material    : Material       材质（颜色/图片/条纹等）
 *     clampToGround : boolean      是否贴地
 *     arcType     : ArcType        弧线类型（直线/大圆弧）
 *   }
 * })
 *
 * positions 的几种写法：
 * ------------------------------------------
 * // 1. 笛卡尔坐标数组
 * [Cartesian3.fromDegrees(...), Cartesian3.fromDegrees(...)]
 *
 * // 2. 经度纬度数组（CallbackProperty 中使用）
 * Cesium.Cartesian3.fromDegreesArray([lng1, lat1, lng2, lat2, ...])
 *
 * // 3. 带高度的经度纬度数组
 * Cesium.Cartesian3.fromDegreesArrayHeights([lng, lat, h, lng, lat, h, ...])
 */
function addPolyline() {
  const entity = viewer.value.entities.add({
    name: 'Polyline 线',
    description: '北京 → 上海 连线',
    polyline: {
      // 北京 → 上海 的连线
      positions: Cesium.Cartesian3.fromDegreesArray([
        116.39, 39.91,   // 北京
        121.47, 31.23    // 上海
      ]),
      width: 3,
      // 材质：可以是纯色、渐变、条纹、图片等
      material: Cesium.Color.CYAN,
      clampToGround: true  // 贴地显示
    }
  })
  entities.value.push(entity)
}

/**
 * ==========================================
 * Polygon 面实体
 * ==========================================
 *
 * viewer.entities.add({
 *   polygon: {
 *     hierarchy       : PolygonHierarchy  多边形顶点（必须）
 *     height          : number            高度（米，0=贴地）
 *     extrudedHeight  : number            拉伸高度（形成 3D 体）
 *     material        : Material          填充材质
 *     outline         : boolean           是否显示边框
 *     outlineColor    : Color             边框颜色
 *     outlineWidth    : number            边框宽度
 *     perPositionHeight : boolean         每个顶点使用自己的高度
 *   }
 * })
 *
 * PolygonHierarchy：
 * - positions : Cartesian3[]  外环顶点
 * - holes     : PolygonHierarchy[]  内部孔洞（可选）
 */
function addPolygon() {
  const entity = viewer.value.entities.add({
    name: 'Polygon 面',
    description: '一个半透明多边形区域',
    polygon: {
      // hierarchy 定义多边形的顶点
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        95.0, 30.0,
        105.0, 30.0,
        105.0, 40.0,
        95.0, 40.0
      ]),
      height: 0,                    // 贴地
      extrudedHeight: 500000,       // 拉伸 500km 高，形成 3D 体
      material: Cesium.Color.BLUE.withAlpha(0.5),  // 半透明蓝色
      outline: true,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2
    }
  })
  entities.value.push(entity)

  // 飞到多边形位置查看
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(100.0, 35.0, 5000000),
    duration: 2
  })
}

/**
 * ==========================================
 * Model 3D 模型
 * ==========================================
 *
 * viewer.entities.add({
 *   position: Cartesian3,
 *   orientation: Quaternion,    // 模型朝向
 *   model: {
 *     uri               : string   glTF/glb 模型文件路径
 *     scale             : number   缩放比例
 *     minimumPixelSize  : number   最小像素大小
 *     maximumScale      : number   最大缩放
 *     color             : Color    颜色叠加
 *     colorBlendMode    : ColorBlendMode  颜色混合模式
 *     silhouetteColor   : Color    轮廓线颜色
 *     silhouetteSize    : number   轮廓线宽度
 *     runAnimations     : boolean  是否播放模型内置动画
 *   }
 * })
 *
 * 注意：
 * - 支持 glTF 2.0 格式（.gltf 或 .glb）
 * - 需要一个真实的模型文件 URL 才能显示
 * - orientation 使用四元数（Quaternion）表示旋转
 */
function addModel() {
  // 使用 Cesium 官方示例模型
  const entity = viewer.value.entities.add({
    name: '3D Model 模型',
    description: '一架飞机 3D 模型',
    position: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 5000),
    // 模型朝向：使用 HeadingPitchRoll 转四元数
    orientation: Cesium.Transforms.headingPitchRollQuaternion(
      Cesium.Cartesian3.fromDegrees(104.0, 35.0, 5000),
      new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(90),  // heading
        0,                           // pitch
        0                            // roll
      )
    ),
    model: {
      uri: 'https://cesium.com/sample-assets/samples/Cesium_Air.glb',
      scale: 50,
      minimumPixelSize: 64,
      maximumScale: 200,
      silhouetteColor: Cesium.Color.CYAN,
      silhouetteSize: 2
    }
  })
  entities.value.push(entity)

  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 20000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0
    },
    duration: 2
  })
}

/**
 * ==========================================
 * 实体管理操作
 * ==========================================
 */

/**
 * 清除所有实体
 *
 * viewer.entities.removeAll()
 * ------------------------------------------
 * 一次性移除所有实体。
 * 也可以用 viewer.entities.remove(entity) 移除单个实体
 * 或者 entity.show = false 隐藏（不移除）
 */
function removeAll() {
  viewer.value.entities.removeAll()
  entities.value = []
}

/**
 * 切换所有实体的显示/隐藏
 *
 * entity.show = boolean
 * ------------------------------------------
 * 设置 show 属性可以控制实体的可见性。
 * 隐藏的实体不会被渲染，但仍然存在于 entities 集合中。
 */
function toggleVisibility() {
  visible.value = !visible.value
  entities.value.forEach(entity => {
    entity.show = visible.value
  })
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

.entity-list {
  margin-top: 16px;
}

.entity-tag {
  display: inline-block;
  padding: 4px 10px;
  margin: 2px 4px 2px 0;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 3px;
  font-size: 12px;
}

.cesium-container {
  flex: 1;
  height: 100%;
}
</style>
