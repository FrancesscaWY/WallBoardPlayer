/// <reference types="node" />
import { chromium } from 'playwright'
import axios from 'axios'
import fs from 'fs'
// import path from 'path'

const DEFAULT_CHROME_PATHS = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
].filter(Boolean) as string[]

/** 自动检测可用的 Chrome 路径 */
function detectChrome(): string {
    for (const p of DEFAULT_CHROME_PATHS) {
        if (p && fs.existsSync(p)) return p
    }
    throw new Error('未找到可执行 Chrome，请安装或通过 CHROME_PATH 指定路径')
}

/**
 * 从动态网页中抓取指定标签+class 的图片，并返回 base64 字符串数组
 * @param url - 要访问的网页地址
 * @param tag - 标签名 (例如 'img')
 * @param className - class 值 (例如 'captcha')
 * @returns Promise<string[]> 图片 base64 数组
 */
export async function fetchImageBase64(
    url: string,
    tag: string,
    className: string
): Promise<string[]> {
    const chromePath = detectChrome()
    console.log('🚀 使用浏览器：', chromePath)

    const browser = await chromium.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    })

    const page = await browser.newPage()
    console.log('🌐 打开网页：', url)
    await page.goto(url, { waitUntil: 'networkidle' })

    // 构造 CSS 选择器
    const selector = `${tag}.${className}`

    // 获取所有 src（图片地址）
    const srcs: string[] = await page.$$eval(selector, (els) =>
        els.map((el) => (el as HTMLImageElement).src)
    )

    if (srcs.length === 0) {
        console.warn(`⚠️ 未找到匹配的标签：${selector}`)
    } else {
        console.log(`✅ 找到 ${srcs.length} 个匹配标签：`)
        console.log(srcs)
    }

    // 下载图片并转 base64
    const base64List: string[] = []
    for (const src of srcs) {
        try {
            const res = await axios.get<ArrayBuffer>(src, { responseType: 'arraybuffer' })
            const base64 = Buffer.from(res.data).toString('base64')
            base64List.push(base64)
        } catch (err: any) {
            console.error(`❌ 下载失败 (${src}):`, err.message)
        }
    }

    await browser.close()
    console.log('✅ 抓取完成，共返回', base64List.length, '张图片')

    return base64List
}

// ---- CLI 测试入口 ----
if (import.meta.url === `file://${process.argv[1]}`) {
    const url = process.argv[2] || 'http://222.198.123.127/login'
    const tag = process.argv[3] || 'img'
    const className = process.argv[4] || 'captcha'

    fetchImageBase64(url, tag, className)
        .then((list) => {
            console.log('\n返回的 Base64：')
            list.forEach((b64, i) => {
                console.log(`第 ${i + 1} 张:`, b64.slice(0, 120) + '...')
            })
        })
        .catch((err) => {
            console.error('❌ 错误：', err)
        })
}
