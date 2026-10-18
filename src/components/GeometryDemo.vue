<template>
  <!--
    ==========================================
    GeometryDemo.vue - 几何图形与 Primitive
    ==========================================
    Primitive 是 Cesium 的底层渲染 API。
    相比 Entity，Primitive 性能更好，适合大量图形。

    本组件演示：
    1. 各种 Geometry（矩形、圆形、墙、多边形等）
    2. Appearance（外观/材质）
    3. Primitive 的创建与使用
    ==========================================
  -->
  <div class="demo-container">
    <div class="info-panel">
      <h3>5. 几何图形 & Primitive</h3>
      <p>Primitive 是 Cesium 底层渲染 API，性能优于 Entity，适合大量静态图形。</p>

      <div class="btn-group">
        <button @click="addRectangle">矩形 Rectangle</button>
        <button @click="addCircle">圆形 Circle</button>
        <button @click="addWall">墙体 Wall</button>
        <button @click="addCorridor">走廊 Corridor</button>
        <button @click="addCylinder">圆柱 Cylinder</button>
        <button @click="addEllipsoid">椭球 Ellipsoid</button>
        <button @click="addBox">长方体 Box</button>
        <button @click="removeAll">清除所有</button>
      </div>

      <div class="api-info">
        <h4>Entity vs Primitive 对比</h4>
        <p><strong>Entity：</strong>声明式，数据驱动，支持动态属性，适合少量动态对象</p>
        <p><strong>Primitive：</strong>命令式，直接操作几何体，适合大量静态对象</p>
      </div>
    </div>
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<script setup>
/**
 * ==========================================
 * Geometry & Primitive - 核心 API
 * ==========================================
 *
 * Primitive 体系结构：
 * ------------------------------------------
 * Geometry（几何体）  →  定义形状和顶点
 *     ↓
 * Appearance（外观）  →  定义着色器/材质
 *     ↓
 * Primitive（图元）   →  组合 Geometry + Appearance
 *     ↓
 * scene.primitives.add(primitive)  →  添加到场景
 *
 * 但更常用的是"几何体图形"（GeometryInstance + Primitive）：
 * ------------------------------------------
 * new Cesium.Primitive({
 *   geometryInstances : GeometryInstance | GeometryInstance[]  几何实例
 *   appearance        : Appearance                             外观
 *   asynchronous      : boolean                                异步创建（默认 true）
 * })
 *
 * GeometryInstance 包装了一个 Geometry，并可以指定：
 * - id       : 任意值，用于标识和拾取
 * - geometry : Geometry 对象
 * - modelMatrix : Matrix4 变换矩阵
 * - attributes  : 逐顶点属性（颜色等）
 *
 * 常用 Geometry 类型：
 * ------------------------------------------
 * RectangleGeometry       矩形
 * CircleGeometry          圆形
 * EllipseGeometry         椭圆
 * PolygonGeometry         多边形
 * PolylineGeometry        折线
 * WallGeometry            墙体
 * CorridorGeometry        走廊（沿路径的面）
 * CylinderGeometry        圆柱
 * EllipsoidGeometry       椭球
 * BoxGeometry             长方体
 * SphereGeometry          球体
 * SimplePolylineGeometry  简单折线（无宽度）
 *
 * 常用 Appearance 类型：
 * ------------------------------------------
 * MaterialAppearance   材质外观（最灵活）
 * PerInstanceColorAppearance  逐实例颜色（性能好）
 * PolylineMaterialAppearance  折线材质
 * EllipsoidSurfaceAppearance   椭球表面
 */
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as Cesium from 'cesium'

const cesiumContainer = ref(null)
const viewer = shallowRef(null)
const primitives = []

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
})

/**
 * 矩形 Rectangle
 *
 * RectangleGeometry：
 * - rectangle : Rectangle  矩形范围（西南角到东北角）
 * - height    : number     高度
 */
function addRectangle() {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromDegrees(100.0, 30.0, 110.0, 40.0),
      height: 0
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.RED.withAlpha(0.5)
      )
    }
  })

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,       // 无光照
      translucent: true  // 半透明
    })
  })

  viewer.value.scene.primitives.add(primitive)
  primitives.push(primitive)
}

/**
 * 圆形 Circle
 *
 * CircleGeometry：
 * - center : Cartesian3  圆心坐标
 * - radius : number      半径（米）
 */
function addCircle() {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.CircleGeometry({
      center: Cesium.Cartesian3.fromDegrees(110.0, 35.0),
      radius: 300000  // 半径 300km
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.GREEN.withAlpha(0.5)
      )
    }
  })

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true
    })
  })

  viewer.value.scene.primitives.add(primitive)
  primitives.push(primitive)
}

/**
 * 墙体 Wall
 *
 * WallGeometry：
 * - positions       : Cartesian3[]  底部顶点
 * - maximumHeights  : number[]      每个顶点的高度
 * - minimumHeights  : number[]      每个顶点的最低高度
 */
function addWall() {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.WallGeometry({
      positions: Cesium.Cartesian3.fromDegreesArray([
        98.0, 28.0,
        108.0, 28.0,
        108.0, 38.0,
        98.0, 38.0
      ]),
      maximumHeight: 500000,  // 墙高 500km
      minimumHeight: 0
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.YELLOW.withAlpha(0.5)
      )
    }
  })

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true
    })
  })

  viewer.value.scene.primitives.add(primitive)
  primitives.push(primitive)
}

/**
 * 走廊 Corridor
 *
 * CorridorGeometry：沿路径生成的带状面
 * - positions : Cartesian3[]  路径顶点
 * - width     : number        走廊宽度（米）
 */
function addCorridor() {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.CorridorGeometry({
      positions: Cesium.Cartesian3.fromDegreesArray([
        90.0, 25.0,
        100.0, 30.0,
        110.0, 35.0,
        120.0, 40.0
      ]),
      width: 200000,  // 宽 200km
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.PURPLE.withAlpha(0.5)
      )
    }
  })

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true
    })
  })

  viewer.value.scene.primitives.add(primitive)
  primitives.push(primitive)
}

/**
 * 圆柱 Cylinder
 */
function addCylinder() {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.CylinderGeometry({
      center: Cesium.Cartesian3.fromDegrees(115.0, 32.0, 500000),
      length: 1000000,    // 长度（米）
      topRadius: 200000,  // 顶部半径
      bottomRadius: 200000 // 底部半径
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.CYAN.withAlpha(0.5)
      )
    }
  })

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true
    })
  })

  viewer.value.scene.primitives.add(primitive)
  primitives.push(primitive)
}

/**
 * 椭球 Ellipsoid
 */
function addEllipsoid() {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.EllipsoidGeometry({
      center: Cesium.Cartesian3.fromDegrees(105.0, 25.0, 1000000),
      radii: new Cesium.Cartesian3(300000, 300000, 500000)  // 三轴半径
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.ORANGE.withAlpha(0.5)
      )
    }
  })

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true
    })
  })

  viewer.value.scene.primitives.add(primitive)
  primitives.push(primitive)
}

/**
 * 长方体 Box
 */
function addBox() {
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.BoxGeometry({
      center: Cesium.Cartesian3.fromDegrees(100.0, 35.0, 1000000),
      dimensions: new Cesium.Cartesian3(500000, 500000, 800000)  // 三轴尺寸
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.PINK.withAlpha(0.5)
      )
    }
  })

  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: true
    })
  })

  viewer.value.scene.primitives.add(primitive)
  primitives.push(primitive)
}

function removeAll() {
  primitives.forEach(p => {
    if (!p.isDestroyed()) {
      viewer.value.scene.primitives.remove(p)
    }
  })
  primitives.length = 0
}

onBeforeUnmount(() => {
  removeAll()
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
