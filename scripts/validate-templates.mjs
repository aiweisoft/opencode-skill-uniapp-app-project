#!/usr/bin/env node
/**
 * Validates the uni-app templates shipped with this skill, and optionally the
 * projects produced by scripts/create-uniapp.ps1.
 *
 * The checks encode the rules that are easy to break and hard to notice:
 *   - manifest.json / pages.json must be UTF-8 WITHOUT BOM
 *   - both files are JSONC, so they must still parse after stripping comments
 *   - a Vue3 project needs BOTH "vueVersion": "3" and a createSSRApp main.js;
 *     a Vue2 project needs neither
 *   - pages.json pages[0].path must have a matching .vue file
 *   - static/logo.png must really be a PNG
 *   - scripts/create-uniapp.ps1 must stay pure ASCII, because Windows
 *     PowerShell 5.1 decodes a BOM-less script as ANSI and would mangle it
 *
 * Usage:
 *   node scripts/validate-templates.mjs
 *   node scripts/validate-templates.mjs --project <dir> --vue <2|3> \
 *     [--app-name <name>] [--app-id <appid>] [--project <dir> ...]
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const errors = []
const warnings = []
let checks = 0

const rel = (p) => {
	const r = relative(REPO, p).split(sep).join('/')
	// generated projects usually live outside the repo, e.g. in RUNNER_TEMP
	return r.startsWith('..') ? p.split(sep).join('/') : r
}

function check(ok, message) {
	checks++
	if (!ok) errors.push(message)
	return ok
}

function warn(ok, message) {
	checks++
	if (!ok) warnings.push(message)
	return ok
}

function readIfExists(path) {
	return existsSync(path) ? readFileSync(path, 'utf8') : null
}

function checkExists(path, why) {
	return check(existsSync(path), `${rel(path)}: missing (${why})`)
}

function checkNoBom(path) {
	if (!existsSync(path)) return
	const buf = readFileSync(path)
	const hasBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf
	check(!hasBom, `${rel(path)}: starts with a UTF-8 BOM; uni-app rejects BOM in manifest.json/pages.json`)
}

function checkLfOnly(path) {
	if (path.endsWith('.png')) return
	const text = readIfExists(path)
	if (text === null) return
	warn(!text.includes('\r\n'), `${rel(path)}: contains CRLF; templates are copied verbatim so they should stay LF`)
}

function checkAsciiOnly(path) {
	if (!existsSync(path)) return
	const buf = readFileSync(path)
	const offset = buf.findIndex((b) => b > 0x7f)
	check(
		offset === -1,
		`${rel(path)}: non-ASCII byte at offset ${offset}; Windows PowerShell 5.1 decodes BOM-less scripts as ANSI, so this script must stay pure ASCII`
	)
}

function checkPng(path) {
	if (!existsSync(path)) return
	const buf = readFileSync(path)
	check(
		buf.length > 8 && buf.subarray(0, 8).equals(PNG_MAGIC),
		`${rel(path)}: not a valid PNG (bad magic bytes)`
	)
}

/**
 * Strips // and /* *\/ comments plus trailing commas. String-aware, so urls such
 * as "http://x" and escaped quotes inside strings survive.
 */
function stripJsonComments(text) {
	let out = ''
	let inString = false
	let lineComment = false
	let blockComment = false

	for (let i = 0; i < text.length; i++) {
		const c = text[i]
		const next = text[i + 1]

		if (lineComment) {
			if (c === '\n') {
				lineComment = false
				out += c
			}
			continue
		}
		if (blockComment) {
			if (c === '*' && next === '/') {
				blockComment = false
				i++
			} else if (c === '\n') {
				out += c
			}
			continue
		}
		if (inString) {
			out += c
			if (c === '\\') {
				out += next ?? ''
				i++
			} else if (c === '"') {
				inString = false
			}
			continue
		}
		if (c === '"') {
			inString = true
			out += c
			continue
		}
		if (c === '/' && next === '/') {
			lineComment = true
			i++
			continue
		}
		if (c === '/' && next === '*') {
			blockComment = true
			i++
			continue
		}
		out += c
	}

	return out.replace(/,(\s*[}\]])/g, '$1')
}

function parseJsonc(path) {
	const text = readIfExists(path)
	if (text === null) return null
	try {
		return JSON.parse(stripJsonComments(text))
	} catch (err) {
		check(false, `${rel(path)}: does not parse as JSON after stripping comments — ${err.message}`)
		return null
	}
}

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === '.git' || entry.name === 'node_modules') continue
		const path = join(dir, entry.name)
		if (entry.isDirectory()) walk(path, out)
		else out.push(path)
	}
	return out
}

// ---------------------------------------------------------------------------
// shared checks
// ---------------------------------------------------------------------------

function checkVueWiring(dir, vue, tag) {
	const main = readIfExists(join(dir, 'main.js'))
	if (main !== null) {
		if (vue === '3') {
			check(main.includes('createSSRApp'), `${tag}/main.js: a Vue3 project must use createSSRApp`)
			check(
				/export\s+function\s+createApp\s*\(/.test(main),
				`${tag}/main.js: a Vue3 project must export a createApp() function`
			)
			check(!/new\s+Vue\s*\(/.test(main), `${tag}/main.js: a Vue3 project must not call new Vue()`)
		} else {
			check(/new\s+Vue\s*\(/.test(main), `${tag}/main.js: a Vue2 project must call new Vue({...App})`)
			check(!main.includes('createSSRApp'), `${tag}/main.js: a Vue2 project must not use createSSRApp`)
		}
	}

	const app = readIfExists(join(dir, 'App.vue'))
	if (app !== null) {
		for (const hook of ['onLaunch', 'onShow', 'onHide']) {
			check(app.includes(hook), `${tag}/App.vue: missing the ${hook} app lifecycle hook`)
		}
		check(!app.includes('<template'), `${tag}/App.vue: must not contain a <template> block`)
	}

	const html = readIfExists(join(dir, 'index.html'))
	if (html !== null) {
		check(html.includes('id="app"'), `${tag}/index.html: missing the <div id="app"> mount point`)
		if (vue === '3') {
			check(html.includes('src="/main.js"'), `${tag}/index.html: a Vue3 project must load /main.js`)
		}
	}

	checkPng(join(dir, 'static', 'logo.png'))
}

function checkPages(dir, tag) {
	const pages = parseJsonc(join(dir, 'pages.json'))
	if (pages === null) return

	check(Array.isArray(pages.pages) && pages.pages.length > 0, `${tag}/pages.json: "pages" must be a non-empty array`)
	check(pages.globalStyle != null, `${tag}/pages.json: missing "globalStyle"`)

	if (!Array.isArray(pages.pages)) return
	for (const [i, page] of pages.pages.entries()) {
		if (!check(typeof page?.path === 'string' && page.path.length > 0, `${tag}/pages.json: pages[${i}].path must be a non-empty string`)) {
			continue
		}
		check(
			existsSync(join(dir, `${page.path}.vue`)),
			`${tag}/pages.json: pages[${i}].path "${page.path}" has no matching ${page.path}.vue`
		)
		warn(
			Boolean(page.style?.navigationBarTitleText),
			`${tag}/pages.json: pages[${i}] sets no navigationBarTitleText`
		)
	}
}

// ---------------------------------------------------------------------------
// template checks
// ---------------------------------------------------------------------------

const TEMPLATE_FILES = [
	'App.vue',
	'main.js',
	'manifest.json',
	'pages.json',
	'uni.scss',
	'index.html',
	'.gitignore',
	'pages/index/index.vue',
	'static/logo.png'
]

function validateTemplate(vue) {
	const tag = `templates/vue${vue}`
	const dir = join(REPO, 'templates', `vue${vue}`)

	if (!check(existsSync(dir), `${tag}: template directory is missing`)) return

	for (const file of TEMPLATE_FILES) {
		checkExists(join(dir, file), 'every HBuilderX uni-app project needs it')
	}
	for (const file of ['manifest.json', 'pages.json', 'README.md']) {
		checkNoBom(join(dir, file))
	}
	for (const file of TEMPLATE_FILES) {
		checkLfOnly(join(dir, file))
	}

	const manifest = parseJsonc(join(dir, 'manifest.json'))
	if (manifest !== null) {
		for (const key of ['name', 'appid', 'versionName', 'versionCode']) {
			check(key in manifest, `${tag}/manifest.json: missing "${key}"`)
		}
		check(
			manifest.name === '',
			`${tag}/manifest.json: root "name" must stay "" so the scaffolder can fill it in (got ${JSON.stringify(manifest.name)})`
		)
		check(
			manifest.appid === '',
			`${tag}/manifest.json: root "appid" must stay "" so the scaffolder can fill it in (got ${JSON.stringify(manifest.appid)})`
		)
		check(
			manifest['mp-weixin']?.appid === '',
			`${tag}/manifest.json: mp-weixin.appid must stay "": only the root appid is the DCloud appid`
		)

		const permissions = manifest['app-plus']?.distribute?.android?.permissions
		check(
			Array.isArray(permissions) && permissions.length > 0,
			`${tag}/manifest.json: app-plus.distribute.android.permissions must be a non-empty array`
		)

		if (vue === '3') {
			check(manifest.vueVersion === '3', `${tag}/manifest.json: a Vue3 project must set "vueVersion": "3"`)
		} else {
			check(!('vueVersion' in manifest), `${tag}/manifest.json: a Vue2 project must not set "vueVersion"`)
		}
	}

	checkVueWiring(dir, vue, tag)
	checkPages(dir, tag)

	const readme = readIfExists(join(dir, 'README.md'))
	if (readme !== null) {
		for (const placeholder of ['{{APP_NAME}}', '{{VUE}}']) {
			check(readme.includes(placeholder), `${tag}/README.md: must keep the ${placeholder} placeholder for the scaffolder`)
		}
	}
}

// ---------------------------------------------------------------------------
// generated project checks
// ---------------------------------------------------------------------------

function validateProject({ dir, vue, appName, appId }) {
	const tag = `generated:${dir}`

	if (!check(existsSync(dir), `${tag}: directory does not exist`)) return

	for (const file of [...TEMPLATE_FILES, 'README.md']) {
		checkExists(join(dir, file), 'the scaffolder should always create it')
	}
	for (const file of ['manifest.json', 'pages.json', 'README.md', 'main.js', 'index.html']) {
		checkNoBom(join(dir, file))
	}

	const manifest = parseJsonc(join(dir, 'manifest.json'))
	if (manifest !== null) {
		check(
			manifest.name === appName,
			`${tag}/manifest.json: "name" is ${JSON.stringify(manifest.name)}, expected ${JSON.stringify(appName)}`
		)
		check(
			manifest.appid === appId,
			`${tag}/manifest.json: "appid" is ${JSON.stringify(manifest.appid)}, expected ${JSON.stringify(appId)}`
		)
		if (vue === '3') {
			check(manifest.vueVersion === '3', `${tag}/manifest.json: expected "vueVersion": "3"`)
		} else {
			check(!('vueVersion' in manifest), `${tag}/manifest.json: expected no "vueVersion" for Vue2`)
		}
	}

	checkVueWiring(dir, vue, tag)

	const readme = readIfExists(join(dir, 'README.md'))
	if (readme !== null) {
		check(!readme.includes('{{'), `${tag}/README.md: a placeholder was not substituted`)
		check(readme.includes(appName), `${tag}/README.md: expected the App name ${JSON.stringify(appName)} in the title`)
	}
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function parseArgs(argv) {
	const projects = []
	let current = null

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]
		if (arg === '--project') {
			current = { dir: argv[++i], vue: '3', appName: null, appId: null }
			projects.push(current)
			continue
		}
		if (current === null) {
			console.error(`unexpected argument: ${arg}`)
			process.exit(2)
		}
		if (arg === '--vue') current.vue = argv[++i]
		else if (arg === '--app-name') current.appName = argv[++i]
		else if (arg === '--app-id') current.appId = argv[++i]
		else {
			console.error(`unknown option: ${arg}`)
			process.exit(2)
		}
	}

	for (const project of projects) {
		if (project.appName === null) project.appName = basename(project.dir)
		if (project.appId === null) project.appId = ''
		if (!['2', '3'].includes(project.vue)) {
			console.error(`--vue must be 2 or 3, got ${project.vue}`)
			process.exit(2)
		}
	}
	return projects
}

const projects = parseArgs(process.argv.slice(2))

const ps1 = join(REPO, 'scripts', 'create-uniapp.ps1')
checkExists(ps1, 'the scaffolder is the point of this skill')
checkAsciiOnly(ps1)
if (readIfExists(ps1) !== null) {
	const script = readIfExists(ps1)
	check(script.includes('templates'), 'scripts/create-uniapp.ps1: no longer references the templates directory')
	check(
		script.includes('README.project.md'),
		'scripts/create-uniapp.ps1: no longer reads templates/README.project.md'
	)
}
checkNoBom(join(REPO, 'templates', 'README.project.md'))

const skill = readIfExists(join(REPO, 'SKILL.md'))
if (check(skill !== null, 'SKILL.md: missing')) {
	const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(skill)
	if (check(frontmatter !== null, 'SKILL.md: missing YAML frontmatter')) {
		for (const field of ['name:', 'description:']) {
			check(frontmatter[1].includes(field), `SKILL.md frontmatter: missing "${field.replace(':', '')}"`)
		}
	}
}

// every text file in the repo, not just the templates
for (const file of walk(REPO)) {
	if (file.endsWith('.png')) continue
	checkNoBom(file)
}

validateTemplate('3')
validateTemplate('2')
for (const project of projects) validateProject(project)

const scope = ['templates/vue3', 'templates/vue2', ...projects.map((p) => rel(p.dir))].join(', ')
console.log(`checked ${checks} assertions across ${scope}`)

for (const warning of warnings) console.log(`  warning: ${warning}`)

if (errors.length > 0) {
	console.error(`\n${errors.length} problem(s) found:`)
	for (const error of errors) console.error(`  ✗ ${error}`)
	process.exitCode = 1
} else {
	console.log('all good')
}
