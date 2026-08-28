import os
import sys
import zipfile
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_script_or_style = False

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.in_script_or_style = True
        elif tag in ('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'div'):
            self.text_parts.append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.in_script_or_style = False
        elif tag in ('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'div'):
            self.text_parts.append('\n')

    def handle_data(self, data):
        if not self.in_script_or_style:
            clean = data.strip()
            if clean:
                self.text_parts.append(clean + ' ')

    def get_text(self):
        full = ''.join(self.text_parts)
        full = re.sub(r'[ \t]+', ' ', full)
        full = re.sub(r'\n\s*\n+', '\n\n', full)
        return full.strip()

def extract_epub_metadata_and_toc(epub_path):
    info = {
        'filename': os.path.basename(epub_path),
        'title': os.path.splitext(os.path.basename(epub_path))[0],
        'files_count': 0,
        'toc': [],
        'text_sample': '',
        'size_mb': os.path.getsize(epub_path) / (1024 * 1024)
    }
    
    try:
        with zipfile.ZipFile(epub_path, 'r') as z:
            info['files_count'] = len(z.namelist())
            
            # Find NCX or NAV
            ncx_files = [n for n in z.namelist() if n.lower().endswith('.ncx')]
            html_files = [n for n in z.namelist() if n.lower().endswith(('.html', '.xhtml', '.htm'))]
            
            if ncx_files:
                try:
                    ncx_data = z.read(ncx_files[0])
                    root = ET.fromstring(ncx_data)
                    for navpoint in root.iter():
                        if navpoint.tag.endswith('navLabel'):
                            text_el = list(navpoint.iter())
                            for t in text_el:
                                if t.tag.endswith('text') and t.text:
                                    t_clean = t.text.strip()
                                    if t_clean and t_clean not in info['toc']:
                                        info['toc'].append(t_clean)
                except Exception:
                    pass
            
            if not info['toc'] and html_files:
                for h_name in html_files[:25]:
                    try:
                        content = z.read(h_name).decode('utf-8', errors='ignore')
                        headers = re.findall(r'<h[1-3][^>]*>(.*?)</h[1-3]>', content, flags=re.IGNORECASE | re.DOTALL)
                        for h in headers:
                            h_clean = re.sub(r'<[^>]+>', '', h).strip()
                            if h_clean and len(h_clean) < 120 and h_clean not in info['toc']:
                                info['toc'].append(h_clean)
                    except Exception:
                        pass
                        
    except Exception as e:
        info['error'] = str(e)
        
    return info

def main():
    kb_dir = r"C:\Users\TMS\Desktop\Workspace\04_Coding\KnowledgeBase\Finance & Trading"
    output_dir = r"c:\Users\TMS\Desktop\Workspace\04_Coding\vibe-coding\Vibe-Trading\agent\src\knowledge"
    os.makedirs(output_dir, exist_ok=True)
    
    epub_files = [os.path.join(kb_dir, f) for f in os.listdir(kb_dir) if f.endswith('.epub')]
    print(f"Scanning {len(epub_files)} EPUBs from {kb_dir}...")
    
    catalog = []
    for ep in sorted(epub_files):
        print(f"Processing: {os.path.basename(ep)}...")
        meta = extract_epub_metadata_and_toc(ep)
        catalog.append(meta)
        
    catalog_md_path = os.path.join(output_dir, "KNOWLEDGE_BASE_CATALOG.md")
    with open(catalog_md_path, "w", encoding="utf-8") as f:
        f.write("# 📚 Financial & Quantitative Trading Knowledge Base Catalog\n\n")
        f.write(f"Tổng hợp **{len(catalog)}** tài liệu chuyên sâu từ thư viện `Finance & Trading`.\n\n")
        f.write("## 📋 Danh mục sách & Mục lục chi tiết (Table of Contents)\n\n")
        
        for idx, book in enumerate(catalog, 1):
            f.write(f"### {idx}. {book['title']}\n")
            f.write(f"- **Dung lượng:** `{book['size_mb']:.2f} MB`\n")
            f.write(f"- **Số file nội dung:** `{book['files_count']}` files\n")
            f.write(f"- **Mục lục / Chủ đề chính ({len(book['toc'])} mục):**\n")
            if book['toc']:
                for item in book['toc'][:30]:
                    f.write(f"  * {item}\n")
                if len(book['toc']) > 30:
                    f.write(f"  * ... và {len(book['toc']) - 30} mục khác.\n")
            else:
                f.write("  * (Trích xuất tiêu đề tự động)\n")
            f.write("\n---\n\n")
            
    print(f"Catalog successfully written to {catalog_md_path}")

if __name__ == "__main__":
    main()
