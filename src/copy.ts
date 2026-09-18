import type { Plugin } from 'vite'

const V_COPY_RE = /\bv-copy((?:\.\w+)*)="([^"]*)"/g

/**
 * 构造点击令
 * @param expr 表达式内容
 * @param isSilent 是否为静默
 * @returns 模板点击串
 */
function toTap(expr: string, isSilent: boolean): string {
	const showToast = isSilent ? 'false' : 'true'
	return `@tap="() => uni.setClipboardData({ data: String((${expr}) ?? ''), showToast: false, success: () => ${showToast} ? uni.showToast({ title: '复制成功', icon: 'none', duration: 1500 }) : undefined })"`
}

/**
 * 编译转换体
 * @returns 构建插件体
 */
export function createCopyTransformPlugin(): Plugin {
	return {
		name: 'hlw-copy-transform',
		enforce: 'pre',

		transform(code: string, id: string) {
			if (!id.endsWith('.vue')) return null
			if (!code.includes('v-copy')) return null

			// 替换拷贝令
			const result = code.replace(V_COPY_RE, (_match: string, modifiers: string, expr: string) => {
				const isSilent = modifiers.includes('.silent')
				return toTap(expr, isSilent)
			})

			return { code: result, map: null }
		}
	}
}

/**
 * 注入指令件
 * @returns 构建插件体
 */
export function createDirectiveInjectPlugin(): Plugin {
	return {
		name: 'hlw-directive-inject',
		enforce: 'pre',

		transform(code: string, id: string) {
			const normalizedId = id.replace(/\\/g, '/')
			if (!normalizedId.endsWith('/src/main.ts') && !normalizedId.endsWith('/src/main.js')) {
				return null
			}

			// 校验已存在
			if (code.includes('app.directive("copy"') || code.includes("app.directive('copy'")) {
				return null
			}

			let newCode = code

			// 导入指令件
			if (!newCode.includes('vCopy')) {
				newCode = 'import { vCopy } from "@hlw-mp/vue";\n' + newCode
			}

			// 注入注册令
			if (newCode.includes('bootstrap(app)')) {
				newCode = newCode.replace('bootstrap(app)', 'app.directive("copy", vCopy);\n    bootstrap(app)')
			} else if (newCode.includes('const app = createSSRApp(App)')) {
				newCode = newCode.replace(
					'const app = createSSRApp(App)',
					'const app = createSSRApp(App);\n    app.directive("copy", vCopy);'
				)
			} else if (newCode.includes('const app = createSSRApp')) {
				newCode = newCode.replace(
					/const app = (?:createSSRApp|createApp)\(.*\);?/g,
					'$& \n    app.directive("copy", vCopy);'
				)
			}

			return {
				code: newCode,
				map: null
			}
		}
	}
}
