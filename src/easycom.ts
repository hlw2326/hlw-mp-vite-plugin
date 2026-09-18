import type { Plugin } from 'vite'

const EASYCOM_KEY = '^hlw-(.*)'
const EASYCOM_PATTERN = /^hlw-(.*)/
export const DEFAULT_EASYCOM_REPLACEMENT = '@hlw-mp/vue/src/components/hlw-$1/index.vue'

interface EasycomPluginOptions {
	replacement?: string
}

interface EasycomRule {
	name?: string
	pattern?: RegExp
	replacement?: string
}

interface EasycomResult {
	easycoms?: EasycomRule[]
}

interface UniCliSharedLike {
	initEasycomsOnce?: (inputDir: string | undefined, options: { dirs: string[]; platform: string; isX: boolean }) => EasycomResult
}

/**
 * 注入组规则
 * @param options 插件配置项
 * @returns 构建插件体
 */
export function createEasycomPlugin(options: EasycomPluginOptions = {}): Plugin {
	const replacement = options.replacement || DEFAULT_EASYCOM_REPLACEMENT

	return {
		name: 'hlw-easycom',
		enforce: 'pre',

		configResolved() {
			try {
				// 引入脚手架
				const cliShared = require('@dcloudio/uni-cli-shared') as UniCliSharedLike
				if (typeof cliShared?.initEasycomsOnce !== 'function') return

				// 初始化规则
				const result = cliShared.initEasycomsOnce(process.env.UNI_INPUT_DIR, {
					dirs: [],
					platform: process.env.UNI_PLATFORM || 'mp-weixin',
					isX: false
				})

				const easycoms = result?.easycoms
				if (!Array.isArray(easycoms)) return

				// 检查已存在
				const isExist = easycoms.some((item) => item?.pattern?.toString() === EASYCOM_PATTERN.toString())
				if (isExist) return

				// 注入新规则
				easycoms.push({
					name: EASYCOM_KEY,
					pattern: EASYCOM_PATTERN,
					replacement
				})
			} catch (error) {
				// 静默防阻断
			}
		}
	}
}
