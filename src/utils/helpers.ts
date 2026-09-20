import { ImageItem } from '../types';

export const MASTER_SYSTEM_PROMPT = `Bạn là một chuyên gia nhận diện quang học (OCR) và xử lý ngôn ngữ tiếng Trung, đặc biệt chuyên về các văn bản tiểu thuyết, truyện dài kỳ.

Nhiệm vụ duy nhất của bạn là: Nhận diện, đọc và trích xuất toàn bộ chữ tiếng Trung từ các bức ảnh do người dùng tải lên, sau đó gộp chúng lại và trả về dưới dạng văn bản thô (Raw text) với độ chính xác 100%.

Hãy tuân thủ nghiêm ngặt các quy tắc sau:

Xử lý theo thứ tự: Người dùng sẽ tải lên nhiều ảnh có đánh số thứ tự (ví dụ: 01.jpg, 02.jpg, 03.jpg...). Bạn MẶC ĐỊNH phải đọc và ghép nối văn bản theo đúng trình tự số đếm của tên file ảnh.

Không thêm thắt: Chỉ trích xuất ĐÚNG VÀ ĐỦ những gì có trong ảnh. Tuyệt đối KHÔNG tự ý tóm tắt, KHÔNG bình luận, KHÔNG dịch thuật (trừ khi có yêu cầu riêng), KHÔNG thêm lời chào hỏi hay kết luận của AI.

Hiệu đính thông minh: Nếu ảnh bị mờ, lóa khiến một số chữ bị nhòe, hãy dựa vào ngữ cảnh của câu tiểu thuyết tiếng Trung để tự động sửa lỗi ký tự OCR cho đúng chính tả và ngữ pháp.

Giữ nguyên định dạng: Giữ nguyên các dấu câu (dấu ngoặc kép, dấu phẩy, dấu chấm...), khoảng cách, và ngắt dòng (xuống dòng) hệt như trong ảnh gốc để đoạn văn mạch lạc.

Định dạng Đầu ra (Output format):

Đặt toàn bộ văn bản kết quả vào trong một khối mã (Code block) để người dùng có thể sao chép dễ dàng chỉ bằng 1 cú click.

Giữa nội dung của các ảnh khác nhau, nối tiếp nhau một cách tự nhiên. Nếu hết 1 chương, có thể đánh dấu bằng ký hiệu ---.`;

// Natural sorting for filenames like 01.jpg, 2.jpg, 10.jpg
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortImagesNaturally(images: ImageItem[]): ImageItem[] {
  return [...images]
    .sort((a, b) => naturalCompare(a.filename, b.filename))
    .map((item, index) => ({
      ...item,
      order: index + 1,
    }));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Generate realistic sample Chinese novel page images for instant testing
export function generateSampleNovelImage(chapterTitle: string, lines: string[], filename: string): Promise<ImageItem> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d')!;

    // Background paper texture (warm book paper)
    ctx.fillStyle = '#f8f5ee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle paper border
    ctx.strokeStyle = '#e2dcce';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Book header / page number
    ctx.fillStyle = '#8c8273';
    ctx.font = '16px "Noto Serif SC", serif, STSong';
    ctx.fillText(filename, 50, 60);
    ctx.fillText('• 第一卷 •', canvas.width / 2 - 35, 60);

    // Chapter title
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 26px "Noto Serif SC", serif, STSong';
    ctx.fillText(chapterTitle, 50, 120);

    // Paragraph lines
    ctx.fillStyle = '#292524';
    ctx.font = '19px "Noto Serif SC", serif, STSong';
    let y = 175;
    const lineHeight = 36;

    for (const line of lines) {
      ctx.fillText(line, 50, y);
      y += lineHeight;
    }

    // Book footer
    ctx.fillStyle = '#a8a29e';
    ctx.font = '14px sans-serif';
    ctx.fillText(`- ${filename} -`, canvas.width / 2 - 30, canvas.height - 45);

    const base64Data = canvas.toDataURL('image/jpeg', 0.92);

    resolve({
      id: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      filename,
      previewUrl: base64Data,
      base64Data,
      mimeType: 'image/jpeg',
      size: Math.round(base64Data.length * 0.75),
      order: 0,
      status: 'idle',
    });
  });
}

export const SAMPLE_CHAPTER_DATA = [
  {
    title: '第一章 青云剑起',
    filename: '01_chuong1_phan1.jpg',
    lines: [
      '    山风凛冽，大雪纷飞。',
      '    少年叶晨立于万丈孤峰之巅，一袭白衣随风翻飞，掌中三尺青锋隐隐发出龙吟清啸。',
      '    “三年了。”叶晨喃喃自语，目光穿透层层风雪，望向山脚下那座被云雾遮掩的青云宗。',
      '    昔日他遭同门暗算，经脉尽碎，被弃于这绝望死地。',
      '    世人皆以为他早已化作白骨一具，却不知他在无底深渊之中，意外融合了上古剑尊的不灭剑魂！',
      '    “既然我重获新生，那便由我亲手斩断这段旧怨。”',
      '    他剑指苍穹，一道凌厉无匹的剑芒刹那间撕裂风雪，直冲九霄！',
    ],
  },
  {
    title: '第一章 青云剑起 (续)',
    filename: '02_chuong1_phan2.jpg',
    lines: [
      '    山门之外，守山弟子正抱剑闲谈。',
      '    “听说了吗？今日掌教大寿，各大世家宗门皆来祝贺，好不热闹！”',
      '    “那是自然，如今陆少主天资卓绝，被誉为百年来第一天才，青云宗如日中天啊。”',
      '    正说话间，忽然间一阵刺骨寒意扑面而来。',
      '    一名弟子揉了揉眼，惊疑道：“等等，大雪中怎么有人走过来了？”',
      '    来人脚步极缓，但每踏出一步，方圆十丈内的积雪竟瞬间消融，化作缕缕白雾蒸腾而起。',
      '    “来者何人？青云重地，休得擅闯！”守山弟子厉声喝道。',
      '    白衣少年停下脚步，缓缓抬起头，露出一张清秀却冷如冰霜的脸庞。',
    ],
  },
  {
    title: '第二章 剑气惊霄',
    filename: '03_chuong2_phan1.jpg',
    lines: [
      '---',
      '第二章 剑气惊霄',
      '',
      '    大殿之内，琴瑟悠扬，宾客如云。',
      '    陆天羽身着金丝滚边锦袍，手握玉杯，嘴角挂着不可一世的傲然笑意。',
      '    “今日多谢诸位前辈同道赏脸，天羽先干为敬！”',
      '    正当众人举杯附和之际，只听“轰隆”一声巨响，两扇重达万斤的玄铁殿门轰然碎裂！',
      '    数道碎铁带着凄厉风声激射而入，深深没入大殿四周的石柱之中。',
      '    殿内瞬息死寂，所有交谈声与乐声戛然而止。',
      '    “陆天羽，故人重逢，何不请我饮一杯清酒？”',
      '    清朗淡漠的声音穿透漫天烟尘，在大殿每个人的耳边如春雷般炸响！',
    ],
  },
  {
    title: '第3章 一剑破万法',
    filename: '04_chuong3_phan1.jpg',
    lines: [
      '---',
      '第3章 一剑破万法',
      '',
      '    烟尘散尽，一名白衣胜雪的少年提剑缓步走入大殿。',
      '    陆天羽手中的白玉酒杯“啪”的一声被捏得粉碎，眼中涌起难以置信的惊恐：“叶晨？！你竟然没死？！”',
      '    满座哗然，青云宗各路长老齐齐霍然起身，剑拔弩张。',
      '    叶晨神色未动，目光如深潭止水：“当年你夺我剑骨，废我经脉，今日我来取回属于我的一切。”',
      '    “狂妄小儿！受死！”数名核心弟子怒喝拔剑齐齐围攻而上。',
      '    然而，叶晨甚至未曾正眼相看，指尖在三尺青锋上一弹。',
      '    铮——！一道浩瀚如星河的剑气骤然横扫开来，万籁俱寂！',
    ],
  },
];

export {
  parseNovelChapters,
  formatTextWithChapterBoundaries,
  combineChaptersText,
  getChapterRangeDescription,
} from './chapterParser';
