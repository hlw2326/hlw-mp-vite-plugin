import type { Plugin } from 'vite'

const V_COPY_RE = /\bv-copy((?:\.\w+)*)="([^"]*)"/g

function toTap(expr: string, isSilent: boolean): string {
	const success = isSilent ? '' : ', success: () => uni.showToast({ title: "复制成功", icon: "none" })'
	return `@tap="() => uni.setClipboardData({ data: String(${expr})${success} })"`
}

/**
 * 模板 v-copy 指令转 @tap 事件插件
 */
export function createCopyTransformPlugin(): Plugin {
	return {
		name: 'hlw-copy-transform',
		enforce: 'pre',
		transform(code: string, id: string) {
			if (!id.endsWith('.vue') || !code.includes('v-copy')) return null
			return {
				code: code.replace(V_COPY_RE, (_, modifiers: string, expr: string) => toTap(expr, modifiers.includes('.silent'))),
				map: null
			}
		}
	}
}

/**
 * main 入口注入 vCopy 指令插件
 */
export function createDirectiveInjectPlugin(): Plugin {
	return {
		name: 'hlw-directive-inject',
		enforce: 'pre',
		transform(code: string, id: string) {
			const file = id.replace(/\\/g, '/')
			if (!file.endsWith('/src/main.ts') && !file.endsWith('/src/main.js')) return null
			if (code.includes('app.directive("copy"') || code.includes("app.directive('copy'")) return null

			const header = code.includes('vCopy') ? '' : 'import { vCopy } from "@hlw-mp/vue";\n'
			const content = code.replace(/(const app = createSSRApp\(App\);?)/, '$1\n    app.directive("copy", vCopy);')
			return { code: header + content, map: null }
		}
	}
}
