import type { Plugin } from 'vite'

/**
 * 全局垫片串
 */
const GLOBAL_SHIM_CODE = `globalThis.window = globalThis;
globalThis.self = globalThis;
if (!globalThis.crypto) globalThis.crypto = {};
var self = globalThis, window = globalThis;
`

/**
 * 小程序垫片
 * @returns 构建插件体
 */
export function createMpShimPlugin(): Plugin {
	return {
		name: 'hlw-mp-shim',
		resolveId(identifier: string) {
			if (identifier === 'url' || identifier === 'node:url') {
				return '\0virtual:empty-url'
			}
		},
		load(identifier: string) {
			if (identifier === '\0virtual:empty-url') {
				return 'export default {}; export const pathToFileURL = (path: string) => ({ href: path });'
			}
		},
		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'common/url.js',
				source: 'module.exports = { pathToFileURL: function(path) { return { href: path }; } };\n'
			})
		},
		renderChunk(chunkCode: string, chunkInfo: { fileName: string }) {
			if (chunkInfo.fileName.includes('vendor') || chunkInfo.fileName.includes('app')) {
				let outputCode = GLOBAL_SHIM_CODE + '\n' + chunkCode
				outputCode = outputCode.replace(/require\(["']url["']\)/g, '({})')
				return {
					code: outputCode,
					map: null
				}
			}
		}
	}
}
