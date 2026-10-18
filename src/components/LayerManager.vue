<template>
  <!--
    ==========================================
    LayerManager.vue - 图层管理详解
    ==========================================
    Cesium 支持多种类型的图层叠加：
    1. 影像图层（ImageryLayer）- 卫星影像、地图瓦片
    2. 地形图层（Terrain）- 地球表面高程
    3. 3D Tiles - 大规模三维模型数据
    4. 数据源（DataSource）- GeoJSON、KML 等
    ==========================================
  -->
  <div class="demo-container">
    <div class="info-panel">
      <h3>4. 图层管理</h3>
      <p>Cesium 支持多种数据图层的叠加，包括影像、地形、3D Tiles 和矢量数据源。</p>

      <div class="btn-group">
        <h4>影像图层</h4>
        <button @click="addTianditu">天地图影像</button>
        <button @click="addArcgis">ArcGIS 影像</button>
        <button @click="addSingleTile">单张图片图层</button>
        <button @click="removeLastImagery">移除最后影像层</button>
      </div>

      <div class="btn-group">
        <h4>地形</h4>
        <button @click="setDefaultTerrain">默认地形（无高程）</button>
        <button @click="setCesiumTerrain">Cesium Ion 全球地形</button>
      </div>

      <div class="btn-group">
        <h4>3D Tiles</h4>
        <button @click="add3DTiles">加载 3D Tiles</button>
        <button @click="remove3DTiles">移除 3D Tiles</button>
      </div>

      <div class="btn-group">
        <h4>数据源</h4>
        <button @click="loadGeoJSON">加载 GeoJSON</button>
        <button @click="removeDataSources">移除数据源</button>
      </div>

      <div class="layer-info">
        <h4>当前图层信息</h4>
        <p>影像图层数: {{ imageryCount }}</p>
        <p>数据源数: {{ dataSourceCount }}</p>
        <p>3D Tiles: {{ has3DTiles ? '已加载' : '未加载' }}</p>
      </div>
    </div>
    <div ref="cesiumContainer" class="cesium-container"></div>
  </div>
</template>

<script setup>
/**
 * ==========================================
 * 图层管理 - 核心 API
 * ==========================================
 *
 * Cesium 的图层体系：
 * ------------------------------------------
 * 1. ImageryLayer（影像图层）
 *    - 地球表面的二维贴图
 *    - 支持多层叠加（类似 PS 的图层）
 *    - 由 ImageryProvider 提供数据
 *
 * 2. TerrainProvider（地形提供者）
 *    - 地球表面的高程数据
 *    - 同一时间只能有一个地形提供者
 *    - 决定地球的 3D 起伏
 *
 * 3. 3D Tiles
 *    - 大规模三维模型数据格式
 *    - 支持 LOD（多细节层次）
 *    - 适合城市建筑、点云等海量数据
 *
 * 4. DataSource（数据源）
 *    - 矢量数据加载（GeoJSON、KML、CZML）
 *    - 加载后自动转换为 Entity
 * ==========================================
 */
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as Cesium from 'cesium'

const cesiumContainer = ref(null)
const viewer = shallowRef(null)
const imageryCount = ref(0)
const dataSourceCount = ref(0)
const has3DTiles = ref(false)
let tileset = null

onMounted(() => {
  viewer.value = new Cesium.Viewer(cesiumContainer.value, {
    animation: false,
    baseLayerPicker: true,  // 开启底图选择器，可以看到内置的影像选项
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

  imageryCount.value = viewer.value.imageryLayers.length
  dataSourceCount.value = viewer.value.dataSources.length
})

/**
 * ==========================================
 * 影像图层（ImageryLayer）
 * ==========================================
 *
 * 添加影像图层的步骤：
 * 1. 创建 ImageryProvider（数据提供者）
 * 2. 用 viewer.imageryLayers.addImageryProvider(provider) 添加
 *
 * 常用 ImageryProvider 类型：
 * ------------------------------------------
 * UrlTemplateImageryProvider  - URL 模板（最灵活，支持自定义瓦片服务）
 * ArcGisMapServerImageryProvider - ArcGIS 服务
 * WebMapServiceImageryProvider   - WMS 服务
 * WebMapTileServiceImageryProvider - WMTS 服务
 * IonImageryProvider             - Cesium Ion 平台影像
 * SingleTileImageryProvider      - 单张图片
 * OpenStreetMapImageryProvider   - OSM 开源地图
 *
 * viewer.imageryLayers 常用方法：
 * ------------------------------------------
 * addImageryProvider(provider, index)  - 添加图层
 * remove(layer)                        - 移除指定图层
 * removeAll()                          - 移除所有图层
 * get(index)                           - 获取指定索引的图层
 * length                               - 图层数量
 *
 * 单个 ImageryLayer 的属性：
 * ------------------------------------------
 * alpha       : number   透明度（0-1）
 * brightness  : number   亮度（0-1+，1=原始）
 * contrast    : number   对比度
 * hue         : number   色调旋转
 * saturation  : number   饱和度
 * show        : boolean  是否显示
 */

/**
 * 添加天地图影像
 *
 * UrlTemplateImageryProvider - URL 模板提供者
 * ------------------------------------------
 * 最灵活的影像提供者，支持任何基于 URL 模板的瓦片服务。
 *
 * 参数：
 * - url          : string   URL 模板，{x}{y}{z} 会被替换为瓦片坐标
 * - subdomains   : string[] 子域名列表（用于负载均衡）
 * - maximumLevel : number   最大缩放级别
 */
async function addTianditu() {
  // 天地图 token（公开测试 token，生产环境需要申请自己的）
  const token = '77d97375a65379b2d3a4a2d3e79b5c8d'

  // 天地图影像注记
  const provider = await Cesium.UrlTemplateImageryProvider.fromUrl(
    `https://t{s}.tianditu.gov.cn/img_w/wmts?tk=${token}&` +
    'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&' +
    'STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}',
    {
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18
    }
  )

  viewer.value.imageryLayers.addImageryProvider(provider)
  imageryCount.value = viewer.value.imageryLayers.length
}

/**
 * 添加 ArcGIS 影像
 *
 * ArcGisMapServerImageryProvider
 * ------------------------------------------
 * 用于加载 ArcGIS Server 发布的地图服务。
 *
 * 参数：
 * - url : string  ArcGIS MapServer 的 URL
 */
async function addArcgis() {
  const provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
  )

  viewer.value.imageryLayers.addImageryProvider(provider)
  imageryCount.value = viewer.value.imageryLayers.length
}

/**
 * 添加单张图片作为图层
 *
 * SingleTileImageryProvider
 * ------------------------------------------
 * 将一张图片覆盖到指定的矩形区域。
 * 适用于自定义地图、示意图叠加等场景。
 *
 * 参数：
 * - url       : string   图片 URL
 * - rectangle : Rectangle 覆盖范围
 */
async function addSingleTile() {
  const provider = await Cesium.SingleTileImageryProvider.fromUrl(
    'https://cesium.com/images/tile-map.png',
    {
      rectangle: Cesium.Rectangle.fromDegrees(90.0, 20.0, 120.0, 50.0)
    }
  )

  viewer.value.imageryLayers.addImageryProvider(provider)
  imageryCount.value = viewer.value.imageryLayers.length
}

function removeLastImagery() {
  const layers = viewer.value.imageryLayers
  if (layers.length > 1) {
    // 保留底图（index=0），移除最后添加的
    const lastLayer = layers.get(layers.length - 1)
    layers.remove(lastLayer)
    imageryCount.value = layers.length
  }
}

/**
 * ==========================================
 * 地形（Terrain）
 * ==========================================
 *
 * 地形决定了地球表面的高低起伏。
 *
 * 设置地形的方式：
 * ------------------------------------------
 * // 方式 1：直接设置 viewer.terrainProvider
 * viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url)
 *
 * // 方式 2：使用 createWorldTerrainAsync（Cesium Ion 全球地形）
 * viewer.terrainProvider = await Cesium.createWorldTerrainAsync()
 *
 * 注意：
 * - 同一时间只能有一个地形提供者
 * - 设置新地形会自动替换旧地形
 * - 无地形时地球是光滑的球体
 *
 * CesiumTerrainProvider 参数：
 * - url                      : string   地形服务 URL
 * - requestVertexNormals     : boolean  是否请求法线（光照效果更好）
 * - requestWaterMask         : boolean  是否请求水面掩膜（水面效果）
 */
async function setDefaultTerrain() {
  // 椭球体地形 = 无高程数据，地球是光滑球体
  viewer.value.terrainProvider = new Cesium.EllipsoidTerrainProvider()
}

async function setCesiumTerrain() {
  // Cesium Ion 全球地形（需要有效的 Ion token）
  try {
    viewer.value.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
      requestWaterMask: true,   // 启用海面效果
      requestVertexNormals: true // 启用法线（更好的光照）
    })
  } catch (e) {
    console.warn('Cesium Ion 地形加载失败（可能需要配置 token）:', e)
    // 回退到无地形
    viewer.value.terrainProvider = new Cesium.EllipsoidTerrainProvider()
  }
}

/**
 * ==========================================
 * 3D Tiles
 * ==========================================
 *
 * 3D Tiles 是 Cesium 开源的大规模三维空间数据格式。
 * 支持 LOD（多细节层次），适合海量建筑模型、点云等。
 *
 * 加载方式：
 * ------------------------------------------
 * // 从 URL 加载
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(url)
 * viewer.scene.primitives.add(tileset)
 *
 * // 从 Cesium Ion 加载
 * const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(assetId)
 * viewer.scene.primitives.add(tileset)
 *
 * 3DTileset 常用属性/方法：
 * ------------------------------------------
 * tileset.style                : Cesium3DTileStyle  样式（可按属性着色）
 * tileset.maximumScreenSpaceError : number  屏幕空间误差（越小越精细，性能越差）
 * tileset.show                 : boolean  是否显示
 * tileset.modelMatrix          : Matrix4   变换矩阵（移动/旋转/缩放）
 * tileset.boundingSphere       : BoundingSphere 包围球
 *
 * 注意：3D Tiles 添加到 scene.primitives 而不是 viewer.entities
 */
async function add3DTiles() {
  try {
    // 加载 Cesium 官方示例的 3D Tiles（纽约建筑模型）
    tileset = await Cesium.Cesium3DTileset.fromIonAssetId(75343)
    viewer.value.scene.primitives.add(tileset)
    has3DTiles.value = true

    // 飞到 3D Tiles 的位置
    viewer.value.camera.flyTo({
      destination: tileset.boundingSphere
        ? Cesium.Cartesian3.fromDegrees(-74.0, 40.71, 5000)
        : Cesium.Cartesian3.fromDegrees(-74.0, 40.71, 5000),
      duration: 3
    })
  } catch (e) {
    console.warn('3D Tiles 加载失败:', e)
  }
}

function remove3DTiles() {
  if (tileset) {
    viewer.value.scene.primitives.remove(tileset)
    tileset = null
    has3DTiles.value = false
  }
}

/**
 * ==========================================
 * 数据源（DataSource）- GeoJSON
 * ==========================================
 *
 * DataSource 用于加载矢量数据格式：
 * - GeoJSON
 * - KML / KMZ
 * - CZML（Cesium 自定义动画格式）
 *
 * 加载方式：
 * ------------------------------------------
 * // 方式 1：通过 DataSourceCollection 加载
 * const ds = await Cesium.GeoJsonDataSource.load(url, options)
 * viewer.dataSources.add(ds)
 *
 * // 方式 2：直接加载到 entities
 * const ds = await Cesium.GeoJsonDataSource.load(url)
 * viewer.dataSources.add(ds)
 *
 * GeoJsonDataSource.load 参数：
 * - source    : string|Object  GeoJSON URL 或对象
 * - options   : Object
 *   - stroke          : Color     线颜色
 *   - strokeWidth     : number    线宽
 *   - fill            : Color     面填充颜色
 *   - markerColor     : Color     点颜色
 *   - markerSize      : number    点大小
 *   - clampToGround   : boolean   是否贴地
 */
async function loadGeoJSON() {
  // 创建一个简单的 GeoJSON 数据
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [116.39, 39.91]
        },
        properties: { name: '北京' }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [121.47, 31.23]
        },
        properties: { name: '上海' }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[116.39, 39.91], [121.47, 31.23]]
        },
        properties: { name: '连线' }
      }
    ]
  }

  const dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
    stroke: Cesium.Color.CYAN,
    strokeWidth: 3,
    fill: Cesium.Color.BLUE.withAlpha(0.3),
    markerColor: Cesium.Color.RED,
    markerSize: 10,
    clampToGround: true
  })

  viewer.value.dataSources.add(dataSource)
  dataSourceCount.value = viewer.value.dataSources.length
}

function removeDataSources() {
  viewer.value.dataSources.removeAll()
  dataSourceCount.value = 0
}

onBeforeUnmount(() => {
  if (tileset) {
    viewer.value?.scene.primitives.remove(tileset)
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

.layer-info {
  margin-top: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
}

.layer-info p {
  font-size: 12px;
  font-family: 'Consolas', monospace;
  margin-bottom: 4px;
}

.cesium-container {
  flex: 1;
  height: 100%;
}
</style>
