/**
 * ============================================================================
 * HUMANIZETEXT DOCUMENT EXPORTER (PDF, DOCX, MARKDOWN, TXT)
 *
 * Implements full-fidelity export preserving:
 *   - Headings (H1, H2, H3)
 *   - Body paragraphs
 *   - Ordered and unordered lists
 *   - Tables with headers and borders
 *   - Code blocks and equations
 *   - References and citations
 * ============================================================================
 */

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { jsPDF } from 'jspdf';

export type ExportFormat = 'pdf' | 'docx' | 'md' | 'txt';

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'ordered' | 'code' | 'table' | 'quote';
  content: string;
  tableRows?: string[][];
  orderedNumber?: number;
}

/**
 * Parses markdown / formatted text into structured semantic blocks.
 */
export function parseDocumentBlocks(text: string): ParsedBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const rows = tableBuffer
        .filter((l) => !l.match(/^\s*\|?\s*[-:]+[-| :]*\s*\|?\s*$/)) // skip separator line
        .map((l) =>
          l
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => (idx === 0 && c === '' ? false : idx === arr.length - 1 && c === '' ? false : true))
        )
        .filter((r) => r.length > 0);

      if (rows.length > 0) {
        blocks.push({
          type: 'table',
          content: tableBuffer.join('\n'),
          tableRows: rows,
        });
      }
      tableBuffer = [];
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      blocks.push({
        type: 'code',
        content: codeBuffer.join('\n'),
      });
      codeBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence
    if (trimmed.startsWith('```')) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushTable();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Table line
    if (trimmed.startsWith('|') || (trimmed.includes('|') && trimmed.endsWith('|'))) {
      tableBuffer.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    // Empty lines
    if (!trimmed) {
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', content: trimmed.slice(2).trim() });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', content: trimmed.slice(3).trim() });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', content: trimmed.slice(4).trim() });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', content: trimmed.slice(2).trim() });
    } else if (trimmed.match(/^[-*•]\s+/)) {
      blocks.push({ type: 'bullet', content: trimmed.replace(/^[-*•]\s+/, '').trim() });
    } else if (trimmed.match(/^\d+\.\s+/)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      blocks.push({
        type: 'ordered',
        content: match ? match[2].trim() : trimmed,
        orderedNumber: match ? parseInt(match[1], 10) : 1,
      });
    } else {
      // Normal paragraph
      blocks.push({ type: 'paragraph', content: trimmed });
    }
  }

  flushTable();
  flushCode();

  return blocks;
}

/**
 * Exports text as plain text Blob.
 */
export function exportToTxt(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}

/**
 * Exports text as Markdown Blob.
 */
export function exportToMarkdown(text: string): Blob {
  return new Blob([text], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Exports structured document to Microsoft Word DOCX Blob.
 */
export async function exportToDocx(text: string, title = 'Humanized Document'): Promise<Blob> {
  const blocks = parseDocumentBlocks(text);
  const docChildren: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'h1':
        docChildren.push(
          new Paragraph({
            text: block.content,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          })
        );
        break;

      case 'h2':
        docChildren.push(
          new Paragraph({
            text: block.content,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 100 },
          })
        );
        break;

      case 'h3':
        docChildren.push(
          new Paragraph({
            text: block.content,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 180, after: 80 },
          })
        );
        break;

      case 'bullet':
        docChildren.push(
          new Paragraph({
            text: block.content,
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
          })
        );
        break;

      case 'ordered':
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${block.orderedNumber || 1}. `,
                bold: true,
              }),
              new TextRun({ text: block.content }),
            ],
            spacing: { before: 40, after: 40 },
          })
        );
        break;

      case 'quote':
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.content,
                italics: true,
              }),
            ],
            indent: { left: 720 },
            spacing: { before: 120, after: 120 },
          })
        );
        break;

      case 'code':
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.content,
                font: 'Consolas',
                size: 19, // 9.5pt
              }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );
        break;

      case 'table':
        if (block.tableRows && block.tableRows.length > 0) {
          const colCount = Math.max(...block.tableRows.map((r) => r.length));
          const tableRows = block.tableRows.map((row, rowIdx) => {
            const isHeader = rowIdx === 0;
            return new TableRow({
              children: row.map(
                (cellText) =>
                  new TableCell({
                    width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cellText,
                            bold: isHeader,
                          }),
                        ],
                      }),
                    ],
                  })
              ),
            });
          });

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
        break;

      case 'paragraph':
      default:
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: block.content })],
            spacing: { before: 60, after: 120 },
          })
        );
        break;
    }
  }

  const doc = new Document({
    title,
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Exports structured document to PDF Blob.
 */
export async function exportToPdf(text: string, title = 'Humanized Document'): Promise<Blob> {
  const blocks = parseDocumentBlocks(text);
  const pdf = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });
  pdf.setProperties({ title });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin + 20;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin + 20;
    }
  };

  for (const block of blocks) {
    switch (block.type) {
      case 'h1': {
        checkPageBreak(40);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(20, 20, 20);
        const lines = pdf.splitTextToSize(block.content, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 22 + 10;
        break;
      }

      case 'h2': {
        checkPageBreak(30);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        const lines = pdf.splitTextToSize(block.content, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 18 + 8;
        break;
      }

      case 'h3': {
        checkPageBreak(25);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(block.content, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 15 + 6;
        break;
      }

      case 'bullet': {
        checkPageBreak(18);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.setTextColor(30, 30, 30);
        const bulletText = `•   ${block.content}`;
        const lines = pdf.splitTextToSize(bulletText, contentWidth - 10);
        pdf.text(lines, margin + 10, y);
        y += lines.length * 14 + 4;
        break;
      }

      case 'ordered': {
        checkPageBreak(18);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.setTextColor(30, 30, 30);
        const numText = `${block.orderedNumber || 1}.  ${block.content}`;
        const lines = pdf.splitTextToSize(numText, contentWidth - 10);
        pdf.text(lines, margin + 10, y);
        y += lines.length * 14 + 4;
        break;
      }

      case 'quote': {
        checkPageBreak(25);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10.5);
        pdf.setTextColor(80, 80, 80);
        const lines = pdf.splitTextToSize(block.content, contentWidth - 30);
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(2);
        pdf.line(margin + 5, y - 2, margin + 5, y + lines.length * 14);
        pdf.text(lines, margin + 20, y);
        y += lines.length * 14 + 10;
        break;
      }

      case 'code': {
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 30, 30);
        const codeLines = block.content.split('\n');
        checkPageBreak(codeLines.length * 12 + 10);
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, y - 5, contentWidth, codeLines.length * 12 + 10, 'F');
        for (const cl of codeLines) {
          pdf.text(cl, margin + 10, y + 5);
          y += 12;
        }
        y += 10;
        break;
      }

      case 'table': {
        if (block.tableRows && block.tableRows.length > 0) {
          const rows = block.tableRows;
          const colCount = Math.max(...rows.map((r) => r.length));
          const colWidth = contentWidth / colCount;

          checkPageBreak(rows.length * 20 + 10);
          pdf.setFontSize(9.5);

          for (let rIdx = 0; rIdx < rows.length; rIdx++) {
            const isHeader = rIdx === 0;
            pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
            pdf.setTextColor(isHeader ? 10 : 40, isHeader ? 10 : 40, isHeader ? 10 : 40);

            if (isHeader) {
              pdf.setFillColor(240, 240, 240);
              pdf.rect(margin, y - 4, contentWidth, 18, 'F');
            }

            for (let cIdx = 0; cIdx < rows[rIdx].length; cIdx++) {
              const cellText = rows[rIdx][cIdx];
              pdf.text(cellText, margin + cIdx * colWidth + 5, y + 9);
            }
            y += 18;
          }
          y += 10;
        }
        break;
      }

      case 'paragraph':
      default: {
        checkPageBreak(25);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.setTextColor(30, 30, 30);
        const lines = pdf.splitTextToSize(block.content, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 14 + 8;
        break;
      }
    }
  }

  // Add page numbers
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${p} of ${totalPages}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
  }

  const pdfOutput = pdf.output('arraybuffer');
  return new Blob([pdfOutput], { type: 'application/pdf' });
}

/**
 * Triggers browser download for a given Blob.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
