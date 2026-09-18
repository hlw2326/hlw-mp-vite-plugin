import type { Plugin } from 'vite'

/**
 * 全局垫片串
 */
const GLOBAL_SHIM_CODE = `var _global = typeof globalThis !== "undefined" && globalThis ? globalThis : (typeof window !== "undefined" && window ? window : (typeof self !== "undefined" && self ? self : (typeof global !== "undefined" && global ? global : (typeof wx !== "undefined" && wx ? wx : {}))));
if (!_global.crypto) { try { _global.crypto = {}; } catch(error){} }
if (typeof globalThis === "undefined" || !globalThis) { try { _global.globalThis = _global; } catch(error){} }
try { _global.self = _global; } catch(error){}
try { _global.window = _global; } catch(error){}
try { _global.global = _global; } catch(error){}
var self = _global;
var window = _global;
var global = _global;
if (typeof __filename === "undefined") { try { _global.__filename = ""; } catch(error){} }
if (typeof __dirname === "undefined") { try { _global.__dirname = ""; } catch(error){} }
var __filename = typeof __filename !== "undefined" ? __filename : "";
var __dirname = typeof __dirname !== "undefined" ? __dirname : "";
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
