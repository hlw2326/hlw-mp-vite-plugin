import * as AutoImportModule from 'unplugin-auto-import/vite'
import type { Plugin } from 'vite'

/**
 * 获取导入表
 * @returns 导入配置表
 */
export function getAutoImportConfig(): Array<Record<string, string[]>> {
	return [
		{
			vue: ['ref', 'computed', 'reactive', 'watch', 'onMounted']
		},
		{
			'@dcloudio/uni-app': ['onShow', 'onHide', 'onLaunch', 'onShareAppMessage', 'onShareTimeline']
		},
		{
			'@hlw-mp/vue': ['hlw', 'http', 'useMsg']
		}
	]
}

/**
 * 解析工厂例
 * @returns 插件工厂例
 */
function resolveAutoImportFactory(): (options: {
	imports: ReturnType<typeof getAutoImportConfig>
	vueTemplate: boolean
	dts: string
}) => Plugin {
	const moduleValue = AutoImportModule as { default?: unknown }
	const candidate =
		moduleValue.default && typeof moduleValue.default === 'object'
			? (moduleValue.default as { default?: unknown }).default ?? moduleValue.default
			: moduleValue.default ?? AutoImportModule
	if (typeof candidate !== 'function') {
		throw new TypeError('解析自动导入失败')
	}
	return candidate as (options: {
		imports: ReturnType<typeof getAutoImportConfig>
		vueTemplate: boolean
		dts: string
	}) => Plugin
}

/**
 * 自动按需入
 * @param options 插件配置项
 * @returns 构建插件体
 */
export function createAutoImportPlugin(options: { dts?: string } = {}): Plugin {
	const createAutoImport = resolveAutoImportFactory()
	const autoImportDts = options.dts || 'src/imports.d.ts'

	return createAutoImport({
		imports: getAutoImportConfig(),
		vueTemplate: true,
		dts: autoImportDts
	})
}
