import AutoImport from 'unplugin-auto-import/vite'
import type { Plugin } from 'vite'

/**
 * 自动导入预设清单
 */
export function getAutoImportConfig() {
	return [
		{ vue: ['ref', 'computed', 'reactive', 'watch', 'onMounted'] },
		{ '@dcloudio/uni-app': ['onShow', 'onHide', 'onLaunch', 'onShareAppMessage', 'onShareTimeline'] },
		{ '@hlw-mp/vue': ['hlw', 'http', 'useMsg'] }
	]
}

/**
 * 自动按需导入插件
 */
export function createAutoImportPlugin(options: { dts?: string } = {}): Plugin {
	const factory = (AutoImport as any).default || AutoImport
	return factory({
		imports: getAutoImportConfig(),
		vueTemplate: true,
		dts: options.dts || 'src/imports.d.ts'
	})
}
