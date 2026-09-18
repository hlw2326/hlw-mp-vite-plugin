import fs from 'fs'
import path from 'path'
import type { Plugin, UserConfig, ConfigEnv } from 'vite'
import type { PluginOptions } from './types'
import { loadEnv, readPackage, toCode } from './env'
import { genDts, writeDts } from './dts'
import { createCopyTransformPlugin, createDirectiveInjectPlugin } from './copy'
import { createEasycomPlugin } from './easycom'
import { createAutoImportPlugin } from './auto-import'
import { createMpShimPlugin } from './shim'

/**
 * 构建定义件
 * @param options 插件配置项
 * @returns 构建插件体
 */
function createDefinePlugin(options: PluginOptions = {}): Plugin {
	return {
		name: 'hlw-define',
		config(userConfig?: UserConfig, envConfig?: ConfigEnv) {
			const projectRoot = options.cwd || (fs.existsSync(path.resolve(process.cwd(), 'package.json')) ? process.cwd() : userConfig?.root || process.cwd())
			const currentMode = envConfig?.mode || 'development'
			const envDict = loadEnv(currentMode, projectRoot)
			const packageData = readPackage(projectRoot)

			const versionName = (envDict.VITE_APP_VERSION || packageData.version || '') as string
			const versionCode = toCode(versionName)
			const baseUrl = options.base || envDict.VITE_API_BASE_URL || envDict.VITE_BASE_URL || ''
			const wssUrl = options.wss || envDict.VITE_WSS_URL || ''
			const appName = (envDict.VITE_APP_NAME || packageData.name || '') as string
			const appId = envDict.VITE_APPID || ''

			// 生成类型库
			const dtsTarget = options.dts || (fs.existsSync(path.resolve(projectRoot, 'src/types')) ? path.resolve(projectRoot, 'src/types/host-env.d.ts') : undefined)
			if (dtsTarget) {
				const dtsPath = path.isAbsolute(dtsTarget) ? dtsTarget : path.resolve(projectRoot, dtsTarget)
				writeDts(dtsPath, genDts(envDict))
			}

			// 注入环境项
			Object.assign(process.env, envDict)

			const defineDict: Record<string, string> = {
				__APP_VERSION_CODE__: JSON.stringify(versionCode),
				__APP_VERSION_NAME__: JSON.stringify(versionName),
				__APP_BASE_URL__: JSON.stringify(baseUrl),
				__APP_WSS_URL__: JSON.stringify(wssUrl),
				__APP_NAME__: JSON.stringify(appName),
				__APPID__: JSON.stringify(appId),
				__HLW_ENV__: JSON.stringify(envDict),
				'import.meta.env.VITE_BASE_URL': JSON.stringify(baseUrl),
			}
			for (const [k, v] of Object.entries(envDict)) {
				defineDict[`import.meta.env.${k}`] = JSON.stringify(v)
			}
			return {
				define: defineDict
			}
		}
	}
}

/**
 * 统一集成件
 * @param options 插件配置项
 * @returns 插件集合表
 */
export function hlwPlugin(options: PluginOptions = {}): Plugin[] {
	const plugins: Plugin[] = [
		createCopyTransformPlugin(),
		createDirectiveInjectPlugin(),
		createDefinePlugin(options),
		createMpShimPlugin(),
		createEasycomPlugin({ replacement: options.easycomReplacement })
	]

	// 注入自动入
	if (options.autoImport) {
		plugins.push(createAutoImportPlugin({ dts: options.autoImportDts }))
	}

	return plugins
}

export type * from './types'
