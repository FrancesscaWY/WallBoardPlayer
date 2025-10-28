/// <reference types="node" />
import axios from 'axios';
import qs from 'qs';

/** ======== 配置部分 ======== */
const BASE_URL = 'http://222.198.126.33:3001';
const LOGIN_URL = `${BASE_URL}/api/login`;
const OCR_URL = `${BASE_URL}/api/ocr`;

// ✅ 账号信息（可以改成环境变量）
const USERNAME = 'apricityx';
const PASSWORD = '520520Linux';
const CLIENT_ID = '';
const CLIENT_SECRET = '';

/** 获取 access_token */
async function getAccessToken(): Promise<string> {
    const data = qs.stringify({
        username: USERNAME,
        password: PASSWORD,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
    });

    const res = await axios.post(LOGIN_URL, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const token = res.data?.access_token;
    if (!token) throw new Error('未返回 access_token');
    return token;
}

/**
 * 识别图片中的文本
 * @param imgBase64 - 图片的 base64 字符串（不含 data:image/png;base64, 前缀）
 * @returns Promise<string> 识别出的文本内容
 */
export async function ocrRecognize(imgBase64: string): Promise<string> {
    // 1️⃣ 登录并获取 token
    const token = await getAccessToken();

    // 2️⃣ 调用 OCR 接口
    const res = await axios.post(
        OCR_URL,
        { img_base64: imgBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    // 3️⃣ 提取识别结果
    const result = res.data?.text || res.data?.result || JSON.stringify(res.data);
    return result;
}

// /** ======== 测试入口 ======== */
// if (import.meta.url === `file://${process.argv[1]}`) {
//     import('fs').then(async (fs) => {
//         try {
//             const img = fs.readFileSync('./public/imgs/img.png');
//             const base64 = img.toString('base64');
//             const text = await ocrRecognize(base64);
//             console.log('✅ 识别结果：', text);
//         } catch (err: any) {
//             console.error('❌ 错误：', err.response?.data || err.message);
//         }
//     });
// }
