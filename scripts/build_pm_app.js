const fs = require('fs');
const path = require('path');

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'pm_questions.json'), 'utf8'));
console.log('Total questions to process:', questions.length);

// Generate clear beginner explanations for each question
const enrichedQuestions = questions.map(q => {
  let techExplain = '';
  
  // Custom explanations based on topic/keywords
  const kw = q.keywords ? q.keywords.toLowerCase() : '';
  const text = (q.question + ' ' + q.correct).toLowerCase();
  
  if (text.includes('quản lý tích hợp') || text.includes('vai trò quan trọng nhất')) {
    techExplain = `<strong>Bản chất:</strong> Người quản lý dự án (Project Manager - PM) là 'nhạc trưởng' điều phối toàn bộ các mảng (phạm vi, thời gian, chi phí, chất lượng, nhân sự, rủi ro) để gắn kết thành một thể thống nhất.<br><strong>Chi tiết kỹ thuật:</strong> Quản lý tích hợp (Project Integration Management) là trách nhiệm độc quyền của người quản lý dự án, không thể ủy quyền hoàn toàn cho bên khác.`;
  } else if (text.includes('dự án phần mềm là') || text.includes('nỗ lực tạm thời')) {
    techExplain = `<strong>Bản chất:</strong> Dự án có 2 đặc tính cốt lõi: <em>Tạm thời</em> (có thời điểm bắt đầu và kết thúc rõ ràng) và <em>Duy nhất</em> (tạo ra sản phẩm/dịch vụ mới chưa từng có trước đó).<br><strong>Chi tiết kỹ thuật:</strong> Dự án phần mềm khác với công việc vận hành thường nhật (Operations) ở chỗ nó không lặp đi lặp lại vô tận mà là một nỗ lực hữu hạn về mặt thời gian.`;
  } else if (text.includes('lập kế hoạch') && text.includes('mục đích')) {
    techExplain = `<strong>Bản chất:</strong> Lập kế hoạch giúp trả lời 3 câu hỏi lớn: Làm cái gì (kích thước/phạm vi), Bao lâu thì xong (thời gian), và Tốn bao nhiêu tiền (chi phí).<br><strong>Chi tiết kỹ thuật:</strong> Đây là 'tam giác ràng buộc' (Triple Constraint) cơ bản trong quản lý dự án.`;
  } else if (text.includes('tổ chức theo dự án') || text.includes('quyền lực cao nhất')) {
    techExplain = `<strong>Bản chất:</strong> Trong mô hình tổ chức thuần dự án (Projectized Organization), PM nắm toàn quyền quyết định về nhân sự và ngân sách.<br><strong>Chi tiết kỹ thuật:</strong> So sánh quyền lực PM: <em>Projectized (Cao nhất)</em> > <em>Strong Matrix</em> > <em>Balanced Matrix</em> > <em>Weak Matrix</em> > <em>Functional (Thấp nhất - Giám đốc chức năng nắm quyền)</em>.`;
  } else if (text.includes('maslow') || text.includes('tháp nhu cầu')) {
    techExplain = `<strong>Bản chất:</strong> Tháp nhu cầu Maslow gồm 5 tầng từ đáy lên đỉnh: 1. Sinh lý (ăn, mặc, ở) $\\rightarrow$ 2. An toàn $\\rightarrow$ 3. Xã hội/Giao tiếp $\\rightarrow$ 4. Được tôn trọng $\\rightarrow$ 5. Tự hoàn thiện/Khẳng định mình (đỉnh tháp).<br><strong>Chi tiết kỹ thuật:</strong> Con người phải được thỏa mãn các nhu cầu sinh học ở đáy tháp trước khi hướng tới các nhu cầu cao hơn.`;
  } else if (text.includes('cv') || text.includes('sv') || text.includes('cpi') || text.includes('spi') || text.includes('giá trị thu được') || text.includes('evm')) {
    techExplain = `<strong>Bản chất:</strong> Kỹ thuật Quản lý Giá trị Thu được (Earned Value Management - EVM):<br>• <strong>CV = EV - AC</strong> (Chênh lệch chi phí): CV > 0 là tiết kiệm chi phí, CV < 0 là vượt ngân sách.<br>• <strong>SV = EV - PV</strong> (Chênh lệch tiến độ): SV > 0 là vượt tiến độ, SV < 0 là chậm tiến độ.<br>• <strong>CPI = EV / AC</strong> (Chỉ số hiệu quả chi phí): CPI > 1 là tốt.<br>• <strong>SPI = EV / PV</strong> (Chỉ số hiệu quả tiến độ): SPI > 1 là tốt.`;
  } else if (text.includes('wbs') || text.includes('cấu trúc phân rã công việc')) {
    techExplain = `<strong>Bản chất:</strong> WBS (Work Breakdown Structure) là kỹ thuật 'chia để trị', phân tách toàn bộ công việc dự án thành các gói công việc (Work Packages) nhỏ hơn, dễ quản lý và ước lượng hơn.<br><strong>Chi tiết kỹ thuật:</strong> WBS là nền tảng để xây dựng lịch biểu tiến độ và dự toán ngân sách chi phí.`;
  } else if (text.includes('rủi ro') || text.includes('quản lý rủi ro')) {
    techExplain = `<strong>Bản chất:</strong> Quản lý rủi ro gồm 3 bước cốt lõi: Nhận diện rủi ro $\\rightarrow$ Phân tích (định tính/định lượng mức độ tác động & xác suất) $\\rightarrow$ Lập kế hoạch ứng phó (Né tránh, Chuyển giao, Giảm thiểu, Chấp nhận).<br><strong>Chi tiết kỹ thuật:</strong> Rủi ro ưu tiên xử lý là những rủi ro có xác suất xảy ra cao và mức độ tổn thất nghiêm trọng.`;
  } else if (text.includes('thu thập yêu cầu') || text.includes('phỏng vấn') || text.includes('họp nhóm')) {
    techExplain = `<strong>Bản chất:</strong> Phỏng vấn trực tiếp (1-1) là cách thu thập yêu cầu sâu sắc và hiệu quả nhất vì tương tác trực tiếp, nhưng tốn nhiều thời gian và chi phí. Họp nhóm (Focus Group / JAD) giúp thu thập nhanh từ nhiều bên liên quan.<br><strong>Chi tiết kỹ thuật:</strong> Quy trình kỹ nghệ yêu cầu: Thu thập $\\rightarrow$ Phân tích $\\rightarrow$ Đặc tả $\\rightarrow$ Thẩm định/Đánh giá.`;
  } else if (text.includes('điểm chức năng') || text.includes('function point') || text.includes('use case point')) {
    techExplain = `<strong>Bản chất:</strong> Phương pháp Function Point (FP) và Use Case Point (UCP) dùng để đo đạc 'kích thước chức năng' của phần mềm độc lập với ngôn ngữ lập trình, từ đó suy ra số giờ công và chi phí cần thiết.<br><strong>Chi tiết kỹ thuật:</strong> Quy trình: Tính điểm thô $\\rightarrow$ Đánh giá hệ số phức tạp kỹ thuật/môi trường $\\rightarrow$ Tính điểm hiệu chỉnh.`;
  } else {
    techExplain = `<strong>Bản chất:</strong> Đáp án chính xác là <strong>${q.correct}</strong> theo đúng nguyên lý và tiêu chuẩn Quản lý dự án phần mềm.<br><strong>Chi tiết kỹ thuật:</strong> ${q.tip_correct ? q.tip_correct.replace(/Gắn đáp án.*?với từ khóa/g, 'Nội dung gắn liền với khái niệm').replace(/[“”]/g, '"') : 'Khái niệm quan trọng trong quy trình phát triển và kiểm soát dự án phần mềm.'}`;
  }

  // Format tips without emojis
  let tipText = q.tip_question || q.tip_correct || '';
  tipText = tipText.replace(/Nhìn cụm.*?để gọi lại đáp án/g, 'Từ khóa nhận diện:').replace(/[“”]/g, '"');

  let diffText = q.tip_elimination || '';
  diffText = diffText.replace(/Đối chiếu phần khác biệt.*?loại các phương án sai/g, 'Điểm phân biệt:').replace(/[“”]/g, '"');

  return {
    id: q.id,
    question: q.question,
    correct: q.correct,
    wrongs: q.wrongs,
    explanation: techExplain,
    tip: tipText,
    distinguish: diffText
  };
});

// Escape script closing tags
const safeQuestionsJson = JSON.stringify(enrichedQuestions).replace(/<\/script/gi, '<\\/script');

// Generate 100vh Widescreen HTML for 150 Questions
const html = `<!DOCTYPE html>
<html lang="vi" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hệ Thống Ôn Thi Quản Lý Dự Án Phần Mềm - 150 Câu Hỏi</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <!-- Lucide Icons Script -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    /* ========== THEME PALETTES ========== */
    :root {
      /* Dark Theme (Default) */
      --bg-main: #090a0c;
      --bg-surface: #121316;
      --bg-surface-elevated: #181a1f;
      --bg-surface-hover: #20232a;
      
      --border-subtle: #23262d;
      --border-medium: #323640;
      --border-focus: #70b4ff;
      
      --text-primary: #f3f4f6;
      --text-secondary: #9ca3af;
      --text-tertiary: #6b7280;
      --text-brand: #8ecbff;
      
      --brand-primary: #70b4ff;
      --brand-glow: rgba(112, 180, 255, 0.12);
      --brand-border: rgba(112, 180, 255, 0.35);
      
      --color-success: #34d399;
      --color-success-bg: rgba(52, 211, 153, 0.1);
      --color-success-border: rgba(52, 211, 153, 0.35);
      
      --color-danger: #f87171;
      --color-danger-bg: rgba(248, 113, 113, 0.1);
      --color-danger-border: rgba(248, 113, 113, 0.35);

      --code-bg: #090a0c;
      --code-color: #93c5fd;
      --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.35);
      --modal-overlay-bg: rgba(0, 0, 0, 0.75);

      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    [data-theme="light"] {
      /* Light Theme */
      --bg-main: #f8fafc;
      --bg-surface: #ffffff;
      --bg-surface-elevated: #f1f5f9;
      --bg-surface-hover: #e2e8f0;
      
      --border-subtle: #e2e8f0;
      --border-medium: #cbd5e1;
      --border-focus: #3b82f6;
      
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #94a3b8;
      --text-brand: #0284c7;
      
      --brand-primary: #0284c7;
      --brand-glow: rgba(2, 132, 199, 0.08);
      --brand-border: rgba(2, 132, 199, 0.28);
      
      --color-success: #059669;
      --color-success-bg: rgba(16, 185, 129, 0.08);
      --color-success-border: rgba(16, 185, 129, 0.3);
      
      --color-danger: #dc2626;
      --color-danger-bg: rgba(239, 68, 68, 0.08);
      --color-danger-border: rgba(239, 68, 68, 0.25);

      --code-bg: #f1f5f9;
      --code-color: #0369a1;
      --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.06);
      --modal-overlay-bg: rgba(15, 23, 42, 0.45);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background-color: var(--bg-main);
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.22s ease, color 0.22s ease;
    }

    .mono {
      font-family: var(--font-mono);
    }

    /* Widescreen 100vh Container: 1160px for 150 questions */
    .app-container {
      max-width: 1160px;
      width: 100%;
      height: 100vh;
      height: 100dvh;
      margin: 0 auto;
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    /* Header */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-brand);
      font-family: var(--font-mono);
      background: var(--brand-glow);
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid var(--brand-border);
    }

    .header-title {
      font-size: 16.5px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.18s ease;
      background: var(--bg-surface);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      user-select: none;
      text-decoration: none;
    }

    .btn:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
      border-color: var(--border-medium);
    }

    .btn:active {
      transform: translateY(1px);
    }

    .btn-brand {
      background: var(--brand-glow);
      color: var(--text-brand);
      border-color: var(--brand-border);
    }

    .btn-brand:hover {
      background: rgba(112, 180, 255, 0.22);
      border-color: var(--brand-primary);
      color: var(--text-brand);
    }

    [data-theme="light"] .btn-brand:hover {
      background: rgba(2, 132, 199, 0.15);
      border-color: var(--brand-primary);
    }

    /* Main Grid Layout */
    .main-layout {
      flex: 1;
      display: grid;
      grid-template-columns: 330px 1fr;
      gap: 14px;
      min-height: 0;
    }

    /* Left Sidebar: Score + 150 Question Palette */
    .sidebar-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
    }

    /* Stats Card */
    .stats-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: var(--shadow-card);
      flex-shrink: 0;
    }

    .stats-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .stat-items-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-icon {
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
    }

    .stat-label {
      font-size: 10.5px;
      color: var(--text-secondary);
    }

    .stat-value {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .stat-value-sub {
      color: var(--text-tertiary);
      font-weight: 400;
      font-size: 11px;
    }

    .percentage-badge {
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
      color: var(--text-brand);
      background: var(--brand-glow);
      padding: 2px 7px;
      border-radius: 5px;
      border: 1px solid var(--brand-border);
    }

    /* Progress bar */
    .progress-track {
      width: 100%;
      height: 5px;
      background: var(--bg-surface-elevated);
      border-radius: 99px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #8ecbff);
      border-radius: 99px;
      transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    [data-theme="light"] .progress-fill {
      background: linear-gradient(90deg, #0284c7, #38bdf8);
    }

    /* Palette Box for 150 questions */
    .palette-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 10px 12px;
      box-shadow: var(--shadow-card);
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .palette-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .palette-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .palette-filters {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-chip {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-tertiary);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-family: var(--font-mono);
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-chip:hover {
      border-color: var(--border-medium);
      color: var(--text-secondary);
    }

    .filter-chip.active {
      background: var(--bg-surface-elevated);
      border-color: var(--brand-border);
      color: var(--text-brand);
      font-weight: 600;
    }

    /* 6-Column Grid for 150 Questions */
    .chips-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 4px;
      overflow-y: auto;
      padding-right: 4px;
      flex: 1;
      min-height: 0;
    }

    .chips-grid::-webkit-scrollbar {
      width: 4px;
    }
    .chips-grid::-webkit-scrollbar-track {
      background: transparent;
    }
    .chips-grid::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: 4px;
    }

    .q-chip {
      height: 29px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      font-size: 11px;
      font-family: var(--font-mono);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-elevated);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .q-chip:hover {
      border-color: var(--border-medium);
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    .q-chip.active {
      border-color: var(--brand-primary) !important;
      color: var(--text-primary) !important;
      background: var(--brand-glow) !important;
      font-weight: 700;
      box-shadow: 0 0 0 1px var(--brand-primary);
    }

    .q-chip.correct {
      border-color: var(--color-success-border);
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .q-chip.wrong {
      border-color: var(--color-danger-border);
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    /* Right Main Content Panel: Question & Workspace */
    .workspace-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .q-index-pill {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--text-brand);
      background: var(--brand-glow);
      padding: 3px 9px;
      border-radius: 5px;
      border: 1px solid var(--brand-border);
      font-weight: 600;
    }

    .q-reset-btn {
      background: none;
      border: none;
      color: var(--text-tertiary);
      font-size: 11.5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: color 0.15s;
    }

    .q-reset-btn:hover {
      color: var(--text-secondary);
    }

    /* Scrollable Question, Options & Explanation Area */
    .scroll-content {
      flex: 1;
      overflow-y: auto;
      padding-right: 6px;
      min-height: 0;
    }

    .scroll-content::-webkit-scrollbar {
      width: 5px;
    }
    .scroll-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .scroll-content::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: 4px;
    }

    .question-content {
      font-size: 15.5px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 16px;
      white-space: pre-wrap;
      line-height: 1.65;
      font-family: var(--font-sans);
    }

    /* Options List */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
    }

    .option-btn {
      width: 100%;
      text-align: left;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 11px 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      transition: all 0.16s ease;
      color: var(--text-primary);
      font-size: 13.5px;
      font-family: inherit;
    }

    .option-btn:hover:not(:disabled) {
      border-color: var(--border-medium);
      background: var(--bg-surface-hover);
      transform: translateX(2px);
    }

    .option-letter {
      width: 22px;
      height: 22px;
      border-radius: 5px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-secondary);
      flex-shrink: 0;
      margin-top: 1px;
    }

    .option-text {
      flex: 1;
      font-family: var(--font-sans);
      font-size: 13.5px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .option-icon {
      flex-shrink: 0;
      margin-top: 2px;
      display: flex;
      align-items: center;
    }

    /* Option States */
    .option-btn.state-correct {
      background: var(--color-success-bg) !important;
      border-color: var(--color-success-border) !important;
      color: var(--color-success);
      font-weight: 500;
    }
    .option-btn.state-correct .option-letter {
      background: var(--color-success);
      color: #fff;
      border-color: var(--color-success);
    }

    .option-btn.state-wrong {
      background: var(--color-danger-bg) !important;
      border-color: var(--color-danger-border) !important;
      color: var(--color-danger);
    }
    .option-btn.state-wrong .option-letter {
      background: var(--color-danger);
      color: #fff;
      border-color: var(--color-danger);
    }

    .option-btn.state-dim {
      opacity: 0.45;
      cursor: default;
    }

    /* Explanation Box */
    .explanation-panel {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 10px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      width: fit-content;
    }

    .status-banner.is-correct {
      background: var(--color-success-bg);
      color: var(--color-success);
      border: 1px solid var(--color-success-border);
    }

    .status-banner.is-wrong {
      background: var(--color-danger-bg);
      color: var(--color-danger);
      border: 1px solid var(--color-danger-border);
    }

    .explain-block {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 11px 13px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .explain-icon {
      color: var(--text-brand);
      flex-shrink: 0;
      margin-top: 2px;
      display: flex;
      align-items: center;
    }

    .explain-icon.tip-icon {
      color: #f59e0b;
    }

    .explain-icon.diff-icon {
      color: #8b5cf6;
    }

    .explain-text-wrap {
      flex: 1;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .explain-title {
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
      font-size: 12.5px;
    }

    .explain-text-wrap code {
      font-family: var(--font-mono);
      background: var(--code-bg);
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
      color: var(--code-color);
      border: 1px solid var(--border-subtle);
    }

    /* Fixed Bottom Footer inside Workspace */
    .workspace-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .nav-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
    }

    .nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }

    .shortcuts-hint {
      font-size: 11.5px;
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .kbd {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      padding: 2px 5px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--text-secondary);
    }

    /* Modal dialog */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--modal-overlay-bg);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      max-width: 420px;
      width: 100%;
      padding: 22px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }

    .modal-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .modal-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 18px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Responsive for Tablet / Mobile */
    @media (max-width: 820px) {
      html, body {
        overflow-y: auto;
        height: auto;
      }
      .app-container {
        height: auto;
        padding: 12px;
      }
      .main-layout {
        grid-template-columns: 1fr;
        height: auto;
      }
      .sidebar-panel {
        height: auto;
      }
      .chips-grid {
        max-height: 150px;
        grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
      }
      .workspace-panel {
        height: auto;
      }
      .scroll-content {
        overflow-y: visible;
      }
    }
  </style>
</head>
<body>

  <div class="app-container">
    <!-- Header -->
    <header>
      <div class="header-info">
        <div class="badge-tag">
          <i data-lucide="sparkles" style="width:13px; height:13px;"></i>
          Quản Lý Dự Án
        </div>
        <h1 class="header-title">Ôn Tập Quản Lý Phần Mềm (150 Câu)</h1>
      </div>
      <div class="header-actions">
        <!-- Theme Toggle Button -->
        <button id="btn-theme-toggle" class="btn" title="Chuyển đổi giao diện Sáng / Tối">
          <i id="theme-icon" data-lucide="sun" style="width:13px; height:13px;"></i>
          <span id="theme-text">Sáng</span>
        </button>

        <button id="btn-shuffle" class="btn" title="Xáo trộn vị trí các đáp án A/B/C/D">
          <i data-lucide="shuffle" style="width:13px; height:13px;"></i>
          <span>Xáo đáp án</span>
        </button>
        <button id="btn-reset-all" class="btn" title="Làm lại toàn bộ 150 câu">
          <i data-lucide="rotate-ccw" style="width:13px; height:13px;"></i>
          <span>Làm lại</span>
        </button>
      </div>
    </header>

    <!-- Main 2-Column Dashboard Layout (100vh) -->
    <div class="main-layout">
      <!-- Left Column: Score + 150 Questions Palette -->
      <aside class="sidebar-panel">
        <!-- Stats Card -->
        <div class="stats-card">
          <div class="stats-grid">
            <div class="stat-items-group">
              <div class="stat-item">
                <div class="stat-icon"><i data-lucide="trophy" style="width:15px; height:15px;"></i></div>
                <div>
                  <div class="stat-label">Điểm số</div>
                  <div class="stat-value"><span id="val-correct">0</span> <span class="stat-value-sub">/ 150</span></div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon"><i data-lucide="target" style="width:15px; height:15px;"></i></div>
                <div>
                  <div class="stat-label">Đã làm</div>
                  <div class="stat-value"><span id="val-answered">0</span> <span class="stat-value-sub">/ 150</span></div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon" style="color: var(--color-danger);"><i data-lucide="x-circle" style="width:15px; height:15px;"></i></div>
                <div>
                  <div class="stat-label">Sai</div>
                  <div class="stat-value"><span id="val-wrong">0</span></div>
                </div>
              </div>
            </div>
            <div class="percentage-badge" id="val-percentage">0%</div>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="progress-bar" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Question Palette Grid (6 Columns for 150 questions) -->
        <div class="palette-box">
          <div class="palette-header">
            <div class="palette-title">
              <i data-lucide="layout-grid" style="width:14px; height:14px; color: var(--text-brand);"></i>
              <span>Bảng câu hỏi (1 - 150)</span>
            </div>
            <div class="palette-filters">
              <button class="filter-chip active" data-filter="all">Tất cả</button>
              <button class="filter-chip" data-filter="unanswered">Chưa làm</button>
              <button class="filter-chip" data-filter="correct">Đúng</button>
              <button class="filter-chip" data-filter="wrong">Sai</button>
            </div>
          </div>
          <div class="chips-grid" id="chips-container">
            <!-- Question chips injected by JS -->
          </div>
        </div>
      </aside>

      <!-- Right Column: Question Content, Options, Explanation & Bottom Navigation -->
      <main class="workspace-panel">
        <div class="card-meta">
          <div class="q-index-pill" id="q-index-text">Câu 1 / 150</div>
          <button class="q-reset-btn" id="btn-reset-current" title="Làm lại câu này">
            <i data-lucide="refresh-cw" style="width:12px; height:12px;"></i>
            <span>Làm lại câu này</span>
          </button>
        </div>

        <!-- Scrollable Middle Section -->
        <div class="scroll-content">
          <div class="question-content" id="q-text">Đang tải nội dung câu hỏi...</div>

          <div class="options-list" id="options-container">
            <!-- Options injected by JS -->
          </div>

          <!-- Explanation Panel -->
          <div class="explanation-panel" id="explanation-container" style="display: none;">
            <div id="status-banner" class="status-banner">
              <!-- Status icon + text -->
            </div>

            <div class="explain-block">
              <div class="explain-icon">
                <i data-lucide="book-open" style="width:15px; height:15px;"></i>
              </div>
              <div class="explain-text-wrap">
                <div class="explain-title">Giải thích kỹ thuật (Dễ hiểu cho người mới học)</div>
                <div id="explain-tech-text"></div>
              </div>
            </div>

            <div class="explain-block" id="block-tip">
              <div class="explain-icon tip-icon">
                <i data-lucide="lightbulb" style="width:15px; height:15px;"></i>
              </div>
              <div class="explain-text-wrap">
                <div class="explain-title">Mẹo nhớ nhanh khi đi thi</div>
                <div id="explain-tip-text"></div>
              </div>
            </div>

            <div class="explain-block" id="block-distinguish">
              <div class="explain-icon diff-icon">
                <i data-lucide="split" style="width:15px; height:15px;"></i>
              </div>
              <div class="explain-text-wrap">
                <div class="explain-title">Phân biệt & Bẫy cần tránh</div>
                <div id="explain-distinguish-text"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fixed Footer inside Workspace -->
        <footer class="workspace-footer">
          <div class="shortcuts-hint">
            <span>Phím: <span class="kbd">A</span> <span class="kbd">B</span> <span class="kbd">C</span> <span class="kbd">D</span></span>
            <span>•</span>
            <span><span class="kbd">←</span> <span class="kbd">→</span></span>
            <span>•</span>
            <span><span class="kbd">R</span> Làm lại</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn nav-btn" id="btn-prev">
              <i data-lucide="chevron-left" style="width:15px; height:15px;"></i>
              <span>Câu trước</span>
            </button>
            <button class="btn nav-btn btn-brand" id="btn-next">
              <span>Câu tiếp theo</span>
              <i data-lucide="chevron-right" style="width:15px; height:15px;"></i>
            </button>
          </div>
        </footer>
      </main>
    </div>
  </div>

  <!-- Modal Confirm Reset All -->
  <div class="modal-overlay" id="reset-modal">
    <div class="modal-box">
      <h3 class="modal-title">Làm lại từ đầu?</h3>
      <p class="modal-desc">Toàn bộ tiến độ và kết quả làm bài của 150 câu hỏi sẽ được thiết lập lại từ đầu.</p>
      <div class="modal-actions">
        <button class="btn" id="btn-modal-cancel">Hủy</button>
        <button class="btn btn-brand" id="btn-modal-confirm">Xác nhận làm lại</button>
      </div>
    </div>
  </div>

  <script>
    // --- 150 QUESTIONS DATA ---
    const RAW_QUESTIONS = ` + safeQuestionsJson + `;

    const STORAGE_KEY_ANSWERS = 'quiz_pm_answers';
    const STORAGE_KEY_INDEX = 'quiz_pm_current_index';
    const STORAGE_KEY_SHUFFLE = 'quiz_pm_shuffle_enabled';
    const STORAGE_KEY_THEME = 'quiz_pm_theme_mode';

    const LETTERS = ['A', 'B', 'C', 'D'];

    // Seeded shuffle function to keep stable option order per question unless shuffle button toggled
    function seededShuffle(arr, seed) {
      let s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      const rnd = function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // App State
    let currentIndex = 0;
    let userAnswers = {}; // { [questionId]: optionIndex }
    let shuffleSeedOffset = 0;
    let isShuffleMode = false;
    let activeFilter = 'all'; // 'all' | 'unanswered' | 'correct' | 'wrong'
    let currentTheme = 'dark'; // 'dark' | 'light'

    // Load from LocalStorage
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
      if (savedAnswers) userAnswers = JSON.parse(savedAnswers);
      const savedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
      if (savedIndex !== null) currentIndex = parseInt(savedIndex, 10) || 0;
      if (currentIndex < 0 || currentIndex >= RAW_QUESTIONS.length) currentIndex = 0;
      isShuffleMode = localStorage.getItem(STORAGE_KEY_SHUFFLE) === 'true';

      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        currentTheme = savedTheme;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        currentTheme = 'light';
      }
    } catch(e) {
      console.warn('LocalStorage error:', e);
    }

    // DOM Elements
    const htmlElement = document.documentElement;
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    const qIndexText = document.getElementById('q-index-text');
    const qText = document.getElementById('q-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationContainer = document.getElementById('explanation-container');
    const statusBanner = document.getElementById('status-banner');
    const explainTechText = document.getElementById('explain-tech-text');
    const explainTipText = document.getElementById('explain-tip-text');
    const explainDistinguishText = document.getElementById('explain-distinguish-text');
    const blockTip = document.getElementById('block-tip');
    const blockDistinguish = document.getElementById('block-distinguish');

    const valCorrect = document.getElementById('val-correct');
    const valAnswered = document.getElementById('val-answered');
    const valWrong = document.getElementById('val-wrong');
    const valPercentage = document.getElementById('val-percentage');
    const progressBar = document.getElementById('progress-bar');
    const chipsContainer = document.getElementById('chips-container');

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnResetCurrent = document.getElementById('btn-reset-current');
    const btnResetAll = document.getElementById('btn-reset-all');
    const btnShuffle = document.getElementById('btn-shuffle');

    const resetModal = document.getElementById('reset-modal');
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalConfirm = document.getElementById('btn-modal-confirm');

    // Theme Management
    function applyTheme(theme) {
      currentTheme = theme;
      htmlElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
      } catch(e) {}

      if (theme === 'light') {
        themeText.textContent = 'Tối';
        themeIcon.setAttribute('data-lucide', 'moon');
      } else {
        themeText.textContent = 'Sáng';
        themeIcon.setAttribute('data-lucide', 'sun');
      }

      if (window.lucide) {
        lucide.createIcons();
      }
    }

    btnThemeToggle.addEventListener('click', () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });

    // Build question options list
    function getQuestionOptions(q) {
      const baseList = [
        { text: q.correct, isCorrect: true },
        ...q.wrongs.map(w => ({ text: w, isCorrect: false }))
      ];
      if (isShuffleMode) {
        return seededShuffle(baseList, (q.id * 41 + 17 + shuffleSeedOffset));
      } else {
        return seededShuffle(baseList, (q.id * 37 + 11));
      }
    }

    // Render Stats
    function updateStats() {
      const total = RAW_QUESTIONS.length;
      let correctCount = 0;
      let wrongCount = 0;
      let answeredCount = 0;

      RAW_QUESTIONS.forEach(q => {
        const pickedIdx = userAnswers[q.id];
        if (pickedIdx !== undefined) {
          answeredCount++;
          const opts = getQuestionOptions(q);
          if (opts[pickedIdx] && opts[pickedIdx].isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      });

      valCorrect.textContent = correctCount;
      valAnswered.textContent = answeredCount;
      valWrong.textContent = wrongCount;

      const pct = answeredCount > 0 ? Math.round((correctCount / total) * 100) : 0;
      valPercentage.textContent = pct + '%';
      progressBar.style.width = ((answeredCount / total) * 100) + '%';

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(userAnswers));
        localStorage.setItem(STORAGE_KEY_INDEX, currentIndex.toString());
      } catch(e) {}
    }

    // Render Palette Chips
    function renderPalette() {
      chipsContainer.innerHTML = '';
      RAW_QUESTIONS.forEach((q, idx) => {
        const picked = userAnswers[q.id];
        const isAnswered = picked !== undefined;
        let isCorrect = false;
        if (isAnswered) {
          const opts = getQuestionOptions(q);
          isCorrect = opts[picked] && opts[picked].isCorrect;
        }

        // Apply filters
        let visible = true;
        if (activeFilter === 'unanswered' && isAnswered) visible = false;
        if (activeFilter === 'correct' && (!isAnswered || !isCorrect)) visible = false;
        if (activeFilter === 'wrong' && (!isAnswered || isCorrect)) visible = false;

        const chip = document.createElement('button');
        chip.className = 'q-chip';
        chip.textContent = q.id;
        chip.setAttribute('title', 'Câu ' + q.id);

        if (idx === currentIndex) chip.classList.add('active');
        if (isAnswered) {
          if (isCorrect) chip.classList.add('correct');
          else chip.classList.add('wrong');
        }

        if (!visible) {
          chip.style.display = 'none';
        }

        chip.addEventListener('click', () => {
          goToQuestion(idx);
        });

        chipsContainer.appendChild(chip);
      });
    }

    // Render Current Question
    function renderCurrentQuestion() {
      const q = RAW_QUESTIONS[currentIndex];
      const options = getQuestionOptions(q);
      const pickedIdx = userAnswers[q.id];
      const isAnswered = pickedIdx !== undefined;

      qIndexText.textContent = 'Câu ' + q.id + ' / ' + RAW_QUESTIONS.length;
      qText.textContent = q.question;

      // Render Options
      optionsContainer.innerHTML = '';
      options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.disabled = isAnswered;

        const isUserPick = pickedIdx === idx;

        if (isAnswered) {
          if (opt.isCorrect) {
            btn.classList.add('state-correct');
          } else if (isUserPick && !opt.isCorrect) {
            btn.classList.add('state-wrong');
          } else {
            btn.classList.add('state-dim');
          }
        }

        const letterBox = document.createElement('div');
        letterBox.className = 'option-letter';
        letterBox.textContent = LETTERS[idx] || (idx + 1);

        const textSpan = document.createElement('div');
        textSpan.className = 'option-text';
        textSpan.textContent = opt.text;

        const iconBox = document.createElement('div');
        iconBox.className = 'option-icon';
        if (isAnswered && opt.isCorrect) {
          iconBox.innerHTML = '<i data-lucide="check" style="width:16px; height:16px; color: var(--color-success);"></i>';
        } else if (isAnswered && isUserPick && !opt.isCorrect) {
          iconBox.innerHTML = '<i data-lucide="x" style="width:16px; height:16px; color: var(--color-danger);"></i>';
        }

        btn.appendChild(letterBox);
        btn.appendChild(textSpan);
        btn.appendChild(iconBox);

        btn.addEventListener('click', () => {
          if (userAnswers[q.id] === undefined) {
            userAnswers[q.id] = idx;
            updateStats();
            renderCurrentQuestion();
            renderPalette();
          }
        });

        optionsContainer.appendChild(btn);
      });

      // Render Explanation
      if (isAnswered) {
        const isCorrect = options[pickedIdx] && options[pickedIdx].isCorrect;
        explanationContainer.style.display = 'flex';

        statusBanner.className = 'status-banner ' + (isCorrect ? 'is-correct' : 'is-wrong');
        statusBanner.innerHTML = isCorrect
          ? '<i data-lucide="check-circle-2" style="width:16px; height:16px;"></i> <span>Chính xác! Làm rất tốt.</span>'
          : '<i data-lucide="alert-circle" style="width:16px; height:16px;"></i> <span>Chưa chính xác. Xem kỹ lời giải dưới đây.</span>';

        explainTechText.innerHTML = q.explanation;

        if (q.tip) {
          blockTip.style.display = 'flex';
          explainTipText.textContent = q.tip;
        } else {
          blockTip.style.display = 'none';
        }

        if (q.distinguish) {
          blockDistinguish.style.display = 'flex';
          explainDistinguishText.textContent = q.distinguish;
        } else {
          blockDistinguish.style.display = 'none';
        }
      } else {
        explanationContainer.style.display = 'none';
      }

      // Update Nav Buttons
      btnPrev.disabled = currentIndex === 0;
      btnNext.disabled = currentIndex === RAW_QUESTIONS.length - 1;

      // Scroll active chip into view inside palette
      const activeChip = chipsContainer.children[currentIndex];
      if (activeChip) {
        activeChip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }

      // Re-initialize Lucide icons
      if (window.lucide) {
        lucide.createIcons();
      }
    }

    function goToQuestion(index) {
      if (index >= 0 && index < RAW_QUESTIONS.length) {
        currentIndex = index;
        renderCurrentQuestion();
        renderPalette();
      }
    }

    // Event Listeners
    btnPrev.addEventListener('click', () => goToQuestion(currentIndex - 1));
    btnNext.addEventListener('click', () => goToQuestion(currentIndex + 1));

    btnResetCurrent.addEventListener('click', () => {
      const q = RAW_QUESTIONS[currentIndex];
      delete userAnswers[q.id];
      updateStats();
      renderCurrentQuestion();
      renderPalette();
    });

    btnResetAll.addEventListener('click', () => {
      resetModal.classList.add('open');
    });

    btnModalCancel.addEventListener('click', () => {
      resetModal.classList.remove('open');
    });

    btnModalConfirm.addEventListener('click', () => {
      userAnswers = {};
      currentIndex = 0;
      updateStats();
      renderCurrentQuestion();
      renderPalette();
      resetModal.classList.remove('open');
    });

    btnShuffle.addEventListener('click', () => {
      isShuffleMode = !isShuffleMode;
      shuffleSeedOffset = Math.floor(Math.random() * 1000) + 1;
      localStorage.setItem(STORAGE_KEY_SHUFFLE, isShuffleMode.toString());
      if (isShuffleMode) {
        btnShuffle.classList.add('btn-brand');
        btnShuffle.querySelector('span').textContent = 'Đang xáo';
      } else {
        btnShuffle.classList.remove('btn-brand');
        btnShuffle.querySelector('span').textContent = 'Xáo đáp án';
      }
      renderCurrentQuestion();
      renderPalette();
    });

    // Palette filter buttons
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        renderPalette();
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (resetModal.classList.contains('open')) {
        if (e.key === 'Escape') resetModal.classList.remove('open');
        return;
      }

      // Ignore when user is pressing shortcut combinations like Ctrl+C, Ctrl+A, Cmd+C...
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toUpperCase();
      const q = RAW_QUESTIONS[currentIndex];

      // Options A, B, C, D or 1, 2, 3, 4
      let optIdx = -1;
      if (key === 'A' || key === '1') optIdx = 0;
      else if (key === 'B' || key === '2') optIdx = 1;
      else if (key === 'C' || key === '3') optIdx = 2;
      else if (key === 'D' || key === '4') optIdx = 3;

      if (optIdx !== -1 && userAnswers[q.id] === undefined) {
        userAnswers[q.id] = optIdx;
        updateStats();
        renderCurrentQuestion();
        renderPalette();
        return;
      }

      if (e.key === 'ArrowLeft') {
        goToQuestion(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        goToQuestion(currentIndex + 1);
      } else if (key === 'R') {
        delete userAnswers[q.id];
        updateStats();
        renderCurrentQuestion();
        renderPalette();
      }
    });

    // Initialize
    applyTheme(currentTheme);
    if (isShuffleMode) {
      btnShuffle.classList.add('btn-brand');
      btnShuffle.querySelector('span').textContent = 'Đang xáo';
    }
    updateStats();
    renderCurrentQuestion();
    renderPalette();
  </script>
</body>
</html>`;

const targetWorkspace = path.join(__dirname, '..', 'quan_ly_phan_mem.html');
const targetDownloads = 'C:/Users/TMS/Downloads/Quan_Ly_Phan_Mem.html';

fs.writeFileSync(targetWorkspace, html, 'utf8');
console.log('Saved to workspace:', targetWorkspace);

try {
  fs.writeFileSync(targetDownloads, html, 'utf8');
  console.log('Saved to Downloads:', targetDownloads);
} catch (err) {
  console.warn('Could not write to downloads:', err.message);
}
