# Study Cesium - Vue3 + Cesium 三维地球学习项目

> 一个基于 Vue 3 + Vite + Cesium 的三维地球引擎学习项目，包含 6 个学习模块，覆盖 Cesium 核心 API 的详细注释。

---

## 技术栈总览

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| **Vue 3** | ^3.5.13 | 渐进式 JavaScript 框架，使用 Composition API + `<script setup>` 语法 |
| **Vite** | ^6.0.5 | 下一代前端构建工具，极速冷启动和热更新 |
| **Cesium** | ^1.122.0 | 开源三维地球引擎，支持 WebGL 渲染，提供地理可视化能力 |

### 开发工具

| 工具 | 版本 | 说明 |
|------|------|------|
| **@vitejs/plugin-vue** | ^5.2.1 | Vite 的 Vue 3 单文件组件（SFC）支持插件 |
| **vite-plugin-cesium** | ^1.2.23 | 自动处理 Cesium 静态资源（Worker、Asset、Widget CSS） |

### 核心技术说明

- **Vue 3 Composition API** — 使用 `ref`、`shallowRef`、`reactive`、`computed`、`onMounted`、`onBeforeUnmount` 等组合式 API
- **`<script setup>` 语法糖** — 更简洁的组件脚本写法，顶层变量自动暴露给模板
- **shallowRef** — 用于存储 Cesium Viewer 等大型对象，避免 Vue 深度代理带来的性能问题
- **动态组件** — 使用 `<component :is="">` 实现模块切换
- **vite-plugin-cesium** — 自动处理 Cesium 的 Worker 线程、静态资源和 CSS，无需手动配置 CopyWebpackPlugin

---

## 项目结构

```
Study-Cesium/
├── index.html                          # 入口 HTML
├── package.json                        # 项目依赖配置
├── vite.config.js                      # Vite 构建配置
├── .gitignore                          # Git 忽略文件
├── README.md                           # 项目文档
└── src/
    ├── main.js                         # Vue 应用入口
    ├── App.vue                         # 根组件（布局 + 导航）
    └── components/
        ├── CesiumViewer.vue            # 模块1: Viewer 初始化
        ├── CameraControl.vue           # 模块2: 相机控制
        ├── EntityDemo.vue              # 模块3: Entity 实体系统
        ├── LayerManager.vue            # 模块4: 图层管理
        ├── GeometryDemo.vue            # 模块5: 几何图形 & Primitive
        └── EventDemo.vue               # 模块6: 事件系统
```

---

## 学习模块说明

### 模块 1：Viewer 初始化 (`CesiumViewer.vue`)

Viewer 是 Cesium 的核心入口类，封装了三维地球所需的所有子系统。

**覆盖 API：**
- `new Cesium.Viewer(container, options)` — 创建 Viewer 实例及全部配置参数
- `viewer.scene` — 场景对象
- `viewer.camera` — 相机对象
- `viewer.clock` — 时钟对象
- `viewer.entities` — 实体集合
- `viewer.imageryLayers` — 影像图层集合
- `viewer.terrainProvider` — 地形提供者
- `viewer.destroy()` — 销毁释放资源
- `scene.globe.depthTestAgainstTerrain` — 深度测试
- Viewer 事件：`selectedEntityChanged`、`clock.onTick`、`scene.postRender`

---

### 模块 2：相机控制 (`CameraControl.vue`)

Camera 定义了三维场景的观察视角，支持多种视角操作方式。

**覆盖 API：**
- `camera.flyTo(options)` — 平滑飞行（destination / orientation / duration / easingFunction）
- `camera.setView(options)` — 瞬间设置视角（无动画）
- `camera.lookAt(target, offset)` — 环绕目标点观察（HeadingPitchRange）
- `camera.flyHome(duration)` — 回到默认视角
- `camera.lookAtTransform(Matrix4.IDENTITY)` — 解除 lookAt 约束
- `camera.moveForward / moveBackward / moveUp / moveDown / moveLeft / moveRight`
- `camera.lookUp / lookDown / lookLeft / lookRight`
- `camera.zoomIn / zoomOut`
- `camera.positionCartographic` — 获取当前经纬高
- `camera.heading / pitch / roll` — 获取当前姿态角
- 坐标转换：`Cartesian3.fromDegrees`、`Cartographic.fromCartesian`、`Math.toDegrees / toRadians`

---

### 模块 3：Entity 实体系统 (`EntityDemo.vue`)

Entity 是 Cesium 的高层数据驱动可视化 API，适合少量动态对象。

**覆盖 API：**
- **Point** — 点实体（pixelSize / color / outlineColor / disableDepthTestDistance）
- **Label** — 文字标签（text / font / fillColor / style / pixelOffset / horizontalOrigin / verticalOrigin）
- **Billboard** — 图标标注（image / scale / rotation / sizeInMeters）
- **Polyline** — 线实体（positions / width / material / clampToGround / arcType）
- **Polygon** — 面实体（hierarchy / height / extrudedHeight / material / outline / perPositionHeight）
- **Model** — 3D 模型（uri / scale / minimumPixelSize / silhouetteColor / orientation）
- `viewer.entities.add / remove / removeAll`
- `entity.show` — 显示/隐藏控制
- Entity vs Primitive 对比说明

---

### 模块 4：图层管理 (`LayerManager.vue`)

Cesium 支持多种数据图层的叠加。

**覆盖 API：**
- **影像图层**
  - `UrlTemplateImageryProvider` — URL 模板（天地图等自定义瓦片服务）
  - `ArcGisMapServerImageryProvider` — ArcGIS 地图服务
  - `SingleTileImageryProvider` — 单张图片覆盖
  - `viewer.imageryLayers.addImageryProvider / remove / removeAll`
  - 图层属性：alpha / brightness / contrast / saturation / show
- **地形**
  - `CesiumTerrainProvider.fromIonAssetId` — Cesium Ion 全球地形
  - `EllipsoidTerrainProvider` — 无地形（光滑球体）
  - `requestWaterMask / requestVertexNormals` — 水面效果和法线
- **3D Tiles**
  - `Cesium3DTileset.fromUrl / fromIonAssetId` — 加载 3D Tiles
  - `scene.primitives.add(tileset)` — 添加到场景
  - `tileset.boundingSphere / style / maximumScreenSpaceError / show`
- **数据源**
  - `GeoJsonDataSource.load` — 加载 GeoJSON
  - `viewer.dataSources.add / removeAll`
  - 样式参数：stroke / fill / markerColor / markerSize / clampToGround

---

### 模块 5：几何图形 & Primitive (`GeometryDemo.vue`)

Primitive 是 Cesium 底层渲染 API，性能优于 Entity，适合大量静态图形。

**覆盖 API：**
- **Geometry 类型**
  - `RectangleGeometry` — 矩形
  - `CircleGeometry` — 圆形
  - `WallGeometry` — 墙体
  - `CorridorGeometry` — 走廊
  - `CylinderGeometry` — 圆柱
  - `EllipsoidGeometry` — 椭球
  - `BoxGeometry` — 长方体
- **Appearance 类型**
  - `PerInstanceColorAppearance` — 逐实例颜色（高性能）
  - `MaterialAppearance` — 材质外观（灵活）
- **核心流程**
  - `GeometryInstance` — 包装 Geometry + 属性
  - `ColorGeometryInstanceAttribute` — 颜色属性
  - `new Cesium.Primitive({ geometryInstances, appearance })` — 创建图元
  - `scene.primitives.add / remove` — 管理图元

---

### 模块 6：事件系统 (`EventDemo.vue`)

Cesium 提供了完整的事件系统来处理用户交互。

**覆盖 API：**
- **ScreenSpaceEventHandler**
  - `LEFT_CLICK / LEFT_DOUBLE_CLICK / RIGHT_CLICK / MOUSE_MOVE / WHEEL`
  - `setInputAction / removeInputAction / destroy`
- **拾取（Picking）**
  - `scene.pick(position)` — 拾取最上层对象
  - `scene.drillPick(position)` — 穿透拾取（获取所有层级对象）
  - `scene.pickPosition(position)` — 精确世界坐标（含地形）
  - `scene.globe.pick(ray, scene)` — 射线与地形求交
- **坐标转换**
  - `Cartographic.fromCartesian` — 笛卡尔 → 经纬高
  - `camera.getPickRay(position)` — 屏幕坐标 → 射线
- **场景事件**
  - `scene.preRender / postRender / preUpdate / postUpdate`
  - `viewer.selectedEntityChanged`
  - `viewer.trackedEntityChanged`

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 `http://localhost:3000`

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产构建

```bash
npm run preview
```

---

## Cesium Ion Token 配置（可选）

部分功能（如 Cesium Ion 全球地形、3D Tiles）需要有效的 Cesium Ion Token。

1. 前往 [https://ion.cesium.com/](https://ion.cesium.com/) 注册账号
2. 获取默认 Access Token
3. 在代码中设置：

```javascript
import * as Cesium from 'cesium'
Cesium.Ion.defaultAccessToken = '你的Token'
```

> 不配置 Token 也可使用大部分功能（天地图影像、GeoJSON 等不依赖 Ion）。

---

## 学习建议

1. **按顺序学习** — 模块 1 → 6 由浅入深，建议按顺序浏览
2. **阅读注释** — 每个组件都有详细的中文注释，解释了每个 API 的用途和参数
3. **动手实验** — 修改参数（颜色、大小、位置等），观察效果变化
4. **查阅官方文档** — [Cesium 官方文档](https://cesium.com/learn/cesiumjs-ref-doc/) 是最权威的参考
5. **关注 Entity vs Primitive** — 理解两者的区别和适用场景是 Cesium 进阶的关键

---

## 参考资源

- [Cesium 官方文档](https://cesium.com/learn/cesiumjs-ref-doc/)
- [Cesium GitHub](https://github.com/CesiumGS/cesium)
- [Cesium Sandcastle（在线示例）](https://sandcastle.cesium.com/)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vite 官方文档](https://cn.vitejs.dev/)
