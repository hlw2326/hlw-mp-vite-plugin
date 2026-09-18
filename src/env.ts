import fs from 'fs'
import path from 'path'

/**
 * 转换驼峰名
 * @param keyStr 原始下划线
 * @returns 驼峰字符串
 */
export function toCamel(keyStr: string): string {
	return keyStr
		.toLowerCase()
		.replace(/^vite_/, '')
		.replace(/_([a-z0-9])/g, (_match: string, letter: string) => letter.toUpperCase())
}

/**
 * 转换版本号
 * @param versionStr 版本字符串
 * @returns 数值版本号
 */
export function toCode(versionStr: string): number {
	const cleanStr = versionStr.replace(/^[^\d]*/, '').split('-')[0]
	const parts = cleanStr.split('.').map((segment) => parseInt(segment, 10))
	const major = parts[0] || 0
	const minor = parts[1] || 0
	const patch = parts[2] || 0
	return major * 10000 + minor * 100 + patch
}

/**
 * 读取工程配
 * @param root 项目根目录
 * @returns 项目配置包
 */
export function readPackage(root: string): Record<string, unknown> {
	const packageFile = path.resolve(root, 'package.json')
	if (!fs.existsSync(packageFile)) return {}
	try {
		return JSON.parse(fs.readFileSync(packageFile, 'utf-8'))
	} catch (error) {
		return {}
	}
}

/**
 * 解析环境配
 * @param filePath 环境文件径
 * @returns 变量键值对
 */
export function parseEnv(filePath: string): Record<string, string> {
	if (!fs.existsSync(filePath)) return {}
	const content = fs.readFileSync(filePath, 'utf-8')
	const lines = content.split(/\r?\n/)
	const result: Record<string, string> = {}

	let isMultiline = false
	let quoteChar = ''
	let currentKey = ''
	let currentValue = ''

	for (const line of lines) {
		if (isMultiline) {
			currentValue += '\n' + line
			if (line.endsWith(quoteChar)) {
				isMultiline = false
				result[currentKey] = currentValue.slice(1, -1)
				currentKey = ''
				currentValue = ''
				quoteChar = ''
			}
			continue
		}

		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue

		const separatorIndex = line.indexOf('=')
		if (separatorIndex === -1) continue

		const key = line.slice(0, separatorIndex).trim()
		let value = line.slice(separatorIndex + 1).trim()

		if (
			(value.startsWith('"') && (!value.endsWith('"') || value.length === 1)) ||
			(value.startsWith("'") && (!value.endsWith("'") || value.length === 1))
		) {
			isMultiline = true
			quoteChar = value[0]
			currentKey = key
			currentValue = value
			continue
		}

		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1)
		}
		result[key] = value
	}
	return result
}

/**
 * 加载环境配
 * @param mode 运行模式名
 * @param root 项目根目录
 * @returns 合并环境表
 */
export function loadEnv(mode: string, root: string): Record<string, string> {
	const files = ['.env', `.env.${mode}`]
	const merged: Record<string, string> = {}
	for (const file of files) {
		const filePath = path.resolve(root, file)
		Object.assign(merged, parseEnv(filePath))
	}
	return merged
}
