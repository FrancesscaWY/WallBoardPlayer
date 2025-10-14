/// <reference types="node" />
import { fetchImageBase64 } from './grab-suffix-img.ts'  // 你已有的网页抓图函数
import { ocrRecognize } from './ocr-test'              // 你已有的 OCR 调用函数

/**
 * 从动态网页中抓取指定标签+class 的图片，并返回 OCR 识别结果
 * @param url - 要访问的网页地址
 * @param tag - 标签名 (例如 'img')
 * @param className - class 值 (例如 'captcha')
 * @returns Promise<string[]> 每张图片识别出的文字
 */
export async function fetchAndRecognize(
    url: string,
    tag: string,
    className: string
): Promise<string[]> {
    // 1️⃣ 抓取图片 base64
    const base64List = await fetchImageBase64(url, tag, className)
    if (!base64List.length) {
        console.warn('⚠️ 未抓到任何 base64 图片，返回空数组。')
        return []
    }

    console.log(`✅ 共抓取 ${base64List.length} 张图片，开始 OCR 识别...`)

    // 2️⃣ 调用 OCR 识别
    const results: string[] = []
    for (let i = 0; i < base64List.length; i++) {
        const b64 = base64List[i]
        try {
            const text = await ocrRecognize(b64)  // 调用你的 OCR API
            console.log(`🖼️ 第 ${i + 1} 张识别成功`)
            results.push(text)
        } catch (err: any) {
            console.error(`❌ 第 ${i + 1} 张识别失败：`, err?.message || err)
            results.push('')
        }
    }

    console.log('✅ 全部 OCR 识别完成。')
    return results
}

async function main() {
    const url = 'http://222.198.123.127/login'
    const tag = 'img'
    const className = 'captcha'

    const results = await fetchAndRecognize(url, tag, className)
    console.log('\n最终识别结果：')
    results.forEach((txt, i) => console.log(`第 ${i + 1} 张：${txt}`))
}

main().catch(console.error)
