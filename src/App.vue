<template>
  <!--
    ==========================================
    App.vue - 应用根组件
    ==========================================
    整体布局：左侧导航菜单 + 右侧 Cesium 地球内容区
    通过 currentComponent 动态切换右侧展示的学习模块
    ==========================================
  -->
  <div class="app-container">
    <!-- 左侧导航菜单 -->
    <aside class="sidebar">
      <h2 class="sidebar-title">Cesium 学习</h2>
      <nav class="nav-list">
        <button
          v-for="item in menuItems"
          :key="item.key"
          :class="['nav-item', { active: currentComponent === item.key }]"
          @click="currentComponent = item.key"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <!-- 右侧内容区 -->
    <main class="main-content">
      <component :is="componentMap[currentComponent]" />
    </main>
  </div>
</template>

<script setup>
/**
 * ==========================================
 * App.vue - 脚本部分
 * ==========================================
 * Vue 3 <script setup> 语法糖：
 * - 顶层变量/函数自动暴露给模板
 * - 无需 return，无需 components 注册
 * - import 的组件可直接在模板中使用
 * ==========================================
 */
import { ref, shallowRef } from 'vue'

// 导入各学习模块组件
import CesiumViewer from './components/CesiumViewer.vue'
import CameraControl from './components/CameraControl.vue'
import EntityDemo from './components/EntityDemo.vue'
import LayerManager from './components/LayerManager.vue'
import GeometryDemo from './components/GeometryDemo.vue'
import EventDemo from './components/EventDemo.vue'

/**
 * shallowRef - Vue 3 响应式 API
 * ------------------------------------------
 * 与 ref 的区别：shallowRef 只追踪 .value 本身的替换，
 * 不追踪内部属性的变化。
 * 对于 Cesium Viewer 这类大型复杂对象，使用 shallowRef
 * 可以避免 Vue 深度响应式代理带来的性能问题。
 */
const currentComponent = ref('viewer')

/**
 * 组件映射表
 * 通过 key 字符串动态切换展示的组件
 * 配合 <component :is=""> 实现动态组件渲染
 */
const componentMap = {
  viewer: CesiumViewer,
  camera: CameraControl,
  entity: EntityDemo,
  layer: LayerManager,
  geometry: GeometryDemo,
  event: EventDemo
}

/**
 * 菜单配置
 * key  - 对应 componentMap 中的键
 * label - 菜单显示文字
 */
const menuItems = [
  { key: 'viewer', label: '1. Viewer 初始化' },
  { key: 'camera', label: '2. 相机控制' },
  { key: 'entity', label: '3. Entity 实体' },
  { key: 'layer', label: '4. 图层管理' },
  { key: 'geometry', label: '5. 几何图形' },
  { key: 'event', label: '6. 事件系统' }
]
</script>

<style>
/* ==========================================
   全局样式
   ==========================================
   清除默认边距，设置全屏布局
   ========================================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app-container {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 左侧导航栏 */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 18px;
  padding: 8px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav-item.active {
  background: rgba(64, 158, 255, 0.25);
  color: #409eff;
  font-weight: 600;
}

/* 右侧内容区 */
.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
